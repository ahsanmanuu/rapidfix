const Database = require('./DatabaseLoader');

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
}

module.exports = FinanceManager;
