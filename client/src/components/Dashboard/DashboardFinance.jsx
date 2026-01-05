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

            {bills.length === 0 ? (
                <Grid item xs={12}>
                    <Card sx={{ textAlign: 'center', p: 5, borderStyle: 'dashed' }}>
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
