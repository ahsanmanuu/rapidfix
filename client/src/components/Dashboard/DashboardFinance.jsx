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
                setBills(Array.isArray(res.data.bills) ? res.data.bills : []);
            }
        } catch (error) {
            console.error("Failed to fetch bills", error);
        }
    };

    const handleDownload = (jobId) => {
        if (!jobId) return;
        window.open(`${api.defaults.baseURL}/invoices/${jobId}/download`, '_blank');
    };

    return (
        <Grid container spacing={3} justifyContent="center">
            {/* ... Existing Banner code ... */}

            {(bills.length === 0) ? (
                // ... Existing No Bills code ...
                <Grid item xs={12}>
                    <Card sx={{ textAlign: 'center', p: 5, borderStyle: 'dashed', borderRadius: '16px' }}>
                        <ReceiptLong sx={{ fontSize: 60, color: theme.palette.text.secondary, opacity: 0.5 }} />
                        <Typography variant="h3" color="textSecondary" sx={{ mt: 2 }}>No invoices yet</Typography>
                        <Typography variant="body1" color="textSecondary">Services you book will appear here for payment.</Typography>
                    </Card>
                </Grid>
            ) : (
                <>
                    {/* ... Existing Charts ... */}

                    {/* Invoices Table */}
                    <Grid item xs={12}>
                        <Card sx={{ borderRadius: '16px' }}>
                            <CardContent sx={{ p: 0, pb: '0 !important' }}>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Date</TableCell>
                                                <TableCell>Service</TableCell>
                                                <TableCell>Amount</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell>Action</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {Array.isArray(bills) && bills.map((bill) => (
                                                <TableRow key={bill.id} hover>
                                                    <TableCell>{new Date(bill.createdAt || bill.completedAt).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <Box>
                                                            <Typography variant="subtitle2" fontWeight="bold">{bill.serviceType}</Typography>
                                                            <Typography variant="caption" color="textSecondary">Job #{bill.id.substring(0, 8)}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>₹{bill.offerPrice || bill.visitingCharges || 0}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={bill.status === 'completed' ? "PAID" : bill.status.toUpperCase()}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: bill.status === 'completed' ? theme.palette.success.light : theme.palette.warning.light,
                                                                color: bill.status === 'completed' ? theme.palette.success.dark : theme.palette.warning.dark,
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
                                                            disabled={bill.status !== 'completed'}
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
