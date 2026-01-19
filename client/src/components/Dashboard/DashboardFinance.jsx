import React from 'react';
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
    Avatar,
    Divider,
    Paper,
    FormControl,
    Select,
    MenuItem
} from '@mui/material';
import {
    AccountBalanceWallet,
    AddCircle,
    Download,
    CreditCard,
    CheckCircle,
    Add,
    CalendarToday,
    FilterList,
    Plumbing,
    ElectricalServices,
    CleaningServices,
    MoreVert
} from '@mui/icons-material';

const PRIMARY_GOLD = '#D0BB95';

const DashboardFinance = () => {
    const transactions = [
        {
            id: 1,
            date: 'Oct 24, 2023', time: '10:42 AM', service: 'Plumbing Repair',
            icon: <Plumbing fontSize="small" />,
            txnId: '#TXN-8839-AB', amount: '-$120.00', status: 'Paid',
            statusColor: '#d1fae5', statusText: '#065f46',
            iconColor: '#2563eb', iconBg: '#eff6ff'
        },
        {
            id: 2,
            date: 'Oct 22, 2023', time: '02:15 PM', service: 'Electrical Install',
            icon: <ElectricalServices fontSize="small" />,
            txnId: '#TXN-8812-XC', amount: '-$350.00', status: 'Pending',
            statusColor: '#fef3c7', statusText: '#92400e',
            iconColor: '#9333ea', iconBg: '#faf5ff'
        },
        {
            id: 3,
            date: 'Oct 15, 2023', time: '09:00 AM', service: 'Wallet Top-up',
            icon: <AccountBalanceWallet fontSize="small" />,
            txnId: '#WLT-1002-PP', amount: '+$500.00', status: 'Success',
            statusColor: '#d1fae5', statusText: '#065f46',
            iconColor: '#475569', iconBg: '#f1f5f9',
            isPositive: true
        },
        {
            id: 4,
            date: 'Oct 02, 2023', time: '11:30 AM', service: 'Cleaning Service',
            icon: <CleaningServices fontSize="small" />,
            txnId: '#TXN-7662-ZZ', amount: '-$85.00', status: 'Refunded',
            statusColor: '#fee2e2', statusText: '#991b1b',
            iconColor: '#dc2626', iconBg: '#fef2f2',
            isStruck: true
        }
    ];

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
                        {/* Background Decoration */}
                        <Box sx={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, bgcolor: 'rgba(208, 187, 149, 0.1)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }} />

                        <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                                <Box>
                                    <Typography variant="caption" fontWeight="600" sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Total Balance
                                    </Typography>
                                    <Typography variant="h3" fontWeight="900" sx={{ color: '#0f172a' }}>
                                        $450.00
                                    </Typography>
                                </Box>
                                <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: 'rgba(208, 187, 149, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PRIMARY_GOLD }}>
                                    <AccountBalanceWallet />
                                </Box>
                            </Box>

                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                    <Box sx={{ flex: 1, height: 6, bgcolor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                        <Box sx={{ width: '75%', height: '100%', bgcolor: PRIMARY_GOLD, borderRadius: '4px' }} />
                                    </Box>
                                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>Monthly Limit</Typography>
                                </Box>

                                <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                    <Typography variant="caption" fontWeight="600" sx={{ color: '#64748b', mb: 1, display: 'block' }}>HAVE A PROMO CODE?</Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <InputBase placeholder="ENTERCODE" sx={{ flex: 1, fontSize: '0.9rem', fontFamily: 'monospace', textTransform: 'uppercase' }} />
                                        <Button size="small" sx={{ color: PRIMARY_GOLD, fontWeight: 'bold' }}>Apply</Button>
                                    </Box>
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
                                <Button size="small" sx={{ color: PRIMARY_GOLD, fontWeight: 'bold', textTransform: 'none' }}>Manage</Button>
                            </Box>

                            <Grid container spacing={2}>
                                {/* Visa Card */}
                                <Grid item xs={12} md={6}>
                                    <Box sx={{
                                        p: 2.5, borderRadius: '16px', border: '1px solid #e2e8f0', cursor: 'pointer',
                                        background: 'linear-gradient(135deg, #f8fafc 0%, #fff 100%)',
                                        transition: 'all 0.2s', '&:hover': { borderColor: PRIMARY_GOLD, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
                                        position: 'relative', overflow: 'hidden'
                                    }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                                            <Paper elevation={0} sx={{ p: 0.5, borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuArMIGS8xajZbyr8Jk4NJoq54SMifbjOFoHxsH3Q4QTJTOk8nm0Fw8LxKr8Ec3FW6ZWOQ8DbJz87TGMBRtajXJDVhgffwAB0YC4GWNb_T_KwwyRH1VnmASJh6tqWWqF30igX_dlWwbGJfi_h7Is5XyC9kfpzo2sAdho-XKKJ4q0HFAufpsyeMHjTZSN2G51aDZvfzmEP5lQSskqTEyj0ZtoWr6cs7yI37036VY-qqxZcm3gHxmgHeYvl9I5IPirs_T578FbfhXj5Q" alt="Visa" style={{ height: 24, display: 'block' }} />
                                            </Paper>
                                            <Chip label="PRIMARY" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 'bold', height: 20, fontSize: '0.65rem' }} />
                                        </Box>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748b' }}>**** **** **** 4242</Typography>
                                        <Typography variant="body2" fontWeight="bold" sx={{ color: '#0f172a' }}>Visa Ending in 4242</Typography>
                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>Expires 12/24</Typography>

                                        <CheckCircle sx={{ position: 'absolute', top: 16, right: 16, color: PRIMARY_GOLD }} />
                                    </Box>
                                </Grid>

                                {/* PayPal Card */}
                                <Grid item xs={12} md={6}>
                                    <Box sx={{
                                        p: 2.5, borderRadius: '16px', border: '1px solid #e2e8f0', cursor: 'pointer',
                                        background: 'linear-gradient(135deg, #f8fafc 0%, #fff 100%)',
                                        transition: 'all 0.2s', '&:hover': { borderColor: PRIMARY_GOLD, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
                                    }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                                            <Paper elevation={0} sx={{ p: 0.5, borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6eFnmG0lFrtRY_PSUR-TDyNb5MyD-qTURfayyr6ZrikRHtfdUijal7cn5EdfDVKeJD8HA1gEfan7qT1tjgC3zqWi1dK34LJDEFqxIvzjLrRW5lzm-TwWfL7LRVoIVmqNHl8aeuz0pgxszOWvDn6KmjXybKrGY5wboWnDSO5yFCZq-C2FPwl9iUA-dLaGACLf74B-gJTNU3_RS84r9XCyAz7ZoMaKYkHd7qdgfKYRuTXj0XXkU6mrsOPZydpyC7Zg_FmARZqwjJA" alt="PayPal" style={{ height: 24, display: 'block' }} />
                                            </Paper>
                                        </Box>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748b' }}>user@example.com</Typography>
                                        <Typography variant="body2" fontWeight="bold" sx={{ color: '#0f172a' }}>PayPal Account</Typography>
                                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>Connected</Typography>
                                    </Box>
                                </Grid>

                                {/* Add New Method */}
                                <Grid item xs={12}>
                                    <Box sx={{
                                        p: 2, borderRadius: '12px', border: '2px dashed #e2e8f0',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
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

                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {/* Status Filter Dummy */}
                        <Box sx={{ position: 'relative' }}>
                            <Select
                                value="All Status"
                                size="small"
                                sx={{ borderRadius: '8px', bgcolor: '#f8fafc', '& .MuiSelect-select': { py: 1, fontSize: '0.875rem' } }}
                            >
                                <MenuItem value="All Status">All Status</MenuItem>
                                <MenuItem value="Paid">Paid</MenuItem>
                            </Select>
                        </Box>
                        {/* Date Filter Dummy */}
                        <Box sx={{ position: 'relative' }}>
                            <CalendarToday sx={{ position: 'absolute', left: 10, top: 8, fontSize: 18, color: '#94a3b8', zIndex: 1 }} />
                            <InputBase placeholder="Filter by date" sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', pl: 4.5, pr: 2, py: 0.5, fontSize: '0.875rem', width: 140 }} />
                        </Box>
                        <IconButton sx={{ border: '1px solid #e2e8f0', borderRadius: '8px' }} size="small">
                            <FilterList fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>

                {/* DESKTOP TABLE VIEW */}
                <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Date</TableCell>
                                <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Service</TableCell>
                                <TableCell sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Transaction ID</TableCell>
                                <TableCell align="right" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Amount</TableCell>
                                <TableCell align="center" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
                                <TableCell align="center" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.map((txn) => (
                                <TableRow key={txn.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="500" color="#0f172a">{txn.date}</Typography>
                                        <Typography variant="caption" color="#94a3b8">{txn.time}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{ width: 32, height: 32, borderRadius: '6px', bgcolor: txn.iconBg, color: txn.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {txn.icon}
                                            </Box>
                                            <Typography variant="body2" fontWeight="500" color="#0f172a">{txn.service}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: '#f8fafc', px: 1, py: 0.5, borderRadius: '4px', color: '#475569' }}>
                                            {txn.txnId}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" fontWeight="bold" sx={{ color: txn.amountColor ? txn.amountColor : (txn.isPositive ? '#059669' : (txn.isStruck ? '#94a3b8' : '#0f172a')), textDecoration: txn.isStruck ? 'line-through' : 'none' }}>
                                            {txn.amount}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={txn.status}
                                            size="small"
                                            sx={{
                                                bgcolor: txn.statusColor, color: txn.statusText,
                                                fontWeight: 'bold', fontSize: '0.75rem', height: 24
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton size="small" sx={{ color: '#94a3b8', '&:hover': { color: PRIMARY_GOLD } }}>
                                            <Download fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* MOBILE CARD VIEW */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column' }}>
                    {transactions.map((txn, index) => (
                        <Box key={txn.id} sx={{
                            p: 2,
                            borderBottom: index !== transactions.length - 1 ? '1px solid #f1f5f9' : 'none',
                            bgcolor: 'white'
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                <Box sx={{ display: 'flex', gap: 1.5 }}>
                                    <Box sx={{
                                        width: 40, height: 40, borderRadius: '8px',
                                        bgcolor: txn.iconBg, color: txn.iconColor,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {React.cloneElement(txn.icon, { fontSize: 'medium' })}
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight="600" color="#0f172a">{txn.service}</Typography>
                                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748b' }}>{txn.txnId}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2" fontWeight="800" sx={{ color: txn.amountColor ? txn.amountColor : (txn.isPositive ? '#059669' : (txn.isStruck ? '#94a3b8' : '#0f172a')), textDecoration: txn.isStruck ? 'line-through' : 'none' }}>
                                        {txn.amount}
                                    </Typography>
                                    <Typography variant="caption" color="#94a3b8" display="block">{txn.date}</Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Chip
                                    label={txn.status}
                                    size="small"
                                    sx={{
                                        bgcolor: txn.statusColor, color: txn.statusText,
                                        fontWeight: 'bold', fontSize: '0.7rem', height: 24
                                    }}
                                />
                                <IconButton size="small" sx={{ color: '#94a3b8', border: '1px solid #e2e8f0', borderRadius: '6px', p: 0.5 }}>
                                    <Download fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Card>
        </Box>
    );
};

export default DashboardFinance;
