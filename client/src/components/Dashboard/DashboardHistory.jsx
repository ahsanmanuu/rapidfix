import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    TextField,
    Button,
    InputAdornment,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Collapse,
    Divider,
    Avatar,
    Stack,
    Pagination
} from '@mui/material';
import {
    Search,
    DateRange,
    FilterList,
    Download,
    CheckCircle,
    PendingActions,
    Payments,
    ExpandMore,
    ExpandLess,
    Description,
    Star,
    Bolt,
    Plumbing,
    AcUnit,
    FormatPaint,
    CleaningServices,
    Check,
    ChevronLeft,
    ChevronRight,
    HomeRepairService
} from '@mui/icons-material';

const PRIMARY_BLUE = '#2463eb';
const BG_LIGHT = '#f6f6f8';
const TEXT_DARK = '#111621';

// Mock Data matching the HTML
const stats = [
    { title: 'Total Jobs Done', value: '24', change: '+12% this month', icon: <CheckCircle sx={{ fontSize: 20 }} />, color: '#2463eb', bg: '#eff6ff' },
    { title: 'Ongoing Projects', value: '2', change: '', icon: <PendingActions sx={{ fontSize: 20 }} />, color: '#ea580c', bg: '#fff7ed' },
    { title: 'Total Spend', value: '$4,250.00', change: '+5% this month', icon: <Payments sx={{ fontSize: 20 }} />, color: '#16a34a', bg: '#f0fdf4' }
];

const Row = ({ row, isExpanded, onToggle }) => {
    return (
        <>
            <TableRow
                sx={{
                    '&:hover': { bgcolor: 'grey.50' },
                    cursor: 'pointer',
                    bgcolor: isExpanded ? 'rgba(36, 99, 235, 0.04)' : 'inherit',
                    borderLeft: isExpanded ? `4px solid ${PRIMARY_BLUE}` : '4px solid transparent',
                    transition: 'all 0.2s'
                }}
                onClick={onToggle}
            >
                <TableCell sx={{ py: { xs: 1.5, md: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
                        <Box sx={{
                            width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 }, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: row.iconBg, color: row.iconColor, flexShrink: 0
                        }}>
                            {React.cloneElement(row.icon, { sx: { fontSize: { xs: 18, md: 24 } } })}
                        </Box>
                        <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: { xs: '0.8rem', md: '0.875rem' } }}>{row.service}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>{row.subService}</Typography>
                        </Box>
                    </Box>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Typography variant="body2" sx={{ color: PRIMARY_BLUE, fontWeight: 500 }}>{row.id}</Typography>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar src={row.proImg} sx={{ width: 32, height: 32 }} />
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>{row.proName}</Typography>
                    </Box>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>{row.date}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.time}</Typography>
                    </Box>
                </TableCell>
                <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', md: '0.875rem' } }}>{row.cost}</Typography>
                </TableCell>
                <TableCell>
                    <Chip
                        label={row.status}
                        size="small"
                        sx={{
                            bgcolor: row.statusBg,
                            color: row.statusColor,
                            fontWeight: 600,
                            borderRadius: '999px',
                            height: 24,
                            fontSize: '0.7rem',
                            '& .MuiChip-label': { px: 1 }
                        }}
                    />
                </TableCell>
                <TableCell align="right" sx={{ px: { xs: 1, md: 2 } }}>
                    <IconButton size="small" sx={{ color: isExpanded ? PRIMARY_BLUE : 'text.secondary' }}>
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>

                            {/* Mobile Only Details (Hidden columns appear here) */}
                            <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Job ID</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: PRIMARY_BLUE }}>{row.id}</Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Date & Time</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.date}, {row.time}</Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'white', p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                    <Avatar src={row.proImg} sx={{ width: 40, height: 40 }} />
                                    <Box>
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Professional</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.proName}</Typography>
                                    </Box>
                                </Box>
                                <Divider />
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                {/* Timeline */}
                                <Box sx={{ flex: 1, width: '100%' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 3, fontWeight: 600 }}>Service Timeline</Typography>
                                    <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'space-between', maxWidth: 600 }}>
                                        <Box sx={{ position: 'absolute', top: '14px', left: 0, right: 0, height: 2, bgcolor: 'grey.300', zIndex: 0 }} />
                                        {['Request Received', 'Pro Assigned', 'Work Started', 'Completed'].map((step, index) => (
                                            <Box key={step} sx={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'grey.50', px: 1 }}>
                                                <Box sx={{
                                                    width: 30, height: 30, borderRadius: '50%',
                                                    bgcolor: index === 3 ? '#10b981' : PRIMARY_BLUE,
                                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: index === 3 ? '0 0 0 4px #d1fae5' : 'none',
                                                    mb: 1
                                                }}>
                                                    <Check sx={{ fontSize: 16 }} />
                                                </Box>
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: index === 3 ? '#10b981' : 'text.secondary', fontSize: '0.7rem', textAlign: 'center' }}>
                                                    {step}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>

                                {/* Actions */}
                                <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' }, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Description />}
                                        sx={{ textTransform: 'none', color: 'text.primary', borderColor: 'grey.300', width: { xs: '100%', sm: 'auto' } }}
                                    >
                                        Download Invoice
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<Star />}
                                        sx={{ textTransform: 'none', bgcolor: PRIMARY_BLUE, '&:hover': { bgcolor: '#1d4ed8' }, width: { xs: '100%', sm: 'auto' } }}
                                    >
                                        Rate Professional
                                    </Button>
                                </Box>
                            </Box>

                            {/* Details */}
                            <Grid container spacing={2} sx={{ mt: 2 }}>
                                <Grid item xs={12} md={6}>
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'white' }}>
                                        <Typography variant="caption" sx={{ textTransform: 'uppercase', color: 'text.secondary', fontWeight: 600 }}>Customer Note</Typography>
                                        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic', color: 'text.primary' }}>
                                            "Main breaker keeps tripping whenever the AC turns on. Please check the panel."
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'white' }}>
                                        <Typography variant="caption" sx={{ textTransform: 'uppercase', color: 'text.secondary', fontWeight: 600 }}>Professional Note</Typography>
                                        <Typography variant="body2" sx={{ mt: 1, color: 'text.primary' }}>
                                            "Replaced faulty 20A breaker with a new unit. Tested load capacity. All systems normal."
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

const DashboardHistory = () => {
    const [expandedId, setExpandedId] = useState(2); // Fix-9929 expanded by default

    const handleToggle = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const rows = [
        {
            id: '#FIX-9928', service: 'Plumbing Repair', subService: 'Kitchen Sink', proName: 'John M.', proImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_ju01payJzPZY9Zv9GYFMSnNL8SImxpAgUa54klHNIjlRqL4dO3EHN-ywvD2Iy8mS292j34GJG_SBPZONZljaDN9B0F3MZ1_M4zEnLqZilWJ3Fy_E9an5iYq4jl2LcLjctlnKZBn471itjk-rI_3nvEDhIYVfxmCwB9eLKDRfjJG_AMx-2_1mLA_WoGHQpn7bjtLxbdNPAHBs_vbbS2bl5a_5T6Te4Jxt68lLW5s1pb1xZYquDchYkR72eoPU07eqQck7AS_Jlw',
            date: 'Oct 24, 2023', time: '2:00 PM', cost: '$150.00', status: 'Completed',
            icon: <Plumbing />, iconBg: '#dbeafe', iconColor: '#2563eb', statusBg: '#ecfdf5', statusColor: '#047857'
        },
        {
            id: '#FIX-9929', service: 'Electrical Fix', subService: 'Panel Upgrade', proName: 'Mike R.', proImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYuWtW0lQhfTSCfMMKXTkMOWyws-CPt3LT0CU3T6MOdMt1CEQfLY5eWriMSOPSALFlALZUwcUU3le8S3hrZNdsdWg-BVWju6vThReTrlStWtZLcBi7C9_vPtupYRncMxVr2EnP-m-VkoLWrbGTusa-x5TY83hUgGXNo2ZCfh91qanheJYVQNOPCr5c4UU0-fLRHJG6gIfRSn2B9pC_BCDvEBaPX6QQD0gsVIMRhEchxaWBNhOxMKSwjYM-03lfCr01aq09tva-bQ',
            date: 'Oct 25, 2023', time: '10:00 AM', cost: '$200.00', status: 'Completed',
            icon: <Bolt />, iconBg: '#ffedd5', iconColor: '#ea580c', statusBg: '#ecfdf5', statusColor: '#047857'
        },
        {
            id: '#FIX-9930', service: 'AC Service', subService: 'Annual Maintenance', proName: 'Sarah L.', proImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8EeSY5ZhMrjyRpWQLuiCLrGIu0O6kAC5yATMIfzG5JF53by5I5-zoTeH57dGq-vVSforFE5RZg-nvKqipcE8Qzz5I5_PAD-mxL8GZ4yQTsGUyMPyHXMGBrh4Eu0rmraof0FAUREpImxSlIO-x6Lx6ceFyFkhgX12mm9hRZnp-24JhA0TCsl2VYHBzOHHwRN5ty-gAuHAW1WBDbr2hz7bL2eZNRdI8gwoPbKBaicYOiUotMrAWqBRpOGmM7W3leIwl_fEY6XsOMw',
            date: 'Oct 26, 2023', time: '11:30 AM', cost: '$120.00', status: 'Processing',
            icon: <AcUnit />, iconBg: '#cffafe', iconColor: '#0891b2', statusBg: '#eff6ff', statusColor: '#1d4ed8'
        },
        {
            id: '#FIX-9931', service: 'Wall Painting', subService: 'Living Room', proName: 'David K.', proImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvxEF0LGlSOTm1f4_0gFjikKWZrviROsIUynU1IHT7xk6CstZrxOZn2nhIBhsodMJhoGYRzgBInMDmG-_gyJuRgpIdWiQ3qBmDr_7wZvk_1BiiiQu-IPlVB5pM_rEDW2eXF4veUzgyVV7JhdGGrGes0AIOIrL7hi1v-b2FytG-Y0LuwPAX-eYGjh8vEWGsSMCdpMLYBJ9o6EJxBo-4nRhovdHnTKDKqZlY25iVDTM4DMJrt_-S0M-d99K6OIS5HQH2UEdhxaLzSQ',
            date: 'Oct 27, 2023', time: '9:00 AM', cost: '$500.00', status: 'Cancelled',
            icon: <FormatPaint />, iconBg: '#f3e8ff', iconColor: '#9333ea', statusBg: '#f1f5f9', statusColor: '#475569'
        },
        {
            id: '#FIX-9932', service: 'Deep Cleaning', subService: 'Full House', proName: 'Emily W.', proImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCd5OlJ1DXB2J06vNOONG_oo_pCPDM0CdypMcgLHDafWdy9P_9stZtFk89z7PogTbh58khV9tESIAv0YQPVe59qKp1W2nUZQ7x0-5Gpii8rPYXd9kl_jA12pbHT-ULZ7H_hmr6Clu4YljxPfJ8aM9LbeMLyRDuctS2mheFdSiZYdOPqUgEhBot4JHs6z9I-EhpfJOBrueL-Jn6eoxkFbdKWAppBATHrH2e8-SFQSgv98ZCiUI8xCXTD7yCijfCPjirlk1d8m8QyvQ',
            date: 'Oct 28, 2023', time: '3:00 PM', cost: '$80.00', status: 'Processing',
            icon: <CleaningServices />, iconBg: '#ccfbf1', iconColor: '#0d9488', statusBg: '#eff6ff', statusColor: '#1d4ed8'
        }
    ];

    return (
        <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 }, fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, color: TEXT_DARK }}>Job History</Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>Manage, track, and review your service requests history.</Typography>
            </Box>

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                {stats.map((stat, i) => (
                    <Grid item xs={12} md={4} key={i}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Box sx={{
                                        width: 32, height: 32, borderRadius: '50%',
                                        bgcolor: stat.bg, color: stat.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {stat.icon}
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>{stat.title}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: TEXT_DARK }}>{stat.value}</Typography>
                                    {stat.change && (
                                        <Chip
                                            label={stat.change}
                                            size="small"
                                            sx={{ bgcolor: '#ecfdf5', color: '#059669', fontSize: 11, fontWeight: 600, height: 20 }}
                                        />
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Table Section */}
            <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                {/* Toolbar */}
                <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                    <TextField
                        placeholder="Search by Job ID, Service or Pro..."
                        size="small"
                        variant="outlined"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: 'text.disabled' }} />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: 2, bgcolor: '#f8fafc', '& fieldset': { borderColor: '#e2e8f0' } }
                        }}
                        sx={{ width: '100%', maxWidth: 380 }}
                    />
                    <Stack direction="row" spacing={1.5}>
                        <Button variant="outlined" startIcon={<DateRange />} sx={{ textTransform: 'none', color: 'text.primary', borderColor: '#e2e8f0' }}>Date Range</Button>
                        <Button variant="outlined" startIcon={<FilterList />} sx={{ textTransform: 'none', color: 'text.primary', borderColor: '#e2e8f0' }}>Filter</Button>
                        <Button variant="contained" startIcon={<Download />} sx={{ textTransform: 'none', bgcolor: 'rgba(36, 99, 235, 0.05)', color: PRIMARY_BLUE, boxShadow: 'none', '&:hover': { bgcolor: 'rgba(36, 99, 235, 0.1)' } }}>Export</Button>
                    </Stack>
                </Box>

                {/* DESKTOP TABLE VIEW */}
                <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8fafc' }}>
                            <TableRow>
                                {['Service', 'Job ID', 'Professional', 'Date & Time', 'Cost', 'Status', 'Actions'].map((head, i) => (
                                    <TableCell key={head} align={i === 6 ? 'right' : 'left'} sx={{
                                        textTransform: 'uppercase', fontSize: 11, fontWeight: 600, color: 'text.secondary', py: 2
                                    }}>
                                        {head}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((row, index) => (
                                <Row
                                    key={row.id}
                                    row={row}
                                    isExpanded={expandedId === index}
                                    onToggle={() => handleToggle(index)}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* MOBILE CARD VIEW */}
                <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column' }}>
                    {rows.map((row, index) => {
                        const isExpanded = expandedId === index;
                        return (
                            <Box key={row.id} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: isExpanded ? 'rgba(36, 99, 235, 0.04)' : 'white' }}>
                                {/* Mobile Row Header */}
                                <Box
                                    onClick={() => handleToggle(index)}
                                    sx={{ p: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', cursor: 'pointer' }}
                                >
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        {/* Icon */}
                                        <Box sx={{
                                            width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            bgcolor: row.iconBg, color: row.iconColor, flexShrink: 0
                                        }}>
                                            {React.cloneElement(row.icon, { sx: { fontSize: 20 } })}
                                        </Box>

                                        {/* Main Info */}
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.2, mb: 0.5 }}>
                                                {row.service}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                <Typography variant="caption" sx={{ color: PRIMARY_BLUE, fontWeight: 500 }}>{row.id}</Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>• {row.date}</Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>{row.cost}</Typography>
                                        </Box>
                                    </Box>

                                    {/* Status & Toggle */}
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                                        <Chip
                                            label={row.status}
                                            size="small"
                                            sx={{
                                                bgcolor: row.statusBg,
                                                color: row.statusColor,
                                                fontWeight: 600,
                                                borderRadius: '6px',
                                                height: 24,
                                                fontSize: '0.7rem',
                                            }}
                                        />
                                        <IconButton size="small" sx={{ color: isExpanded ? PRIMARY_BLUE : 'text.secondary', p: 0.5 }}>
                                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                        </IconButton>
                                    </Box>
                                </Box>

                                {/* Mobile Expanded Content */}
                                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                    <Box sx={{ px: 2, pb: 2 }}>
                                        <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>

                                            {/* Pro Details */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                                <Avatar src={row.proImg} sx={{ width: 32, height: 32 }} />
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1 }}>Professional</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.proName}</Typography>
                                                </Box>
                                            </Box>

                                            <Divider sx={{ mb: 2 }} />

                                            {/* Timeline Short */}
                                            <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>Status</Typography>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                                <Chip size="small" label="Request Received" color="primary" variant="outlined" />
                                                <Chip size="small" label="Work Started" color="primary" variant="outlined" />
                                                <Chip size="small" label="Completed" color="success" />
                                            </Box>

                                            {/* Actions */}
                                            <Stack spacing={1}>
                                                <Button size="small" variant="outlined" startIcon={<Description />} fullWidth>
                                                    Invoice
                                                </Button>
                                                <Button size="small" variant="contained" startIcon={<Star />} fullWidth sx={{ bgcolor: PRIMARY_BLUE }}>
                                                    Rate Pro
                                                </Button>
                                            </Stack>
                                        </Box>
                                    </Box>
                                </Collapse>
                            </Box>
                        );
                    })}
                </Box>

                {/* Pagination */}
                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f9fafb' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Showing <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>1</Typography> to <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>5</Typography> of <Typography component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>24</Typography> results
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <IconButton size="small" sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'white', borderRadius: 1 }}>
                            <ChevronLeft fontSize="small" />
                        </IconButton>
                        <IconButton size="small" sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'white', borderRadius: 1 }}>
                            <ChevronRight fontSize="small" />
                        </IconButton>
                    </Stack>
                </Box>
            </Paper>
        </Box>
    );
};

export default DashboardHistory;
