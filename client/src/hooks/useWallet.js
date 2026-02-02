import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const useWallet = () => {
    const { user } = useAuth();
    const socket = useSocket();

    // Core Data
    const [walletData, setWalletData] = useState({
        balance: 0,
        available: 0,
        totalEarnings: 0,
        totalWithdrawn: 0,
        incomeDistribution: [],
        weeklyTrends: [],
        analytics: {}
    });

    // Lists
    const [transactions, setTransactions] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [pots, setPots] = useState([]);
    const [taxData, setTaxData] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const technicianId = user?.id;

    // --- Fetchers ---
    const fetchWalletData = useCallback(async () => {
        if (!technicianId) return;
        try {
            // [UPDATED] Pass role to support both User and Technician
            const role = user?.role || 'technician';
            const res = await api.get(`/finance/wallet/${technicianId}?role=${role}`);
            if (res.data.success) {
                setWalletData(res.data.wallet || {
                    balance: 0,
                    available: 0,
                    totalEarnings: 0,
                    totalWithdrawn: 0,
                    incomeDistribution: [],
                    weeklyTrends: [],
                    analytics: {}
                });
            }
        } catch (err) {
            console.error("Fetch Wallet Error:", err);
            setError(err.response?.data?.error || err.message);
        }
    }, [technicianId, user]);

    const fetchTransactions = useCallback(async () => {
        if (!technicianId) return;
        try {
            // [UPDATED] Pass role
            const role = user?.role || 'technician';
            const res = await api.get(`/technicians/${technicianId}/transactions?role=${role}`);
            if (res.data.success) {
                setTransactions(res.data.transactions);
            }
        } catch (err) {
            console.error("Fetch Transactions Error:", err);
        }
    }, [technicianId, user]);

    const fetchBankAndWithdrawals = useCallback(async () => {
        if (!technicianId) return;
        try {
            const [banksRes, withdrawalsRes] = await Promise.all([
                api.get(`/finance/banks/${technicianId}`),
                api.get(`/finance/withdrawals/${technicianId}`)
            ]);

            if (banksRes.data.success) setBankAccounts(banksRes.data.banks);
            if (withdrawalsRes.data.success) setWithdrawals(withdrawalsRes.data.withdrawals);

        } catch (err) {
            console.error("Fetch Banks/Withdrawals Error:", err);
        }
    }, [technicianId]);

    const fetchInvoices = useCallback(async () => {
        if (!technicianId) return;
        try {
            const res = await api.get(`/finance/invoices/${technicianId}`);
            if (res.data.success) setInvoices(res.data.invoices);
        } catch (err) {
            console.error("Fetch Invoices Error:", err);
        }
    }, [technicianId]);

    const fetchPots = useCallback(async () => {
        if (!technicianId) return;
        try {
            const res = await api.get(`/finance/pots/${technicianId}`);
            if (res.data.success) setPots(res.data.pots);
        } catch (err) {
            console.error("Fetch Pots Error:", err);
        }
    }, [technicianId]);

    // --- Initial Load ---
    const refreshAll = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            await Promise.all([
                fetchWalletData(),
                fetchTransactions(),
                fetchBankAndWithdrawals(),
                fetchInvoices(),
                fetchPots()
            ]);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [fetchWalletData, fetchTransactions, fetchBankAndWithdrawals, fetchInvoices]);

    useEffect(() => {
        refreshAll();
    }, [refreshAll]);

    // --- Real-time Updates ---
    useEffect(() => {
        if (!socket || !technicianId) return;

        const handleUpdate = () => {
            fetchWalletData();
            fetchTransactions();
        };

        socket.on('wallet_updated', handleUpdate);
        socket.on('new_transaction', handleUpdate);

        return () => {
            socket.off('wallet_updated', handleUpdate);
            socket.off('new_transaction', handleUpdate);
        };
    }, [socket, technicianId, fetchWalletData, fetchTransactions]);

    // --- Actions ---
    const addBankAccount = async (data) => {
        try {
            const res = await api.post('/finance/banks', { ...data, technicianId });
            await fetchBankAndWithdrawals();
            return res.data;
        } catch (err) {
            throw err;
        }
    };

    const requestWithdrawal = async (amount, bankAccountId) => {
        try {
            const res = await api.post('/finance/withdraw', {
                technicianId,
                amount,
                bankAccountId
            });
            await Promise.all([fetchWalletData(), fetchBankAndWithdrawals()]);
            return res.data;
        } catch (err) {
            throw err;
        }
    };

    const saveToPot = async (name, amount) => {
        try {
            const res = await api.post('/finance/pots/update', {
                technicianId,
                name,
                amount,
                operation: 'add'
            });
            await fetchPots();
            return res.data;
        } catch (err) {
            throw err;
        }
    };

    const syncAnalytics = async () => {
        try {
            const res = await api.post('/finance/analytics/sync', { technicianId });
            await fetchWalletData();
            return res.data;
        } catch (err) {
            throw err;
        }
    };

    const shareInvoice = async (jobId, email = null) => {
        try {
            const res = await api.post(`/invoices/${jobId}/share`, { email });
            return res.data;
        } catch (err) {
            throw err;
        }
    };

    const downloadJobInvoice = async (jobId) => {
        try {
            const response = await api.get(`/invoices/${jobId}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice_${jobId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            throw err;
        }
    };

    return {
        walletData,
        transactions,
        bankAccounts,
        withdrawals,
        invoices,
        pots,
        loading,
        error,
        refresh: refreshAll,
        addBankAccount,
        requestWithdrawal,
        saveToPot,
        syncAnalytics,
        shareInvoice,
        downloadJobInvoice,
        technicianId
    };
};

export default useWallet;
