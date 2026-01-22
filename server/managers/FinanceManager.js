const Database = require('./DatabaseLoader');
const crypto = require('crypto');
const axios = require('axios');
const PDFDocument = require('pdfkit');

// PhonePe Sandbox Credentials
const PHONEPE_HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
const MERCHANT_ID = "PGTESTPAYUAT";
const SALT_KEY = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
const SALT_INDEX = 1;

class FinanceManager {
    constructor() {
        this.db = new Database('finance');
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    _mapFromDb(txn) {
        if (!txn) return null;
        try {
            const { user_id, associated_id, created_at, ...rest } = txn;
            return {
                ...rest,
                userId: user_id,
                associatedId: associated_id,
                createdAt: created_at
            };
        } catch (err) {
            console.error("[FinanceManager] Error mapping from DB:", err);
            return txn;
        }
    }

    _mapToDb(txn) {
        if (!txn) return null;
        try {
            const { userId, associatedId, createdAt, id, ...rest } = txn;
            const mapped = { ...rest };
            if (userId !== undefined) mapped.user_id = userId;
            if (associatedId !== undefined) mapped.associated_id = associatedId;
            if (createdAt !== undefined) mapped.created_at = createdAt;
            if (id !== undefined) mapped.id = id;
            return mapped;
        } catch (err) {
            console.error("[FinanceManager] Error mapping to DB:", err);
            return txn;
        }
    }

    async createTransaction(userId, associatedId, type, amount, description) {
        try {
            const transaction = {
                userId,
                associatedId,
                type,
                amount: parseFloat(amount),
                description,
                status: 'completed',
                createdAt: new Date().toISOString()
            };
            const dbTxn = this._mapToDb(transaction);
            const saved = await this.db.add(dbTxn);
            const result = this._mapFromDb(saved);

            if (this.io) {
                this.io.to(`user_${userId}`).emit('new_transaction', result);
                const balance = await this.getBalance(userId);
                this.io.to(`user_${userId}`).emit('wallet_balance_update', { balance });
                this.io.emit('admin_finance_update', result);
            }

            return result;
        } catch (err) {
            console.error("[FinanceManager] Error creating transaction:", err);
            throw err;
        }
    }

    async processPayment(userId, amount, type, description) {
        return await this.createTransaction(userId, 'SYSTEM', type, amount, description);
    }

    async processJobPayment(userId, amount, jobId) {
        try {
            const balance = await this.getBalance(userId);
            if (balance < amount) {
                return { success: false, reason: 'insufficient_funds' };
            }

            const txn = await this.createTransaction(
                userId,
                jobId,
                'debit',
                amount,
                `Visiting Charges for Job #${jobId}` // Shortened ID usually better but standard UUID ok
            );
            return { success: true, transaction: txn };
        } catch (err) {
            console.error("[FinanceManager] Job Payment Error:", err);
            return { success: false, reason: 'error', error: err.message };
        }
    }

    async getBillsByUser(userId) {
        try {
            const txns = await this.db.findAll('user_id', userId);
            return txns.map(t => this._mapFromDb(t)).filter(t => t.type === 'debit');
        } catch (err) {
            console.error(`[FinanceManager] Error getting bills for user ${userId}:`, err);
            return [];
        }
    }

    async getBalance(userId) {
        try {
            const transactions = await this.db.findAll('user_id', userId);
            return transactions.reduce((acc, curr) => {
                const t = this._mapFromDb(curr);
                return t.type === 'credit' ? acc + t.amount : acc - t.amount;
            }, 0);
        } catch (err) {
            console.error(`[FinanceManager] Error getting balance for user ${userId}:`, err);
            return 0;
        }
    }

    async getTransactionsByLocation(lat, lng, radiusKm = 30, userManager) {
        try {
            const allTxns = await this.getAllTransactions();
            if (!lat || !lng || !userManager) return allTxns;

            const visibleUserIds = new Set(await userManager.getUserIdsByLocation(lat, lng, radiusKm));

            return allTxns.filter(t => visibleUserIds.has(t.userId));
        } catch (err) {
            console.error("[FinanceManager] Error getting transactions by location:", err);
            return [];
        }
    }

    async getTransactionsByUser(userId) {
        try {
            const txns = await this.db.findAll('user_id', userId);
            return txns.map(t => this._mapFromDb(t));
        } catch (err) {
            console.error(`[FinanceManager] Error getting txns for user ${userId}:`, err);
            return [];
        }
    }

    async getAllTransactions() {
        try {
            const txns = await this.db.read();
            return txns.map(t => this._mapFromDb(t));
        } catch (err) {
            console.error("[FinanceManager] Error getting all transactions:", err);
            return [];
        }
    }

    async getSystemWalletBalance() {
        try {
            const transactions = await this.db.read();
            return transactions.reduce((acc, curr) => {
                const t = this._mapFromDb(curr);
                return t.type === 'credit' ? acc + t.amount : acc;
            }, 0);
        } catch (err) {
            console.error("[FinanceManager] Error getting system balance:", err);
            return 0;
        }
    }

    async processMembershipPayment(userId, amount) {
        try {
            const minFee = 499;
            if (amount < minFee) throw new Error("Minimum membership fee is ₹" + minFee);

            const transaction = await this.createTransaction(
                userId,
                'SYSTEM',
                'debit',
                amount,
                'Premium Membership Purchase(30 Days)'
            );

            if (transaction) {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 30);
                return {
                    success: true,
                    tier: 'Premium',
                    expiryDate: expiryDate.toISOString(),
                    transaction
                };
            }
            return { success: false };
        } catch (err) {
            console.error("[FinanceManager] Error processing membership payment:", err);
            throw err;
        }
    }

    // [New] Helper for Auto-Assignment Algo
    async getMonthlyEarnings(userId) {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const txns = await this.db.findAll('user_id', userId);
            return txns
                .filter(t => t.type === 'credit' && t.created_at >= startOfMonth)
                .reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
        } catch (err) {
            console.error(`[FinanceManager] Error getting monthly earnings for ${userId}:`, err);
            return 0;
        }
    }

    async generateStatementPdf(userId, res) {
        try {
            const balance = await this.getBalance(userId);
            const transactions = await this.getTransactionsByUser(userId);

            const doc = new PDFDocument({ margin: 50 });

            // Headers
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=statement-${userId}-${Date.now()}.pdf`);

            doc.pipe(res);

            // Title
            doc.fontSize(20).font('Helvetica-Bold').text('Fixofy Wallet Statement', { align: 'center' });
            doc.moveDown();

            // Metadata
            doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
            doc.text(`User ID: ${userId}`, { align: 'left' });
            doc.moveDown();

            // Balance Box
            doc.rect(50, doc.y, 510, 40).fill('#f8fafc').stroke('#e2e8f0');
            doc.fillColor('#000000').fontSize(12).text('Current Balance:', 70, doc.y - 25);
            doc.fontSize(14).font('Helvetica-Bold').text(`₹${balance.toFixed(2)}`, 450, doc.y - 28, { align: 'right' });
            doc.moveDown(4);

            // Transactions Table Header
            const tableTop = doc.y;
            const colX = { date: 50, desc: 150, amount: 400, status: 500 };

            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('DATE', colX.date, tableTop);
            doc.text('DESCRIPTION', colX.desc, tableTop);
            doc.text('AMOUNT', colX.amount, tableTop, { align: 'right', width: 60 });
            doc.text('STATUS', colX.status, tableTop, { align: 'right', width: 50 });

            doc.moveTo(50, tableTop + 15).lineTo(560, tableTop + 15).strokeColor('#e2e8f0').stroke();

            // Rows
            let y = tableTop + 25;
            doc.font('Helvetica').fontSize(10).fillColor('#334155');

            transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach((txn) => {
                if (y > 700) {
                    doc.addPage();
                    y = 50;
                }

                const date = new Date(txn.createdAt).toLocaleDateString();
                const isCredit = txn.type === 'credit';

                doc.text(date, colX.date, y);
                doc.text(txn.description, colX.desc, y, { width: 230, ellipsis: true });

                doc.fillColor(isCredit ? '#166534' : '#000000');
                doc.text(`${isCredit ? '+' : '-'}₹${txn.amount.toFixed(2)}`, colX.amount, y, { align: 'right', width: 60 });

                doc.fillColor('#334155');
                doc.text(txn.status.toUpperCase(), colX.status, y, { align: 'right', width: 50 });

                y += 20;
                doc.moveTo(50, y - 5).lineTo(560, y - 5).strokeColor('#f1f5f9').stroke();
            });

            doc.end();

        } catch (err) {
            console.error("[FinanceManager] PDF Gen Error:", err);
            if (!res.headersSent) res.status(500).send("Error generating PDF statement");
        }
    }

    // [New] Helper for Auto-Assignment Algo
    async getPlatformMonthlyEarnings() {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const allTxns = await this.db.read();
            return allTxns
                .filter(t => t.type === 'credit' && t.created_at >= startOfMonth) // Assuming credit to users/techs reflects earnings distributed
                .reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
        } catch (err) {
            console.error("[FinanceManager] Error getting platform monthly earnings:", err);
            return 1; // Prevent division by zero
        }
    }
    // --- Payment Methods ---
    async addPaymentMethod(userId, methodData) {
        try {
            // If primary, unset others
            if (methodData.isPrimary) {
                // Ideally this would be a transaction or batch update
                // For simplified manager, we'll just let it be or handle differently
                // DB constraint or trigger is better for "only one primary"
            }

            const method = {
                userId,
                type: methodData.type, // 'card' or 'paypal'
                provider: methodData.provider,
                last4: methodData.last4,
                email: methodData.email,
                expiry: methodData.expiry,
                isPrimary: methodData.isPrimary || false,
                createdAt: new Date().toISOString()
            };

            const dbMethod = this._mapToDb(method); // We'll need a way to insert into 'payment_methods' table
            // Since BaseManager is bound to 'finance' table, we need to access DB directly or have sub-managers
            // For simplicity in this mono-manager approach, we will use direct DB client if Supabase, or JSON hack

            if (this.db.client) {
                const { data, error } = await this.db.client.from('payment_methods').insert(dbMethod).select().single();
                if (error) throw error;
                return this._mapFromDb(data);
            } else {
                // Local JSON Fallback (mocking separate table support in same JSON for now? Or just failing gracefully)
                console.warn("[FinanceManager] Local JS DB doesn't support secondary tables easily. Returning mock.");
                return { ...method, id: Date.now().toString() };
            }
        } catch (err) {
            console.error("[FinanceManager] Error adding payment method:", err);
            throw err;
        }
    }

    async getPaymentMethods(userId) {
        try {
            if (this.db.client) {
                const { data, error } = await this.db.client.from('payment_methods').select('*').eq('user_id', userId);
                if (error) throw error;
                return data.map(m => this._mapFromDb(m));
            }
            return []; // Fallback empty
        } catch (err) {
            console.error("[FinanceManager] Error getting payment methods:", err);
            return [];
        }
    }

    async deletePaymentMethod(id) {
        try {
            if (this.db.client) {
                const { error } = await this.db.client.from('payment_methods').delete().eq('id', id);
                if (error) throw error;
                return true;
            }
            return true;
        } catch (err) {
            console.error("[FinanceManager] Error deleting payment method:", err);
            return false;
        }
    }

    // --- Coupons ---
    async validateCoupon(code, cartAmount) {
        try {
            // const cleanCode = code.toUpperCase().trim();
            if (this.db.client) {
                const { data, error } = await this.db.client.from('coupons').select('*').eq('code', code).single();
                if (!data || error) return { valid: false, message: 'Invalid code' };

                if (!data.is_active) return { valid: false, message: 'Code is inactive' };
                if (data.expiry_date && new Date(data.expiry_date) < new Date()) return { valid: false, message: 'Code expired' };
                if (cartAmount < (data.min_order_value || 0)) return { valid: false, message: `Min order value is ${data.min_order_value}` };

                return { valid: true, discountAmount: data.discount_amount, discountType: data.discount_type, code: data.code };
            }

            // Mock for Local
            if (code === 'WELCOME50') return { valid: true, discountAmount: 50, discountType: 'fixed', code: 'WELCOME50' };

            return { valid: false, message: 'Invalid code' };
        } catch (err) {
            console.error("[FinanceManager] Error validating coupon:", err);
            return { valid: false, message: 'Server error' };
        }
    }
    // --- PhonePe Integration ---
    async initiatePhonePePayment(userId, amount, redirectUrl, callbackUrl) {
        try {
            const merchantTransactionId = `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const data = {
                merchantId: MERCHANT_ID,
                merchantTransactionId: merchantTransactionId,
                merchantUserId: userId,
                amount: amount * 100, // Amount in paise
                redirectUrl: redirectUrl,
                redirectMode: "REDIRECT",
                callbackUrl: callbackUrl,
                paymentInstrument: {
                    type: "PAY_PAGE"
                }
            };

            const payload = JSON.stringify(data);
            const payloadMain = Buffer.from(payload).toString('base64');
            const keyIndex = SALT_INDEX;
            const stringToHash = payloadMain + "/pg/v1/pay" + SALT_KEY;
            const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
            const checksum = sha256 + "###" + keyIndex;

            // Make the call to PhonePe
            // const prod_url = "https://api.phonepe.com/apis/hermes/pg/v1/pay"
            const options = {
                method: 'POST',
                url: `${PHONEPE_HOST_URL}/pg/v1/pay`,
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum
                },
                data: {
                    request: payloadMain
                }
            };

            const response = await axios.request(options);

            // Log the attempt
            console.log(`[PhonePe] Init Success. TXN: ${merchantTransactionId}`);

            // Return only what's needed for the frontend
            return {
                merchantTransactionId,
                instrumentResponse: response.data.data.instrumentResponse,
                success: response.data.success
            };

        } catch (error) {
            console.error("[FinanceManager] PhonePe Init Error:", error.response ? error.response.data : error.message);
            throw new Error(error.response?.data?.message || 'Payment initiation failed');
        }
    }

    // Manual Status Check (Good for callback verification)
    async checkPhonePeStatus(merchantTransactionId) {
        try {
            const keyIndex = SALT_INDEX;
            const stringToHash = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}` + SALT_KEY;
            const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
            const checksum = sha256 + "###" + keyIndex;

            const options = {
                method: 'GET',
                url: `${PHONEPE_HOST_URL}/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`,
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum,
                    'X-MERCHANT-ID': MERCHANT_ID
                }
            };

            const response = await axios.request(options);
            return response.data;

        } catch (error) {
            console.error("[FinanceManager] PhonePe Status Error:", error.message);
            return null;
        }
    }
}

module.exports = FinanceManager;
