const Database = require('./DatabaseLoader');

class FinanceManager {
    constructor() {
        this.db = new Database('finance');
    }

    _mapFromDb(txn) {
        if (!txn) return null;
        const { user_id, associated_id, created_at, ...rest } = txn;
        return {
            ...rest,
            userId: user_id,
            associatedId: associated_id,
            createdAt: created_at
        };
    }

    _mapToDb(txn) {
        if (!txn) return null;
        const { userId, associatedId, createdAt, id, ...rest } = txn;
        const mapped = { ...rest };
        if (userId !== undefined) mapped.user_id = userId;
        if (associatedId !== undefined) mapped.associated_id = associatedId;
        if (createdAt !== undefined) mapped.created_at = createdAt;
        return mapped;
    }

    async createTransaction(userId, associatedId, type, amount, description) {
        const transaction = {
            userId,
            associatedId, // e.g., jobId or technicianId
            type, // 'credit' or 'debit'
            amount: parseFloat(amount),
            description,
            status: 'completed',
            createdAt: new Date().toISOString()
        };
        const dbTxn = this._mapToDb(transaction);
        const saved = await this.db.add(dbTxn);
        return this._mapFromDb(saved);
    }

    // Alias for more clarity in other parts of the app
    async processPayment(userId, amount, type, description) {
        return await this.createTransaction(userId, 'SYSTEM', type, amount, description);
    }

    async getBillsByUser(userId) {
        // Find all debit transactions for user (acting as bills)
        const txns = await this.db.findAll('user_id', userId);
        return txns.map(t => this._mapFromDb(t)).filter(t => t.type === 'debit');
    }

    async getBalance(userId) {
        // Simple balance calculation (Credits - Debits)
        const transactions = await this.db.findAll('user_id', userId);
        return transactions.reduce((acc, curr) => {
            const t = this._mapFromDb(curr);
            return t.type === 'credit' ? acc + t.amount : acc - t.amount;
        }, 0);
    }

    async getTransactionsByUser(userId) {
        const txns = await this.db.findAll('user_id', userId);
        return txns.map(t => this._mapFromDb(t));
    }

    async getAllTransactions() {
        const txns = await this.db.read();
        return txns.map(t => this._mapFromDb(t));
    }

    async getSystemWalletBalance() {
        // Calculate total volume of credits in the system (simplistic view of "System Wallet" or Total Volume)
        const transactions = await this.db.read();
        return transactions.reduce((acc, curr) => {
            const t = this._mapFromDb(curr);
            return t.type === 'credit' ? acc + t.amount : acc;
        }, 0);
    }

    async processMembershipPayment(userId, amount) {
        const minFee = 499;
        if (amount < minFee) {
            throw new Error("Minimum membership fee is ₹" + minFee);
        }

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
    }
}

module.exports = FinanceManager;
