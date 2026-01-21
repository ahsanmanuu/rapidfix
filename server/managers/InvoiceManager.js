const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

const Database = require('./DatabaseLoader');

class InvoiceManager {
    constructor(settingsManager, adminManager, storageManager, jobManager) {
        this.transporter = null;
        this.settingsManager = settingsManager;
        this.adminManager = adminManager;
        this.storageManager = storageManager;
        this.jobManager = jobManager;
        this.db = new Database('invoices'); // specialized DB accessor for invoices
        this.initTransporter();
    }

    setJobManager(jobManager) {
        this.jobManager = jobManager;
    }

    async getOrGenerateInvoice(jobId) {
        try {
            // 1. Fetch Job
            const job = await this.jobManager.getJob(jobId);
            if (!job) throw new Error('Job not found');

            // 2. STRICT Status Check
            if (job.status !== 'completed') {
                throw new Error('Invoice cannot be generated for incomplete jobs.');
            }

            // 3. Generate PDF (Real-time)
            // We always generate fresh to ensure data is up-to-date
            const buffer = await this.generateInvoice(job);

            // 4. Async: Sync to Storage & Database (Fire and Forget or Await based on need)
            // We don't await this to speed up the download response, 
            // BUT we catch errors to ensure NO unhandled rejections crash the server.
            (async () => {
                try {
                    await this._syncInvoiceToStorageAndDb(job, buffer);
                } catch (err) {
                    console.error('[InvoiceManager] Background sync failed:', err);
                }
            })();

            return { buffer };
        } catch (e) {
            console.error('[InvoiceManager] getOrGenerateInvoice failed:', e);
            throw e;
        }
    }

    async createAndSaveInvoice(job) {
        try {
            if (job.status !== 'completed') {
                console.warn('[InvoiceManager] createAndSaveInvoice called for non-completed job:', job.id);
                return null;
            }

            const buffer = await this.generateInvoice(job);

            // Sync Storage & DB
            const url = await this._syncInvoiceToStorageAndDb(job, buffer);

            // Send Email
            await this.sendInvoiceEmail(job, buffer);

            return { buffer, url };
        } catch (e) {
            console.error('[InvoiceManager] Creation failed:', e);
            // Don't throw if just email/storage fails, mainly we want the flow to continue
            // But if generation fails, it's an issue.
            return null;
        }
    }

    // Helper to handle Storage Upload AND Database Record Upsert
    async _syncInvoiceToStorageAndDb(job, buffer) {
        if (!this.storageManager) return null;

        try {
            const fileName = `invoices/${job.id}-${Date.now()}.pdf`;
            const publicUrl = await this.storageManager.uploadBuffer(buffer, 'invoices', fileName, 'application/pdf');

            // Upsert into 'invoices' table
            if (publicUrl) {
                const amount = job.totalCost || job.offerPrice || 0;
                const invoiceData = {
                    job_id: job.id,
                    invoice_number: `INV-${job.id.substring(0, 8).toUpperCase()}`,
                    amount: amount,
                    pdf_url: publicUrl,
                    status: 'issued',
                    created_at: new Date().toISOString()
                };

                // Use the 'invoices' DB accessor
                // We want to upsert based on job_id if possible, or just insert new. 
                // Since our 'invoices' table has ID PK, finding by job_id is better.

                // Check existing
                const existing = await this.db.find('job_id', job.id);
                if (existing) {
                    console.log(`[InvoiceManager] Updating existing invoice record for Job ${job.id}`);
                    // Removing explicit updated_at to prevent schema cache errors if the column is problematic
                    // Most PG setups use triggers for this anyway.
                    const { updated_at, ...updateData } = invoiceData;
                    await this.db.update('id', existing.id, updateData);
                } else {
                    console.log(`[InvoiceManager] Creating new invoice record for Job ${job.id}`);
                    // Correct method is 'add', not 'create'
                    await this.db.add(invoiceData);
                }

                console.log(`[InvoiceManager] Successfully synced invoice for Job ${job.id} to DB and Storage.`);

                // Update 'jobs' table for redundancy/quick access
                await this.jobManager.updateJob(job.id, {
                    invoice_url: publicUrl
                });
            }
            return publicUrl;
        } catch (err) {
            console.error('[InvoiceManager] _syncInvoiceToStorageAndDb error:', err);
            return null;
        }
    }

    initTransporter() {
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: false,
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
        console.log(`[InvoiceManager] Generating PDF for Job ${job.id}`);
        // Fetch Dynamic Settings
        const settings = this.settingsManager ? await this.settingsManager.getSettings() : {};

        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const buffers = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const finalBuffer = Buffer.concat(buffers);
                    console.log(`[InvoiceManager] PDF Generation Completed for Job ${job.id}. Size: ${finalBuffer.length} bytes`);

                    if (finalBuffer.length > 0) {
                        const header = finalBuffer.slice(0, 20).toString('utf-8');
                        const hex = finalBuffer.slice(0, 10).toString('hex');
                        console.log(`[InvoiceManager] PDF Header Check: "${header}" (Hex: ${hex})`);
                        // Verify content presence
                        if (finalBuffer.length > 1000) {
                            console.log(`[InvoiceManager] PDF Content Verification: File is large enough (${finalBuffer.length} bytes) to contain data.`);
                        }
                    } else {
                        console.warn('[InvoiceManager] WARNING: PDF Buffer is EMPTY!');
                    }

                    resolve(finalBuffer);
                });
                doc.on('error', (err) => {
                    console.error(`[InvoiceManager] PDF Stream Error:`, err);
                    reject(err);
                });

                this._generateHeader(doc, settings);
                this._generateCustomerInformation(doc, job);
                this._generateInvoiceTable(doc, job, settings);
                this._generateFooter(doc, settings);

                doc.end();
            } catch (err) {
                console.error(`[InvoiceManager] PDF Logic Error:`, err);
                reject(err);
            }
        });
    }

    _generateHeader(doc, settings) {
        // Priority: 1. Base64/Path from Settings 2. Default File 3. Text Fallback
        let logoLoaded = false;

        // Try Settings Logo (Handle Base64 or Path)
        if (settings.logoUrl) {
            try {
                // If base64
                if (settings.logoUrl.startsWith('data:image')) {
                    doc.image(settings.logoUrl, 50, 45, { width: 50 });
                    logoLoaded = true;
                }
                // If local path (ensure it's safe/absolute if needed, or assume relative to root)
                else if (fs.existsSync(settings.logoUrl)) {
                    doc.image(settings.logoUrl, 50, 45, { width: 50 });
                    logoLoaded = true;
                }
            } catch (e) {
                console.warn('[InvoiceManager] Failed to load custom logo:', e.message);
            }
        }

        if (!logoLoaded) {
            const logoPath = path.join(__dirname, '../logo.png');
            try {
                if (fs.existsSync(logoPath)) {
                    doc.image(logoPath, 50, 45, { width: 50 });
                    logoLoaded = true;
                }
            } catch (err) { }
        }

        if (!logoLoaded) {
            doc.fillColor('#10b981')
                .fontSize(20)
                .font('Helvetica-Bold')
                .text(settings.companyName || 'Fixofy', 50, 50);
        }

        // Company Details from Settings
        const companyName = settings.companyName || 'Fixofy Inc.';
        const companyAddress = settings.companyAddress || 'Tech Hub, Silicon Valley\nMumbai, India 400001';
        // Split address lines
        const addressLines = companyAddress.split('\n');

        doc.fillColor('#333333')
            .fontSize(20)
            .font('Helvetica-Bold')
            .text(companyName, 200, 50, { align: 'right' })
            .fontSize(10)
            .font('Helvetica');

        let y = 65;
        addressLines.forEach(line => {
            doc.text(line, 200, y, { align: 'right' });
            y += 15;
        });

        doc.text(settings.companyEmail || 'support@fixofy.com', 200, y, { align: 'right' })

        if (settings.companyPhone) {
            doc.text(settings.companyPhone, 200, y + 15, { align: 'right' });
        }

        doc.moveDown();
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

    _generateInvoiceTable(doc, job, settings) {
        let i = 290;
        const currency = "Rs. ";

        doc.font('Helvetica-Bold');
        this._generateTableRow(doc, i, 'Service Description', 'Rate', 'Qty', 'Amount');
        this._generateHr(doc, i + 20);

        doc.font('Helvetica');
        i += 30;

        const serviceName = job.serviceType || 'General Service';
        const description = job.description || 'Service Charges';
        const basePrice = parseFloat(job.offerPrice || job.visitingCharges || 0);

        this._generateTableRow(doc, i, serviceName, basePrice.toFixed(2), '1', basePrice.toFixed(2));
        i += 20;

        doc.fontSize(8).fillColor('#777777')
            .text(description.substring(0, 80) + (description.length > 80 ? '...' : ''), 50, i);

        doc.fillColor('#444444').fontSize(10);

        // Subtotal
        let yPos = i + 40;
        this._generateHr(doc, yPos - 10);

        // Calculate Tax if enabled
        let total = basePrice;
        let taxAmount = 0;

        if (settings.taxRate && settings.taxRate > 0) {
            taxAmount = basePrice * (settings.taxRate / 100);
            total += taxAmount;

            this._generateTableRow(doc, yPos, '', '', 'Subtotal:', currency + basePrice.toFixed(2));
            yPos += 20;
            this._generateTableRow(doc, yPos, '', '', `${settings.taxName || 'Tax'} (${settings.taxRate}%):`, currency + taxAmount.toFixed(2));
            yPos += 20;
        }

        doc.font('Helvetica-Bold');
        this._generateTableRow(doc, yPos, '', '', 'Total:', currency + total.toFixed(2));
        doc.font('Helvetica');
    }

    _generateFooter(doc, settings) {
        const footerText = settings.footerNote || 'Thank you for choosing Fixofy.';
        doc.fontSize(10).text(footerText, 50, 700, { align: 'center', width: 500 });

        const terms = settings.terms || 'Payment is due upon receipt. This is a computer-generated invoice.';
        doc.fontSize(8).fillColor('#777777')
            .text(terms, 50, 715, { align: 'center', width: 500 });
    }

    _generateTableRow(doc, y, c1, c2, c3, c4) {
        doc.fontSize(10)
            .text(c1, 50, y, { width: 230 })
            .text(c2, 280, y, { width: 90, align: 'right' })
            .text(c3, 370, y, { width: 90, align: 'right' })
            .text(c4, 0, y, { align: 'right' });
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
            // [FIX] Distribution Logic:
            // 1. Primary Recipient: Customer (To)
            // 2. Copies: Technician, Admin (BCC) -> Prevents Reply-All storms and Dashboard leaks if threaded

            const toList = [];
            const bccList = new Set();

            // 1. Customer
            if (job.customer?.email) {
                toList.push(job.customer.email);
            } else if (job.contactEmail) { // Fallback if contactEmail exists on job
                toList.push(job.contactEmail);
            }

            // 2. Technician (BCC)
            if (job.technician?.email) bccList.add(job.technician.email);

            // 3. Admin (BCC)
            if (process.env.ADMIN_EMAIL) bccList.add(process.env.ADMIN_EMAIL);
            bccList.add('admin@fixofy.com'); // Global fallback

            // 4. Manual Recipients (e.g. from Admin trigger) treated as 'To' or 'BCC'? 
            // If manual, usually we want them to see it.
            manualRecipients.forEach(e => toList.push(e));

            // Validate
            if (toList.length === 0 && bccList.size === 0) {
                console.warn('[InvoiceManager] No valid recipients for invoice.');
                return { success: false, error: 'No recipients' };
            }

            const mailOptions = {
                from: '"Fixofy Accounts" <' + (process.env.SMTP_USER || 'no-reply@fixofy.com') + '>',
                to: toList.join(', '),
                bcc: [...bccList].join(', '), // BCC is critical for privacy
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
            console.log('[InvoiceManager] Invoice sent. To:', toList.join(', '), 'BCC:', [...bccList].join(', '));
            return { success: true, messageId: info.messageId };
        } catch (err) {
            console.error('[InvoiceManager] Email Error:', err);
            return { success: false, error: err.message };
        }
    }
}

module.exports = InvoiceManager;
