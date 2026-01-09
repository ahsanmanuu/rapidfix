import { useState, useEffect } from 'react';
import api from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Grid,
    Typography,
    Card,
    CardContent,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Chip,
    Avatar
} from '@mui/material';
import { ReceiptLong, Download } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const DashboardFinance = ({ user }) => {
    const theme = useTheme();
    const [bills, setBills] = useState([]);

    useEffect(() => {
        if (user) fetchBills();
    }, [user]);

    const fetchBills = async () => {
        try {
            const res = await api.get(`/finance/user/${user.id}`);
            if (res.data.success) {
                setBills(res.data.bills);
            }
        } catch (error) {
            console.error("Failed to fetch bills", error);
        }
    };

    const handleDownload = (billId) => {
        alert(`Downloading bill ${billId}... (Feature to be implemented)`);
    };

    return (
        <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12}>
                <Typography variant="h2">Billing History</Typography>
            </Grid>

            {user?.membership === 'Free' && (
                <Grid item xs={12}>
                    <Card sx={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        color: 'white',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        position: 'relative',
                        mb: 4,
                        boxShadow: '0 20px 40px rgba(99, 102, 241, 0.2)'
                    }}>
                        <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
                            <Grid container alignItems="center" spacing={3}>
                                <Grid item xs={12} md={8}>
                                    <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
                                        Upgrade to Premium 💎
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 3 }}>
                                        Get exclusive benefits, priority support, and lower response times for just ₹499/month.
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Button
                                            variant="contained"
                                            sx={{
                                                bgcolor: 'white',
                                                color: '#6366f1',
                                                fontWeight: 'bold',
                                                '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                                                px: 4,
                                                borderRadius: '12px'
                                            }}
                                            onClick={async () => {
                                                try {
                                                    const res = await api.post('/membership/pay', { userId: user.id, amount: 499 });
                                                    if (res.data.success) {
                                                        alert("Welcome to Premium! Your membership is now active.");
                                                        window.location.reload();
                                                    }
                                                } catch (e) {
                                                    alert(e.response?.data?.error || "Payment failed");
                                                }
                                            }}
                                        >
                                            Upgrade Now
                                        </Button>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
                                    <Avatar sx={{ width: 120, height: 120, bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                                        <Typography variant="h2">✨</Typography>
                                    </Avatar>
                                </Grid>
                            </Grid>
                        </CardContent>
                        {/* Decorative blobs */}
                        <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                        <Box sx={{ position: 'absolute', bottom: -20, left: '20%', width: 100, height: 100, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                    </Card>
                </Grid>
            )}

            {bills.length === 0 ? (
                <Grid item xs={12}>
                    <Card sx={{ textAlign: 'center', p: 5, borderStyle: 'dashed', borderRadius: '16px' }}>
                        <ReceiptLong sx={{ fontSize: 60, color: theme.palette.text.secondary, opacity: 0.5 }} />
                        <Typography variant="h3" color="textSecondary" sx={{ mt: 2 }}>No invoices yet</Typography>
                        <Typography variant="body1" color="textSecondary">Services you book will appear here for payment.</Typography>
                    </Card>
                </Grid>
            ) : (
                <>
                    {/* Spending Chart */}
                    <Grid item xs={12} lg={8}>
                        <Card sx={{ height: '100%', borderRadius: '16px' }}>
                            <CardContent>
                                <Typography variant="h3" sx={{ mb: 3 }}>Spending History</Typography>
                                <Box sx={{ height: 300, width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={bills}>
                                            <defs>
                                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                            <XAxis dataKey="createdAt" tickFormatter={(str) => new Date(str).toLocaleDateString()} stroke={theme.palette.text.secondary} fontSize={12} />
                                            <YAxis stroke={theme.palette.text.secondary} fontSize={12} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: theme.palette.background.paper, borderColor: theme.palette.divider, color: theme.palette.text.primary }}
                                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                            />
                                            <Area type="monotone" dataKey="amount" stroke={theme.palette.primary.main} fillOpacity={1} fill="url(#colorAmount)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Summary Cards */}
                    <Grid item xs={12} lg={4}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} lg={12}>
                                <Card sx={{ borderRadius: '16px', bgcolor: theme.palette.primary.dark, color: '#fff' }}>
                                    <CardContent>
                                        <Typography variant="body2" sx={{ opacity: 0.7 }}>Total Spent</Typography>
                                        <Typography variant="h2" sx={{ color: '#fff', mt: 1 }}>
                                            ₹{bills.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} lg={12}>
                                <Card sx={{ borderRadius: '16px', bgcolor: theme.palette.secondary.dark, color: '#fff' }}>
                                    <CardContent>
                                        <Typography variant="body2" sx={{ opacity: 0.7 }}>Total Invoices</Typography>
                                        <Typography variant="h2" sx={{ color: '#fff', mt: 1 }}>
                                            {bills.length}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Invoices Table */}
                    <Grid item xs={12}>
                        <Card sx={{ borderRadius: '16px' }}>
                            <CardContent sx={{ p: 0, pb: '0 !important' }}>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Date</TableCell>
                                                <TableCell>Description</TableCell>
                                                <TableCell>Amount</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Action</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {bills.map((bill) => (
                                                <TableRow key={bill.id} hover>
                                                    <TableCell>{new Date(bill.createdAt).toLocaleDateString()}</TableCell>
                                                    <TableCell>{bill.description}</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>₹{bill.amount.toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label="PAID"
                                                            size="small"
                                                            sx={{
                                                                bgcolor: theme.palette.success.light,
                                                                color: theme.palette.success.dark,
                                                                fontWeight: 'bold',
                                                                borderRadius: '8px'
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            startIcon={<Download />}
                                                            size="small"
                                                            onClick={() => handleDownload(bill.id)}
                                                        >
                                                            PDF
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    </Grid>
                </>
            )}
        </Grid>
    );
};

export default DashboardFinance;
