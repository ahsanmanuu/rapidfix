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

                // --- HEADER ---
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
        doc
            .fillColor('#444444')
            .fontSize(20)
            .text('Fixofy Services', 50, 57) // Mock Logo Text
            .fontSize(10)
            .text('Fixofy Inc.', 200, 50, { align: 'right' })
            .text('123 Service Street', 200, 65, { align: 'right' })
            .text('Mumbai, India 400001', 200, 80, { align: 'right' })
            .moveDown();
    }

    _generateCustomerInformation(doc, job) {
        doc
            .fillColor('#444444')
            .fontSize(20)
            .text('Invoice', 50, 160);

        this._generateHr(doc, 185);

        const customerName = job.contactName || job.customer?.name || 'Valued Customer';
        const customerPhone = job.contactPhone || job.customer?.phone || '';
        const address = job.address || job.location?.address || 'Location provided';
        const date = new Date(job.completedAt || job.updatedAt || Date.now()).toLocaleDateString();

        doc
            .fontSize(10)
            .text('Invoice Number:', 50, 200)
            .font('Helvetica-Bold')
            .text(`INV-${job.id.slice(0, 8).toUpperCase()}`, 150, 200)
            .font('Helvetica')
            .text('Invoice Date:', 50, 215)
            .text(date, 150, 215)
            .text('Amount Due:', 50, 230)
            .text(`Rs. ${job.offerPrice || job.visitingCharges || 0}`, 150, 230)

            .font('Helvetica-Bold')
            .text(customerName, 300, 200)
            .font('Helvetica')
            .text(customerPhone, 300, 215)
            .text(address, 300, 230)
            .moveDown();

        this._generateHr(doc, 252);
    }

    _generateInvoiceTable(doc, job) {
        let i = 270;

        doc.font('Helvetica-Bold');
        this._generateTableRow(doc, i, 'Item', 'Description', 'Unit Price', 'Total');
        this._generateHr(doc, i + 20);
        doc.font('Helvetica');

        i += 30;
        const description = job.description || 'Service Charges';
        const amount = parseFloat(job.offerPrice || job.visitingCharges || 0).toFixed(2);

        this._generateTableRow(doc, i, 'Service', description.substring(0, 30) + (description.length > 30 ? '...' : ''), amount, amount);

        this._generateHr(doc, i + 20);

        const subtotalPosition = i + 30;
        this._generateTableRow(doc, subtotalPosition, '', 'Subtotal', '', amount);
        this._generateTableRow(doc, subtotalPosition + 15, '', 'Tax (0%)', '', '0.00'); // Mock Tax

        doc.font('Helvetica-Bold');
        this._generateTableRow(doc, subtotalPosition + 30, '', 'Total Due', '', `Rs. ${amount}`);
        doc.font('Helvetica');
    }

    _generateFooter(doc) {
        doc
            .fontSize(10)
            .text(
                'Payment is due upon receipt. Thank you for choosing Fixofy!',
                50,
                700,
                { align: 'center', width: 500 }
            );
    }

    _generateTableRow(doc, y, item, description, unitCost, lineTotal) {
        doc
            .fontSize(10)
            .text(item, 50, y)
            .text(description, 150, y)
            .text(unitCost, 280, y, { width: 90, align: 'right' })
            .text(lineTotal, 370, y, { width: 90, align: 'right' });
    }

    _generateHr(doc, y) {
        doc
            .strokeColor('#aaaaaa')
            .lineWidth(1)
            .moveTo(50, y)
            .lineTo(550, y)
            .stroke();
    }

    async sendInvoiceEmail(job, pdfBuffer, recipients = []) {
        if (!this.transporter) {
            console.log('[InvoiceManager] Simulation: Sending email to', recipients);
            return { success: true, simulated: true };
        }

        try {
            // Default recipients: Customer and Admin
            const toList = [...recipients];
            if (job.customer?.email) toList.push(job.customer.email);
            // Deduplicate
            const uniqueRecipients = [...new Set(toList)];

            if (uniqueRecipients.length === 0) return { success: false, error: 'No recipients' };

            const mailOptions = {
                from: '"Fixofy Accounts" <no-reply@fixofy.com>',
                to: uniqueRecipients.join(', '),
                subject: `Invoice for Job #${job.id}`,
                text: `Dear Customer,\n\nPlease find attached the invoice for your recent service (Job #${job.id}).\n\nThank you for choosing Fixofy.\n\nRegards,\nThe Fixofy Team`,
                attachments: [
                    {
                        filename: `Invoice-${job.id}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('[InvoiceManager] Email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (err) {
            console.error('[InvoiceManager] Email Error:', err);
            return { success: false, error: err.message };
        }
    }
}

module.exports = InvoiceManager;
