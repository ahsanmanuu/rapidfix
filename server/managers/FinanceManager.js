const Database = require('./DatabaseLoader');
const crypto = require('crypto');
const axios = require('axios');
const PDFDocument = require('pdfkit');
const ActivityLogManager = require('./ActivityLogManager'); // [NEW]

// PhonePe Sandbox Credentials
const PHONEPE_HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
const MERCHANT_ID = "PGTESTPAYUAT";
const SALT_KEY = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
const SALT_INDEX = 1;

class FinanceManager {
    constructor() {
        this.db = new Database('finance');
        this.activityManager = new ActivityLogManager(); // [NEW]
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    setActivityLogManager(activityManager) {
        this.activityManager = activityManager;
    }

    _mapFromDb(txn) {
        if (!txn) return null;
        try {
            const { user_id, technician_id, associated_id, created_at, ...rest } = txn;
            return {
                ...rest,
                userId: user_id,
                technicianId: technician_id,
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
            const { userId, technicianId, associatedId, createdAt, id, ...rest } = txn;
            const mapped = { ...rest };
            if (userId !== undefined) mapped.user_id = userId;
            if (technicianId !== undefined) mapped.technician_id = technicianId;
            if (associatedId !== undefined) mapped.associated_id = associatedId;
            if (createdAt !== undefined) mapped.created_at = createdAt;
            if (id !== undefined) mapped.id = id;
            return mapped;
        } catch (err) {
            console.error("[FinanceManager] Error mapping to DB:", err);
            return txn;
        }
    }

    async createTransaction(userId, associatedId, type, amount, description, technicianId = null) {
        try {
            if (!userId && !technicianId) {
                console.warn(`[FinanceManager] WARNING: Creating orphan transaction for ${associatedId}. No userId or technicianId provided.`);
            }

            const transaction = {
                userId: technicianId ? null : userId,
                technicianId: technicianId,
                associatedId,
                type,
                amount: parseFloat(amount),
                description,
                category: 'Job Fees', // Default
                status: 'completed',
                createdAt: new Date().toISOString()
            };

            // [NEW] Category Handling
            if (description.toLowerCase().includes('tip')) transaction.category = 'Tips';
            if (description.toLowerCase().includes('bonus')) transaction.category = 'Bonuses';
            if (description.toLowerCase().includes('refund')) transaction.category = 'Refunds';
            if (description.toLowerCase().includes('withdrawal')) transaction.category = 'Withdrawal';

            const dbTxn = this._mapToDb(transaction);
            const saved = await this.db.add(dbTxn);
            const result = this._mapFromDb(saved);

            const targetId = technicianId || userId;
            const targetRoom = technicianId ? `tech_${technicianId}` : `user_${userId}`;

            // [NEW] Sync Analytics on every transaction
            if (technicianId) {
                this.syncAnalytics(technicianId).catch(e => console.error("Sync Analytics failed", e));
            }

            if (this.io) {
                this.io.to(targetRoom).emit('new_transaction', result);
                const balance = await this.getBalance(targetId, !!technicianId);
                this.io.to(targetRoom).emit('wallet_updated', { balance });
                this.io.emit('admin_finance_update', result);
            }

            return result;
        } catch (err) {
            console.error("[FinanceManager] Error creating transaction:", err);
            throw err;
        }
    }

    async processPayment(userId, amount, type, description, isTechnician = false, associatedId = 'SYSTEM') {
        // [NEW] Log Earnings
        if (type === 'credit') {
            await this.activityManager.log(null, userId, 'payment_received', 'Payment Received', `Received ₹${amount} for ${description}`, { amount });
        }
        return await this.createTransaction(isTechnician ? null : userId, associatedId, type, amount, description, isTechnician ? userId : null);
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

    async getBalance(userId, isTechnician = false) {
        try {
            const transactions = await this.db.findAll(isTechnician ? 'technician_id' : 'user_id', userId);
            return transactions.reduce((acc, curr) => {
                const t = this._mapFromDb(curr);
                return t.type === 'credit' ? acc + t.amount : acc - t.amount;
            }, 0);
        } catch (err) {
            console.error(`[FinanceManager] Error getting balance for ${isTechnician ? 'tech' : 'user'} ${userId}:`, err);
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

    async getTransactionsByUser(userId, isTechnician = false) {
        try {
            const txns = await this.db.findAll(isTechnician ? 'technician_id' : 'user_id', userId);
            return txns.map(t => this._mapFromDb(t));
        } catch (err) {
            console.error(`[FinanceManager] Error getting txns for ${isTechnician ? 'tech' : 'user'} ${userId}:`, err);
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
    async getMonthlyEarnings(userId, isTechnician = false) {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            const txns = await this.db.findAll(isTechnician ? 'technician_id' : 'user_id', userId);
            return txns
                .filter(t => t.type === 'credit' && t.created_at >= startOfMonth)
                .reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
        } catch (err) {
            console.error(`[FinanceManager] Error getting monthly earnings for ${isTechnician ? 'tech' : 'user'} ${userId}:`, err);
            return 0;
        }
    }

    async generateStatementPdf(userId) {
        return new Promise(async (resolve, reject) => {
            try {
                const balance = await this.getBalance(userId);
                const transactions = await this.getTransactionsByUser(userId);

                const doc = new PDFDocument({ margin: 50, size: 'A4' });
                const chunks = [];

                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', (err) => {
                    console.error("[FinanceManager] PDF Generation Error:", err);
                    reject(err);
                });

                // 1. HEADER SECTION
                doc.fillColor('#1e293b').fontSize(24).font('Helvetica-Bold').text('Wallet Statement', 50, 50);
                doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('Fixofy Services Private Limited', 50, 80);

                // Metadata (Right side)
                doc.fontSize(9).font('Helvetica').fillColor('#64748b');
                doc.text(`Statement Date: ${new Date().toLocaleDateString()}`, 350, 55, { align: 'right', width: 200 });
                doc.text(`Time: ${new Date().toLocaleTimeString()}`, 350, 68, { align: 'right', width: 200 });
                doc.text(`User ID: ${String(userId).slice(0, 18)}...`, 350, 82, { align: 'right', width: 200 });

                // 2. BALANCE BOX
                const boxY = 120;
                doc.rect(50, boxY, 500, 60).fill('#f8fafc').stroke('#e2e8f0');
                doc.fillColor('#475569').fontSize(11).font('Helvetica').text('Available Balance', 75, boxY + 23);
                doc.fillColor('#0f172a').fontSize(22).font('Helvetica-Bold').text(`INR ${(Number(balance) || 0).toFixed(2)}`, 300, boxY + 20, { align: 'right', width: 230 });

                // 3. TABLE HEADER
                const tableHeaderY = 210;
                const colX = { date: 50, desc: 140, amount: 420, status: 500 };

                doc.fillColor('#64748b').fontSize(10).font('Helvetica-Bold');
                doc.text('DATE', colX.date, tableHeaderY);
                doc.text('DESCRIPTION', colX.desc, tableHeaderY);
                doc.text('AMOUNT', colX.amount, tableHeaderY, { align: 'right', width: 70 });
                doc.text('STATUS', colX.status, tableHeaderY, { align: 'right', width: 50 });

                doc.moveTo(50, tableHeaderY + 18).lineTo(550, tableHeaderY + 18).strokeColor('#e2e8f0').lineWidth(1).stroke();

                // 4. TRANSACTIONS LIST
                let currentY = tableHeaderY + 35;
                const sorted = [...(transactions || [])].sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));

                sorted.forEach((txn) => {
                    if (currentY > 750) {
                        doc.addPage();
                        currentY = 50;

                        // Header on new page
                        doc.fillColor('#64748b').fontSize(10).font('Helvetica-Bold');
                        doc.text('DATE', colX.date, currentY);
                        doc.text('DESCRIPTION', colX.desc, currentY);
                        doc.text('AMOUNT', colX.amount, currentY, { align: 'right', width: 70 });
                        doc.text('STATUS', colX.status, currentY, { align: 'right', width: 50 });
                        doc.moveTo(50, currentY + 18).lineTo(550, currentY + 18).strokeColor('#e2e8f0').lineWidth(1).stroke();
                        currentY += 35;
                    }

                    const dateStr = txn.createdAt || txn.created_at || new Date().toISOString();
                    const date = new Date(dateStr).toLocaleDateString();
                    const isCredit = txn.type === 'credit';
                    const amt = Number(txn.amount) || 0;
                    const statusStr = String(txn.status || 'Success').toUpperCase();
                    const descStr = String(txn.description || 'Service Transaction');

                    doc.font('Helvetica').fillColor('#334155').fontSize(9);
                    doc.text(date, colX.date, currentY);
                    doc.text(descStr, colX.desc, currentY, { width: 240, ellipsis: true });

                    doc.font('Helvetica-Bold').fillColor(isCredit ? '#15803d' : '#0f172a');
                    doc.text(`${isCredit ? '+' : '-'} INR ${amt.toFixed(2)}`, colX.amount, currentY, { align: 'right', width: 70 });

                    doc.font('Helvetica').fillColor('#64748b');
                    doc.text(statusStr, colX.status, currentY, { align: 'right', width: 50 });

                    currentY += 30;
                    doc.moveTo(50, currentY - 8).lineTo(550, currentY - 8).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
                });

                doc.end();

            } catch (err) {
                console.error("[FinanceManager] PDF Gen Internal Error:", err);
                reject(err);
            }
        });
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

    // ==========================================
    // NEW: WALLET & WITHDRAWAL LOGIC
    // ==========================================

    async addBankAccount(technicianId, details) {
        try {
            if (!this.db.client) throw new Error("Database not connected");

            const { data, error } = await this.db.client
                .from('bank_accounts')
                .insert({
                    technician_id: technicianId,
                    bank_name: details.bank_name || details.bankName,
                    account_number: details.account_number || details.accountNumber,
                    ifsc_code: details.ifsc_code || details.ifscCode,
                    account_holder_name: details.account_holder_name || details.accountHolderName,
                    is_primary: details.is_primary || details.isPrimary || false
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error("[FinanceManager] Error adding bank account:", err);
            throw err;
        }
    }

    async getBankAccounts(technicianId) {
        try {
            if (!this.db.client) return [];
            const { data, error } = await this.db.client
                .from('bank_accounts')
                .select('*')
                .eq('technician_id', technicianId)
                .order('is_primary', { ascending: false });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error("[FinanceManager] Error fetching bank accounts:", err);
            return [];
        }
    }

    async requestWithdrawal(technicianId, amount, bankAccountId) {
        try {
            if (!this.db.client) throw new Error("Database not connected");

            const balance = await this.getBalance(technicianId, true);
            if (balance < amount) throw new Error("Insufficient wallet balance");

            // 1. Create Withdrawal Record
            const { data: withdrawal, error } = await this.db.client
                .from('withdrawals')
                .insert({
                    technician_id: technicianId,
                    bank_account_id: bankAccountId,
                    amount: amount,
                    status: 'pending' // pending -> processing -> completed
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Debit Wallet immediately (locked funds)
            await this.createTransaction(
                null,
                withdrawal.id,
                'debit',
                amount,
                `Withdrawal Request #${withdrawal.id.slice(0, 8)}`,
                technicianId
            );

            return withdrawal;
        } catch (err) {
            console.error("[FinanceManager] Error requesting withdrawal:", err);
            throw err;
        }
    }

    async getWithdrawals(technicianId) {
        try {
            if (!this.db.client) return [];
            const { data, error } = await this.db.client
                .from('withdrawals')
                .select('*, bank_accounts(bank_name, account_number)')
                .eq('technician_id', technicianId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error("[FinanceManager] Error fetching withdrawals:", err);
            return [];
        }
    }

    // ==========================================
    // NEW: ANALYTICS & AI INSIGHTS
    // ==========================================

    async getFinancialStats(technicianId) {
        try {
            const txns = await this.db.findAll('technician_id', technicianId);
            const earnings = txns.filter(t => t.type === 'credit');
            const withdrawals = txns.filter(t => t.description.toLowerCase().includes('withdrawal'));

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

            // 1. Income Distribution (Pie Chart)
            const incomeMap = { 'Job Fees': 0, 'Tips': 0, 'Bonuses': 0 };
            earnings.forEach(t => {
                const cat = t.category || 'Job Fees';
                if (incomeMap[cat] !== undefined) incomeMap[cat] += parseFloat(t.amount);
                else incomeMap['Job Fees'] += parseFloat(t.amount); // Fallback
            });

            // 2. Weekly Trends (Bar Chart)
            const weeklyTrends = Array(7).fill(0); // Mon-Sun
            const tempDate = new Date(now);
            const day = tempDate.getDay();
            const diff = tempDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
            const startOfWeek = new Date(tempDate.setDate(diff));
            startOfWeek.setHours(0, 0, 0, 0);

            earnings.forEach(t => {
                const date = new Date(t.created_at);
                if (date >= startOfWeek) {
                    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1; // Mon=0
                    weeklyTrends[dayIndex] += parseFloat(t.amount);
                }
            });

            // 3. This Month vs Last Month
            const thisMonthEarnings = earnings
                .filter(t => new Date(t.created_at) >= startOfMonth)
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            const lastMonthEarnings = earnings
                .filter(t => {
                    const d = new Date(t.created_at);
                    return d >= startOfLastMonth && d <= endOfLastMonth;
                })
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            const monthTrend = lastMonthEarnings === 0 ? 100 : ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings * 100);

            // 4. Avg Per Job (Credits only)
            const jobCredits = earnings.filter(t => t.category === 'Job Fees' || !t.category);
            const avgPerJob = jobCredits.length > 0
                ? jobCredits.reduce((sum, t) => sum + parseFloat(t.amount), 0) / jobCredits.length
                : 0;

            // 5. Projected
            const daysPassed = now.getDate();
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const projectedEarnings = daysPassed > 0 ? (thisMonthEarnings / daysPassed) * daysInMonth : 0;

            return {
                incomeDistribution: [
                    { name: 'Job Fees', value: incomeMap['Job Fees'], color: '#3b82f6' },
                    { name: 'Tips', value: incomeMap['Tips'], color: '#10b981' },
                    { name: 'Bonuses', value: incomeMap['Bonuses'], color: '#f59e0b' }
                ],
                weeklyTrends: weeklyTrends,
                totalEarnings: earnings.reduce((sum, t) => sum + parseFloat(t.amount), 0),
                totalWithdrawn: withdrawals.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
                thisWeekEarnings: weeklyTrends.reduce((a, b) => a + b, 0),
                thisMonthEarnings,
                avgPerJob,
                projectedEarnings,
                trends: {
                    month: monthTrend.toFixed(1),
                    week: "+5.2", // Mock for now or calculate vs last week
                    avg: "+2.4"
                }
            };
        } catch (err) {
            console.error("[FinanceManager] Error getting stats:", err);
            return {
                incomeDistribution: [],
                weeklyTrends: [],
                totalEarnings: 0,
                totalWithdrawn: 0,
                thisWeekEarnings: 0,
                thisMonthEarnings: 0,
                avgPerJob: 0,
                projectedEarnings: 0,
                trends: { month: "0", week: "0", avg: "0" }
            };
        }
    }

    async getAIAnalytics(technicianId) {
        try {
            if (this.db.client) {
                const { data, error } = await this.db.client
                    .from('technician_finance_analytics')
                    .select('*')
                    .eq('technician_id', technicianId)
                    .single();

                if (data) {
                    return {
                        taxEstimation: { amount: data.tax_estimation, message: data.tax_message },
                        savingsSuggestion: { amount: data.savings_goal, message: data.savings_message },
                        peakInsight: { message: data.peak_insight },
                        healthScore: data.health_score
                    };
                }
            }
            return this.calculateAIAnalytics(technicianId);
        } catch (err) {
            console.error("[FinanceManager] Error getting AI analytics:", err);
            return this.calculateAIAnalytics(technicianId);
        }
    }

    async calculateAIAnalytics(technicianId) {
        try {
            const txns = await this.db.findAll('technician_id', technicianId);
            const earnings = txns.filter(t => t.type === 'credit');
            const totalEarnings = earnings.reduce((sum, t) => sum + parseFloat(t.amount), 0);

            let taxRate = 0;
            if (totalEarnings > 100000) taxRate = 0.20;
            else if (totalEarnings > 50000) taxRate = 0.10;
            const estimatedTax = totalEarnings * taxRate;

            const dayCounts = {};
            earnings.forEach(t => {
                const day = new Date(t.created_at).toLocaleDateString('en-US', { weekday: 'long' });
                dayCounts[day] = (dayCounts[day] || 0) + parseFloat(t.amount);
            });
            const topDay = Object.keys(dayCounts).sort((a, b) => dayCounts[b] - dayCounts[a])[0] || 'Monday';
            const score = Math.min(100, Math.floor((earnings.length * 2) + (totalEarnings / 1000)));

            return {
                taxEstimation: {
                    amount: estimatedTax,
                    message: totalEarnings > 0
                        ? `Suggested set aside for Q4 taxes (${(taxRate * 100)}% bracket).`
                        : "Start earning to see your automated tax estimations."
                },
                savingsSuggestion: {
                    amount: totalEarnings * 0.15,
                    message: totalEarnings > 0
                        ? "Save 15% more this week to reach your goal."
                        : "Did you know? Technicians who save 10% monthly reach goals 3x faster."
                },
                peakInsight: {
                    message: earnings.length > 0
                        ? `${topDay}s are your top-earning days.`
                        : "Complete 3 jobs to unlock your personalized peak earning windows."
                },
                healthScore: earnings.length > 0 ? score : 100 // Give new users a perfect starting score
            };
        } catch (err) {
            console.error("[FinanceManager] Error calculating analytics:", err);
            return {};
        }
    }

    async syncAnalytics(technicianId) {
        try {
            if (!this.db.client) return;
            const analytics = await this.calculateAIAnalytics(technicianId);

            const { error } = await this.db.client
                .from('technician_finance_analytics')
                .upsert({
                    technician_id: technicianId,
                    tax_estimation: analytics.taxEstimation?.amount || 0,
                    tax_message: analytics.taxEstimation?.message,
                    savings_goal: analytics.savingsSuggestion?.amount || 0,
                    savings_message: analytics.savingsSuggestion?.message,
                    peak_insight: analytics.peakInsight?.message,
                    health_score: analytics.healthScore || 0,
                    last_updated: new Date().toISOString()
                }, { onConflict: 'technician_id' });

            if (error) throw error;
            return analytics;
        } catch (err) {
            console.error("[FinanceManager] Error syncing analytics:", err);
        }
    }

    // --- Wallet Pots ---
    async getPots(technicianId) {
        try {
            if (!this.db.client) return [];
            const { data, error } = await this.db.client
                .from('wallet_pots')
                .select('*')
                .eq('technician_id', technicianId);
            if (error) throw error;
            return data;
        } catch (err) {
            console.error("[FinanceManager] Error getting pots:", err);
            return [];
        }
    }

    async updatePot(technicianId, name, amount, operation = 'add') {
        try {
            if (!this.db.client) throw new Error("DB not connected");

            // 1. Get current pot or create
            let { data: pot, error } = await this.db.client
                .from('wallet_pots')
                .select('*')
                .eq('technician_id', technicianId)
                .eq('name', name)
                .single();

            if (!pot) {
                const { data: newPot, error: createError } = await this.db.client
                    .from('wallet_pots')
                    .insert({ technician_id: technicianId, name, current_amount: 0 })
                    .select().single();
                if (createError) throw createError;
                pot = newPot;
            }

            const newAmount = operation === 'add' ? pot.current_amount + amount : pot.current_amount - amount;

            const { data: updated, error: updateError } = await this.db.client
                .from('wallet_pots')
                .update({ current_amount: newAmount, updated_at: new Date().toISOString() })
                .eq('id', pot.id)
                .select().single();

            if (updateError) throw updateError;
            return updated;
        } catch (err) {
            console.error("[FinanceManager] Error updating pot:", err);
            throw err;
        }
    }
}

module.exports = FinanceManager;
