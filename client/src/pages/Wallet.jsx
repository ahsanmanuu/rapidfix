import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFinanceData } from '../services/api';

const Wallet = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [finance, setFinance] = useState({ balance: 0, transactions: [] });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
        } else {
            const u = JSON.parse(storedUser);
            setUser(u);
            fetchFinance(u.id);
        }
    }, [navigate]);

    const fetchFinance = async (userId) => {
        try {
            const res = await getFinanceData(userId);
            if (res.data.success) {
                setFinance({
                    balance: res.data.balance,
                    transactions: res.data.transactions
                });
            }
        } catch (err) {
            console.error("Failed to fetch finance data", err);
        }
    };

    if (!user) return null;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="glass-panel p-8 rounded-2xl mb-8 border-l-4 border-yellow-500">
                <h1 className="text-3xl font-bold mb-2">My Wallet</h1>
                <p className="text-gray-400">Manage your earnings and payments</p>
                <div className="mt-6">
                    <div className="text-sm text-gray-400">Current Balance</div>
                    <div className={`text-4xl font-bold ${finance.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${finance.balance.toFixed(2)}
                    </div>
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-6">Transaction History</h2>
            <div className="space-y-4">
                {finance.transactions.length === 0 ? (
                    <p className="text-gray-400">No transactions found.</p>
                ) : (
                    finance.transactions.map(tx => (
                        <div key={tx.id} className="glass-panel p-4 rounded-xl flex justify-between items-center hover:bg-white/5 transition-colors">
                            <div>
                                <div className="font-bold text-white">{tx.description}</div>
                                <div className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</div>
                            </div>
                            <div className={`font-bold ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                                {tx.type === 'credit' ? '+' : '-'}${tx.amount}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Wallet;
