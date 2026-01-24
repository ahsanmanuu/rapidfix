import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Typography,
    Card,
    CardContent,
    Button,
    IconButton,
    InputBase,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Paper,
    FormControl,
    Select,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Stack
} from '@mui/material';
import {
    AccountBalanceWallet,
    AddCircle,
    Download,
    CheckCircle,
    Add,
    CalendarToday,
    FilterList,
    Plumbing,
    ElectricalServices,
    CleaningServices,
    History,
    CreditCard
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getWalletBalance, getPaymentMethods, addPaymentMethod, verifyCoupon, topUpWallet, deletePaymentMethod, initiatePhonePePayment, downloadStatement } from '../../services/api';

const PRIMARY_GOLD = '#D0BB95';
const PRIMARY_BLUE = '#2563eb';

const DashboardFinance = () => {
    const { user } = useAuth();
    const { socket } = useSocket();

    // State
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [openTopUp, setOpenTopUp] = useState(false);
    const [openAddMethod, setOpenAddMethod] = useState(false);

    // Top Up Form
    const [topUpAmount, setTopUpAmount] = useState('');
    const [promoCode, setPromoCode] = useState('');
    const [promoStatus, setPromoStatus] = useState(null); // { valid: bool, msg: string, amount: num }
    const [processing, setProcessing] = useState(false);

    // Payment Method Form
    const [newMethod, setNewMethod] = useState({ type: 'card', provider: 'visa', last4: '', expiry: '' });

    // Fetch Data
    const fetchData = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const [walletRes, methodsRes] = await Promise.all([
                getWalletBalance(user.id),
                getPaymentMethods(user.id)
            ]);

            if (walletRes.data.success) {
                setBalance(walletRes.data.balance || 0);
                setTransactions(walletRes.data.transactions || []);
            }
            if (methodsRes.data.success) {
                setPaymentMethods(methodsRes.data.methods || []);
            }
        } catch (error) {
            console.error("Finance Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Socket Listeners
        if (socket) {
            socket.on('wallet_balance_update', (data) => {
                if (data.balance !== undefined) setBalance(data.balance);
            });
            socket.on('new_transaction', (txn) => {
                setTransactions(prev => [txn, ...prev]);
                // Refresh balance just in case
                fetchData();
            });
        }

        return () => {
            if (socket) {
                socket.off('wallet_balance_update');
                socket.off('new_transaction');
            }
        };
    }, [user, socket]);

    // Handlers
    const handleVerifyPromo = async () => {
        if (!promoCode) return;
        try {
            const res = await verifyCoupon({ code: promoCode, cartAmount: parseFloat(topUpAmount || 0) });
            if (res.data.valid) {
                setPromoStatus({ valid: true, msg: `Code applied! ${res.data.discountType === 'fixed' ? '₹' + res.data.discountAmount : res.data.discountAmount + '%'} discount/bonus`, code: res.data.code });
            } else {
                setPromoStatus({ valid: false, msg: res.data.message });
            }
        } catch (err) {
            setPromoStatus({ valid: false, msg: 'Error validating code' });
        }
    };

    const handleTopUp = async () => {
        try {
            setProcessing(true);
            // Simulate using first payment method or just raw topup
            await topUpWallet({
                userId: user.id,
                amount: parseFloat(topUpAmount),
                couponCode: promoStatus?.valid ? promoStatus.code : null
            });
            setOpenTopUp(false);
            setTopUpAmount('');
            setPromoCode('');
            setPromoStatus(null);
            // Balance update will come via Socket or refetch
            fetchData();
            alert("Top Up Successful via Wallet/Card simulation!");
        } catch (err) {
            console.error("Top Up Error:", err);
            alert("Top Up Failed");
        } finally {
            setProcessing(false);
        }
    };

    const handlePhonePePayment = async () => {
        try {
            setProcessing(true);
            const { data } = await initiatePhonePePayment({
                userId: user.id,
                amount: parseFloat(topUpAmount)
            });

            if (data.success && data.url) {
                // Redirect to PhonePe
                window.location.href = data.url;
            } else {
                alert("Failed to initiate PhonePe payment");
            }
        } catch (err) {
            console.error("PhonePe Error:", err);
            alert("PhonePe Error: " + (err.response?.data?.error || err.message));
        } finally {
            setProcessing(false);
        }
    };

    const handleAddMethod = async () => {
        try {
            // Basic validation
            if (!newMethod.last4 || !newMethod.expiry) return;

            await addPaymentMethod({
                userId: user.id,
                ...newMethod,
                provider: 'visa', // mocking
                isPrimary: paymentMethods.length === 0
            });
            setOpenAddMethod(false);
            fetchData();
        } catch (err) {
            alert("Failed to add method");
        }
    };

    const handleDeleteMethod = async (id) => {
        if (!window.confirm("Remove this payment method?")) return;
        try {
            await deletePaymentMethod(id);
            fetchData();
        } catch (err) {
            alert("Failed to delete");
        }
    };

    const handleDownloadStatement = async () => {
        try {
            // Need to handle blob response
            const response = await downloadStatement(user.id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Fixofy_Statement.pdf');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error(err);
            alert("Failed to download statement");
        }
    };

    // Helper to format date
    const formatDate = (iso) => {
        const d = new Date(iso);
        return {
            date: d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
    };

    if (loading && transactions.length === 0) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;

    return (
        <Box sx={{ width: '100%', pb: 4, fontFamily: 'Inter, sans-serif' }}>

            {/* Header Section */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="900" sx={{ letterSpacing: '-0.033em', color: '#0f172a', mb: 0.5 }}>
                        Payments & Wallet
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#64748b' }}>
                        Manage your Fixofy wallet, payment methods, and view transaction history.
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={handleDownloadStatement}
                        sx={{
                            borderColor: '#e2e8f0', color: '#0f172a', textTransform: 'none', fontWeight: 'bold', borderRadius: '8px', bgcolor: '#fff',
                            '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
                        }}
                    >
                        Statement
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddCircle />}
                        onClick={() => setOpenTopUp(true)}
                        sx={{
                            bgcolor: PRIMARY_GOLD, color: '#fff', textTransform: 'none', fontWeight: 'bold', borderRadius: '8px', boxShadow: `0 4px 14px 0 rgba(208, 187, 149, 0.4)`,
                            '&:hover': { bgcolor: '#c4af8a' }
                        }}
                    >
                        Add Funds
                    </Button>
                </Box>
            </Box>

            {/* Main Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>

                {/* 1. Wallet Balance Card */}
                <Grid item xs={12} lg={4}>
                    <Card sx={{
                        borderRadius: '16px', height: '100%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                        border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column'
                    }}>
                        <Box sx={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, bgcolor: 'rgba(208, 187, 149, 0.1)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }} />

                        <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                                <Box>
                                    <Typography variant="caption" fontWeight="600" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Total Balance
                                    </Typography>
                                    <Typography variant="h3" fontWeight="900" sx={{ color: '#0f172a' }}>
                                        ₹{balance.toFixed(2)}
                                    </Typography>
                                </Box>
                                <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(208, 187, 149, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PRIMARY_GOLD }}>
                                    <AccountBalanceWallet />
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 2. Payment Methods */}
                <Grid item xs={12} lg={8}>
                    <Card sx={{ borderRadius: '16px', height: '100%', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: '#0f172a' }}>Payment Methods</Typography>
                            </Box>

                            <Grid container spacing={2}>
                                {paymentMethods.map(method => (
                                    <Grid item xs={12} md={6} key={method.id}>
                                        <Box sx={{
                                            p: 2.5, borderRadius: '16px', border: '1px solid #e2e8f0', cursor: 'pointer',
                                            background: 'linear-gradient(135deg, #f8fafc 0%, #fff 100%)',
                                            transition: 'all 0.2s', '&:hover': { borderColor: PRIMARY_GOLD },
                                            position: 'relative', overflow: 'hidden'
                                        }} onClick={() => handleDeleteMethod(method.id)}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                                                <Paper elevation={0} sx={{ p: 0.5, borderRadius: '8px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CreditCard fontSize="small" />
                                                    <Typography variant="caption" fontWeight="bold">{method.provider?.toUpperCase()}</Typography>
                                                </Paper>
                                                {method.isPrimary && <Chip label="PRIMARY" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 'bold', height: 20, fontSize: '0.65rem' }} />}
                                            </Box>
                                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748b' }}>**** **** **** {method.last4}</Typography>
                                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#0f172a' }}>Ending in {method.last4}</Typography>
                                            <Typography variant="caption" sx={{ color: '#94a3b8' }}>Expires {method.expiry}</Typography>
                                        </Box>
                                    </Grid>
                                ))}

                                {/* Add New Method */}
                                <Grid item xs={12} md={6}>
                                    <Box onClick={() => setOpenAddMethod(true)} sx={{
                                        p: 2, borderRadius: '12px', border: '2px dashed #e2e8f0',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, height: '100%', minHeight: 140,
                                        cursor: 'pointer', color: '#64748b',
                                        '&:hover': { borderColor: PRIMARY_GOLD, color: PRIMARY_GOLD, bgcolor: '#fffbf2' }
                                    }}>
                                        <Add fontSize="small" />
                                        <Typography variant="body2" fontWeight="600">Add New Method</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Transaction History Table */}
            <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
                <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#0f172a' }}>Transaction History</Typography>
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Date</TableCell>
                                <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Description</TableCell>
                                <TableCell align="right" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Amount</TableCell>
                                <TableCell align="center" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.length > 0 ? transactions.map((txn, index) => {
                                const { date, time } = formatDate(txn.createdAt);
                                const isCredit = txn.type === 'credit';
                                return (
                                    <TableRow key={txn.id || index} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="500" color="#0f172a">{date}</Typography>
                                            <Typography variant="caption" color="#94a3b8">{time}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="500" color="#0f172a">{txn.description}</Typography>
                                            <Typography variant="caption" color="#64748b">ID: {txn.id?.slice(0, 8)}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight="bold" sx={{ color: isCredit ? '#059669' : '#0f172a' }}>
                                                {isCredit ? '+' : '-'}₹{txn.amount}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip label={txn.status} size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 'bold', fontSize: '0.7rem' }} />
                                        </TableCell>
                                    </TableRow>
                                )
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        No transactions yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Modals */}
            <Dialog open={openTopUp} onClose={() => setOpenTopUp(false)}>
                <DialogTitle>Add Funds (Sandbox)</DialogTitle>
                <DialogContent sx={{ minWidth: 300, pt: 2 }}>
                    <TextField
                        label="Amount (₹)"
                        type="number"
                        fullWidth
                        margin="dense"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                    />
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <TextField
                            label="Promo Code"
                            fullWidth
                            size="small"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                        />
                        <Button variant="outlined" onClick={handleVerifyPromo}>Apply</Button>
                    </Box>
                    {promoStatus && (
                        <Typography variant="caption" color={promoStatus.valid ? 'success.main' : 'error.main'}>
                            {promoStatus.msg}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ flexDirection: 'column', gap: 1, p: 2, alignItems: 'stretch' }}>
                    <Button variant="contained" onClick={handleTopUp} disabled={!topUpAmount || processing} sx={{ bgcolor: PRIMARY_GOLD }}>
                        {processing ? 'Processing...' : 'Direct Top Up (Test)'}
                    </Button>
                    <Button variant="outlined" onClick={handlePhonePePayment} disabled={!topUpAmount || processing} sx={{ borderColor: '#5f259f', color: '#5f259f' }}>
                        Pay with PhonePe
                    </Button>
                    <Button onClick={() => setOpenTopUp(false)} sx={{ color: '#64748b' }}>Cancel</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openAddMethod} onClose={() => setOpenAddMethod(false)}>
                <DialogTitle>Add Payment Method</DialogTitle>
                <DialogContent sx={{ minWidth: 300, pt: 2 }}>
                    <TextField
                        label="Card Last 4 Digits"
                        fullWidth
                        margin="dense"
                        inputProps={{ maxLength: 4 }}
                        value={newMethod.last4}
                        onChange={(e) => setNewMethod({ ...newMethod, last4: e.target.value })}
                    />
                    <TextField
                        label="Expiry (MM/YY)"
                        fullWidth
                        margin="dense"
                        placeholder="12/25"
                        value={newMethod.expiry}
                        onChange={(e) => setNewMethod({ ...newMethod, expiry: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenAddMethod(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleAddMethod} disabled={!newMethod.last4 || !newMethod.expiry}>
                        Save Method
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default DashboardFinance;
