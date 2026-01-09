const Database = require('./DatabaseLoader');

class FinanceManager {
    constructor() {
        this.db = new Database('finance');
    }

    createTransaction(userId, associatedId, type, amount, description) {
        const transaction = {
            id: Date.now().toString(),
            userId,
            associatedId, // e.g., jobId or technicianId
            type, // 'credit' or 'debit'
            amount: parseFloat(amount),
            description,
            status: 'completed',
            createdAt: new Date().toISOString()
        };
        return this.db.add(transaction);
    }

    getBillsByUser(userId) {
        // Find all debit transactions for user (acting as bills)
        return this.db.findAll('userId', userId).filter(t => t.type === 'debit');
    }

    getBalance(userId) {
        // Simple balance calculation (Credits - Debits)
        const transactions = this.db.findAll('userId', userId);
        return transactions.reduce((acc, curr) => {
            return curr.type === 'credit' ? acc + curr.amount : acc - curr.amount;
        }, 0);
    }

    getTransactionsByUser(userId) {
        return this.db.findAll('userId', userId);
    }

    getAllTransactions() {
        return this.db.read();
    }

    getSystemWalletBalance() {
        // Calculate total volume of credits in the system (simplistic view of "System Wallet" or Total Volume)
        const transactions = this.db.read();
        return transactions.reduce((acc, curr) => {
            return curr.type === 'credit' ? acc + curr.amount : acc;
        }, 0);
    }

    processMembershipPayment(userId, amount) {
        const minFee = 499;
        if (amount < minFee) {
            throw new Error(`Minimum membership fee is ₹${minFee}`);
        }

        const transaction = this.createTransaction(
            userId,
            'SYSTEM',
            'debit',
            amount,
            `Premium Membership Purchase (30 Days)`
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
