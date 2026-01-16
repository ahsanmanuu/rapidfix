const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

class InvoiceManager {
    constructor() {
        this.transporter = null;
        this.initTransporter();
    }

    initTransporter() {
        // Configure using environment variables
        // If not set, it will log a warning but not crash
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
            console.log('[InvoiceManager] SMTP Transporter Initialized');
        } else {
            console.warn('[InvoiceManager] SMTP credentials missing. Email sharing will be simulated.');
        }
    }

    async generateInvoice(job) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const buffers = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => resolve(Buffer.concat(buffers)));

                this._generateHeader(doc);
                this._generateCustomerInformation(doc, job);
                this._generateInvoiceTable(doc, job);
                this._generateFooter(doc);

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }

    _generateHeader(doc) {
        const logoPath = path.join(__dirname, '../logo.png'); // Ensure a logo.png exists in server root
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 45, { width: 50 });
        } else {
            // Fallback if no logo
            doc.fillColor('#10b981') // Emerald-500
                .fontSize(20)
                .font('Helvetica-Bold')
                .text('Fixofy', 50, 50);
        }

        doc
            .fillColor('#333333')
            .fontSize(20)
            .font('Helvetica-Bold')
            .text('Fixofy Inc.', 200, 50, { align: 'right' })
            .fontSize(10)
            .font('Helvetica')
            .text('Tech Hub, Silicon Valley', 200, 65, { align: 'right' })
            .text('Mumbai, India 400001', 200, 80, { align: 'right' })
            .text('support@fixofy.com', 200, 95, { align: 'right' })
            .moveDown();
    }

    _generateCustomerInformation(doc, job) {
        doc.fillColor('#444444').fontSize(20).text('INVOICE', 50, 160);

        this._generateHr(doc, 185);

        const customerName = job.contactName || job.customer?.name || 'Valued Customer';
        const customerPhone = job.contactPhone || job.customer?.phone || '';
        const address = job.address || job.location?.address || 'Site Location';
        const date = new Date(job.completedAt || job.updatedAt || Date.now()).toLocaleDateString();
        const invoiceId = `INV-${job.id.substring(0, 8).toUpperCase()}`;

        doc.fontSize(10).font('Helvetica-Bold').text('Bill To:', 50, 200);
        doc.font('Helvetica').text(customerName, 50, 215)
            .text(customerPhone, 50, 230)
            .text(address, 50, 245, { width: 250 });

        doc.font('Helvetica-Bold').text('Invoice Details:', 350, 200);
        doc.font('Helvetica')
            .text('Invoice No:', 350, 215).text(invoiceId, 430, 215, { align: 'right' })
            .text('Date:', 350, 230).text(date, 430, 230, { align: 'right' })
            .text('Technician:', 350, 245).text(job.technician?.name || 'N/A', 430, 245, { align: 'right' });

        this._generateHr(doc, 270);
    }

    _generateInvoiceTable(doc, job) {
        let i = 290;
        const currency = "Rs. ";

        // Table Header
        doc.font('Helvetica-Bold');
        this._generateTableRow(doc, i, 'Service Description', 'Rate', 'Qty', 'Amount');
        this._generateHr(doc, i + 20);

        // Table Rows
        doc.font('Helvetica');
        i += 30;

        const serviceName = job.serviceType || 'General Service';
        const description = job.description || 'Service Charges';
        const price = parseFloat(job.offerPrice || job.visitingCharges || 0);

        // Item 1: Service Type
        this._generateTableRow(doc, i, serviceName, price.toFixed(2), '1', price.toFixed(2));
        i += 20;

        // Item 2: Description (small)
        doc.fontSize(8).fillColor('#777777')
            .text(description.substring(0, 80) + (description.length > 80 ? '...' : ''), 50, i);

        doc.fillColor('#444444').fontSize(10);

        // Totals Section
        const subtotalPos = i + 50;
        this._generateHr(doc, subtotalPos - 10);

        doc.font('Helvetica-Bold');
        this._generateTableRow(doc, subtotalPos, '', '', 'Total:', currency + price.toFixed(2));
        doc.font('Helvetica');
    }

    _generateFooter(doc) {
        doc.fontSize(10).text('Thank you for choosing Fixofy.', 50, 700, { align: 'center', width: 500 });
        doc.fontSize(8).fillColor('#777777')
            .text('Payment is due upon receipt. This is a computer-generated invoice.', 50, 715, { align: 'center', width: 500 });
    }

    _generateTableRow(doc, y, c1, c2, c3, c4) {
        doc.fontSize(10)
            .text(c1, 50, y, { width: 230 })
            .text(c2, 280, y, { width: 90, align: 'right' })
            .text(c3, 370, y, { width: 90, align: 'right' })
            .text(c4, 0, y, { align: 'right' }); // Right aligned to margin
    }

    _generateHr(doc, y) {
        doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
    }

    async sendInvoiceEmail(job, pdfBuffer, manualRecipients = []) {
        if (!this.transporter) {
            console.log('[InvoiceManager] Simulation: Sending to', manualRecipients);
            return { success: true, simulated: true };
        }

        try {
            // [FIX] Auto-Add Recipients: Customer, Tech, Admin, SuperAdmin
            const recipients = new Set(manualRecipients);

            if (job.customer?.email) recipients.add(job.customer.email);
            if (job.technician?.email) recipients.add(job.technician.email); // Need to ensure email is in enriched tech data

            // Add Admins (Hardcoded for now as per plan, or fetch from env/db)
            if (process.env.ADMIN_EMAIL) recipients.add(process.env.ADMIN_EMAIL);
            // Default fallback admin email if none
            recipients.add('admin@fixofy.com');

            const toList = [...recipients].filter(e => e); // Clean valid emails

            const mailOptions = {
                from: '"Fixofy Accounts" <' + (process.env.SMTP_USER || 'no-reply@fixofy.com') + '>',
                to: toList.join(', '), // Send to all
                subject: `Invoice for Job #${job.id} - Fixofy`,
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #10b981;">Job Completed</h2>
                        <p>Hello,</p>
                        <p>The job <strong>#${job.id}</strong> has been successfully completed.</p>
                        <p>Please find the attached invoice for your records.</p>
                        <br/>
                        <p><strong>Service:</strong> ${job.serviceType}</p>
                        <p><strong>Total Amount:</strong> Rs. ${job.offerPrice || job.visitingCharges || 0}</p>
                        <br/>
                        <p>Thank you for using Fixofy!</p>
                    </div>
                `,
                attachments: [{
                    filename: `Invoice-${job.id}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }]
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('[InvoiceManager] Invoice sent to:', toList.join(', '));
            return { success: true, messageId: info.messageId };
        } catch (err) {
            console.error('[InvoiceManager] Email Error:', err);
            return { success: false, error: err.message };
        }
    }
}

module.exports = InvoiceManager;
