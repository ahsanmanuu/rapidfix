import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Chip,
    Avatar,
    Divider,
    Stepper,
    Step,
    StepLabel,
    StepConnector,
    StepIcon,
    styled,
    Paper,
    Stack
} from '@mui/material';
import {
    Check,
    LocalShipping,
    Construction,
    Flag,
    Star,
    Chat,
    FormatQuote,
    AcUnit,
    CalendarToday,
    LocationOn,
    NearMe,
    SupportAgent,
    CalendarMonth,
    Cancel,
    Security,
    Info,
    ChevronRight,
    Home
} from '@mui/icons-material';

const PRIMARY_BLUE = '#2463eb';
const TEXT_DARK = '#111318';
const TEXT_LIGHT = '#616e89';

// Custom Stepper Connector
const QontoConnector = styled(StepConnector)(({ theme }) => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
        top: 10,
        left: 'calc(-50% + 16px)',
        right: 'calc(50% + 16px)',
    },
    [`&.${stepConnectorClasses.active}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            borderColor: PRIMARY_BLUE,
        },
    },
    [`&.${stepConnectorClasses.completed}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            borderColor: PRIMARY_BLUE,
        },
    },
    [`& .${stepConnectorClasses.line}`]: {
        borderColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
        borderTopWidth: 3,
        borderRadius: 1,
    },
}));

import { stepConnectorClasses } from '@mui/material/StepConnector';

const ColorlibStepIconRoot = styled('div')(({ theme, ownerState }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
    zIndex: 1,
    color: '#fff',
    width: 35,
    height: 35,
    display: 'flex',
    borderRadius: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    ...(ownerState.active && {
        backgroundColor: PRIMARY_BLUE,
        boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
    }),
    ...(ownerState.completed && {
        backgroundColor: PRIMARY_BLUE,
    }),
}));

function ColorlibStepIcon(props) {
    const { active, completed, className } = props;

    const icons = {
        1: <Check fontSize="small" />,
        2: <Check fontSize="small" />,
        3: <LocalShipping fontSize="small" />,
        4: <Construction fontSize="small" />,
        5: <Flag fontSize="small" />,
    };

    return (
        <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
            {icons[String(props.icon)]}
        </ColorlibStepIconRoot>
    );
}

const ActiveBooking = () => {
    // Mock Data based on the design
    const activeStep = 2; // "In Transit" (0-indexed: Confirmed, Assigned, In Transit) -> actually index is 2
    const steps = ['Confirmed', 'Assigned', 'In Transit', 'In Progress', 'Completed'];

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, md: 3 }, fontFamily: 'Inter, sans-serif' }}>

            {/* Breadcrumbs */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 13, color: TEXT_LIGHT, mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'inherit', '&:hover': { color: PRIMARY_BLUE }, cursor: 'pointer', fontSize: 'inherit' }}>Home</Typography>
                <ChevronRight sx={{ fontSize: 14 }} />
                <Typography variant="body2" sx={{ color: 'inherit', '&:hover': { color: PRIMARY_BLUE }, cursor: 'pointer', fontSize: 'inherit' }}>My Bookings</Typography>
                <ChevronRight sx={{ fontSize: 14 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: TEXT_DARK, fontSize: 'inherit' }}>Job #4291</Typography>
            </Box>

            {/* Header */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2, mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: TEXT_DARK, mb: 0.5 }}>Active Booking</Typography>
                    <Typography variant="body2" sx={{ color: TEXT_LIGHT }}>Track your ongoing service request in real-time.</Typography>
                </Box>
                <Chip
                    icon={<Box sx={{ width: 6, height: 6, bgcolor: '#22c55e', borderRadius: '50%', ml: 1 }} className="animate-pulse" />}
                    label="In Progress"
                    sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 600, fontSize: 12, height: 28, '& .MuiChip-label': { px: 1.5 } }}
                />
            </Box>

            {/* Stepper Card */}
            <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ py: 3, px: { xs: 2, md: 4 } }}>
                    <Stepper alternativeLabel activeStep={activeStep} connector={<QontoConnector />}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel StepIconComponent={ColorlibStepIcon}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: activeStep >= steps.indexOf(label) ? PRIMARY_BLUE : TEXT_LIGHT }}>
                                        {label}
                                    </Typography>
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </CardContent>
            </Card>

            <Grid container spacing={2}>
                {/* LEFT COL */}
                <Grid item xs={12} sm={4}>
                    <Stack spacing={2}>
                        {/* Professional Profile */}
                        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                            <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, alignItems: { xs: 'center', sm: 'start' } }}>
                                    <Box sx={{ position: 'relative' }}>
                                        <Avatar
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-gpy0eRvo5gWIJv0EUz5OBf0vKdPxz7jjeDL0isA6TuVTchlRu-ZTnCxjj65y-z1AEuzN_LOpHPUMQdxcLTD6BG73YXWNovUa2Z8NRn1LAiHI57jVg6pf7IhfoLmO9D3qAECRO2nNoYLrqxryfxRtQFmtNZ1CeD9eiEgPguRPQYrHXyGbbtxyNWxcB8Wv9IQIf6ELbzVKU0ZNQnEsAQRs-y-67waBW2lhPhoAfGUMR_Z_djkIND7hsX8QafOIgyzBhHXvCMSD4w"
                                            sx={{ width: 50, height: 50, border: '2px solid white', boxShadow: 2 }}
                                        />
                                        <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, bgcolor: '#22c55e', borderRadius: '50%', border: '2px solid white' }} />
                                    </Box>
                                    <Box sx={{ flex: 1, width: '100%', textAlign: { xs: 'center', sm: 'left' } }}>
                                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'center', sm: 'start' }, mb: 1 }}>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>Michael Roberts</Typography>
                                                <Typography variant="caption" sx={{ color: TEXT_LIGHT, display: 'block', mb: 0.5, fontSize: '0.7rem' }}>Senior AC Technician • 500+ Jobs</Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', sm: 'start' }, gap: 0.5 }}>
                                                    <Star sx={{ color: '#facc15', fontSize: 14 }} />
                                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>4.9</Typography>
                                                    <Typography variant="caption" sx={{ color: TEXT_LIGHT, fontSize: '0.65rem' }}>(124 Reviews)</Typography>
                                                </Box>
                                            </Box>
                                            <Button
                                                variant="contained"
                                                startIcon={<Chat sx={{ fontSize: 16 }} />}
                                                size="small"
                                                sx={{ mt: { xs: 1.5, sm: 0 }, bgcolor: 'rgba(36, 99, 235, 0.1)', color: PRIMARY_BLUE, boxShadow: 'none', '&:hover': { bgcolor: 'rgba(36, 99, 235, 0.2)' }, textTransform: 'none', fontWeight: 600, height: 28, fontSize: '0.75rem', minWidth: 'auto', px: 1.5 }}
                                            >
                                                Message
                                            </Button>
                                        </Box>
                                        <Box sx={{ bgcolor: '#f6f6f8', p: 1.5, borderRadius: 2, mt: 1, display: 'flex', gap: 1, alignItems: 'start' }}>
                                            <FormatQuote sx={{ color: TEXT_LIGHT, transform: 'rotate(180deg)', fontSize: 16 }} />
                                            <Typography variant="caption" sx={{ color: TEXT_LIGHT, fontStyle: 'italic', lineHeight: 1.3, fontSize: '0.7rem' }}>
                                                Hi, I'm Michael. I'm about 15 minutes away...
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Booking Details */}
                        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                            <Box sx={{ p: 2, px: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Booking Details</Typography>
                            </Box>
                            <Box sx={{ p: 3 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Stack spacing={3}>
                                            <Box>
                                                <Typography variant="caption" sx={{ textTransform: 'uppercase', color: TEXT_LIGHT, fontWeight: 700, fontSize: '0.7rem' }}>Service Type</Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                    <AcUnit sx={{ color: PRIMARY_BLUE, fontSize: 18 }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>AC Repair & Service</Typography>
                                                </Box>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ textTransform: 'uppercase', color: TEXT_LIGHT, fontWeight: 700, fontSize: '0.7rem' }}>Job ID</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>#4291-XA-09</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ textTransform: 'uppercase', color: TEXT_LIGHT, fontWeight: 700, fontSize: '0.7rem' }}>Date & Time</Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                    <CalendarToday sx={{ color: TEXT_LIGHT, fontSize: 18 }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Oct 24, 2023 • 10:00 AM</Typography>
                                                </Box>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" sx={{ textTransform: 'uppercase', color: TEXT_LIGHT, fontWeight: 700, fontSize: '0.7rem' }}>Service Address</Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'start', gap: 1, mt: 0.5 }}>
                                                    <LocationOn sx={{ color: TEXT_LIGHT, fontSize: 18 }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        123 Maple Avenue, Apt 4B<br />Springfield, IL 62704
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Stack>
                                    </Grid>
                                    {/* Map */}
                                    <Grid item xs={12}>
                                        <Box sx={{
                                            height: '100%', minHeight: 180, borderRadius: 2, bgcolor: '#f3f4f6', position: 'relative', overflow: 'hidden',
                                            backgroundImage: 'url(https://lh3.googleusercontent.com/aida-public/AB6AXuAGLNFqfs6g7rpUTg9jy6wM2quXVSDv00TIXlmzzdcy__Encp94205od2lW6ysWAswBOue4KZsYpEEaHomQYuNWRiDeBOnQEBfCoMXF4TtroQFfpBREne0CAdQgoar7omZwVnMxUjbzvqB3rHcd0FnkNuT7DU8GA0wiB2zBWYM3kXb9TMXQaVTYOhdiq2gt2HP74woWnGwcKlV4jYDry2Ae-YGN1sfhiVDtvAu6Ch8JztmnCap76qT0fsj_i9Oe9wYmssTEIzio6g)',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            cursor: 'pointer'
                                        }}>
                                            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                <Box sx={{ bgcolor: 'white', p: 1, borderRadius: '50%', boxShadow: 3 }}>
                                                    <NearMe sx={{ color: PRIMARY_BLUE }} />
                                                </Box>
                                            </Box>
                                            <Box sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(255,255,255,0.9)', px: 1, py: 0.5, borderRadius: 1 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 600 }}>Get Directions</Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Card>
                    </Stack>
                </Grid>

                {/* RIGHT COL */}
                <Grid item xs={12} sm={8}>
                    <Stack spacing={2}>
                        {/* Payment Summary */}
                        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                            <Box sx={{ p: 2, px: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Payment Summary</Typography>
                            </Box>
                            <CardContent sx={{ p: 2.5 }}>
                                <Stack spacing={1.5}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: TEXT_LIGHT }}>Service Fee</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>$45.00</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: TEXT_LIGHT }}>Spare Parts</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>--</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" sx={{ color: TEXT_LIGHT }}>Tax (10%)</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>$4.50</Typography>
                                    </Box>
                                    <Divider sx={{ my: 0.5 }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>Total Amount</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 900, color: PRIMARY_BLUE }}>$49.50</Typography>
                                    </Box>
                                    <Box sx={{ bgcolor: '#eff6ff', p: 1, borderRadius: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                                        <Info sx={{ color: PRIMARY_BLUE, fontSize: 16 }} />
                                        <Typography variant="caption" sx={{ color: PRIMARY_BLUE, lineHeight: 1.2 }}>Final price may vary based on parts used.</Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <Card sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Actions</Typography>
                                <Stack spacing={1.5}>
                                    <Button variant="contained" startIcon={<SupportAgent />} sx={{ width: '100%', py: 1, borderRadius: 2, bgcolor: PRIMARY_BLUE, textTransform: 'none', fontWeight: 600 }}>
                                        Contact Support
                                    </Button>
                                    <Button variant="outlined" startIcon={<CalendarMonth />} sx={{ width: '100%', py: 1, borderRadius: 2, borderColor: 'divider', color: TEXT_DARK, textTransform: 'none', fontWeight: 600 }}>
                                        Reschedule
                                    </Button>
                                    <Button variant="text" startIcon={<Cancel />} sx={{ width: '100%', py: 1, borderRadius: 2, color: '#dc2626', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#fef2f2' } }}>
                                        Cancel Booking
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>

                        {/* Safety Tip */}
                        <Box sx={{ bgcolor: '#f0f9ff', border: '1px solid #dbeafe', borderRadius: 3, p: 2, display: 'flex', gap: 2 }}>
                            <Security sx={{ color: '#2563eb', fontSize: 20 }} />
                            <Box>
                                <Typography variant="subtitle2" sx={{ color: '#1e3a8a', fontWeight: 700, fontSize: '0.875rem' }}>Safety First</Typography>
                                <Typography variant="caption" sx={{ color: '#1d4ed8', lineHeight: 1.2 }}>
                                    Share your OTP <Box component="span" sx={{ bgcolor: 'white', px: 0.5, borderRadius: 0.5, fontWeight: 700, fontFamily: 'monospace' }}>8921</Box> with the professional.
                                </Typography>
                            </Box>
                        </Box>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ActiveBooking;
