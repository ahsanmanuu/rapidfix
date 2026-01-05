const Database = require('./Database');

class FinanceManager {
    constructor() {
        this.db = new Database('finance.json');
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
}

module.exports = FinanceManager;
