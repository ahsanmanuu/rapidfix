import React from 'react';
import {
    Box,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    useTheme,
    useMediaQuery,
    Avatar,
    IconButton
} from '@mui/material';
import {
    Home as HomeIcon,
    Work as WorkIcon,
    Person as PersonIcon,
    Chat as ChatIcon,
    AccountBalanceWallet as WalletIcon,
    History as HistoryIcon,
    ChevronLeft as ChevronLeftIcon,
    ReportProblem as ReportIcon,
    LocalOffer as OfferIcon,
    Category as CategoryIcon
} from '@mui/icons-material';

const drawerWidth = 260;

const Sidebar = ({ open, handleDrawerToggle, window, activeTab, setActiveTab, user }) => {
    const theme = useTheme();
    const matchUpMd = useMediaQuery(theme.breakpoints.up('md'));

    const container = window !== undefined ? () => window().document.body : undefined;

    const navItems = [
        { id: 'home', label: 'Dashboard', icon: <HomeIcon /> },
        { id: 'services', label: 'All Services', icon: <CategoryIcon /> },
        { id: 'bookings', label: 'My Bookings', icon: <WorkIcon /> },
        { id: 'history', label: 'Job History', icon: <HistoryIcon /> },
        { id: 'finance', label: 'Payments & Wallet', icon: <WalletIcon /> },
        { id: 'chat', label: 'Live Chat', icon: <ChatIcon /> },
        { id: 'complaints', label: 'Complaints', icon: <ReportIcon /> },
        { id: 'offers', label: 'Latest Offers', icon: <OfferIcon /> },
        { id: 'profile', label: 'Settings', icon: <PersonIcon /> },
    ];

    const drawer = (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#ffffff', // White background
            borderRight: '1px solid #e2e8f0'
        }}>
            {/* Logo Section */}
            <Box sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                height: 80 // Match header height
            }}>
                <Avatar
                    src="/logo.png"
                    variant="rounded"
                    alt="Fixofy Logo"
                    sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'transparent',
                        '& img': { objectFit: 'contain' }
                    }}
                />
                <Typography variant="h6" fontWeight="800" sx={{ color: '#0f172a', letterSpacing: '-0.5px' }}>
                    Fixofy
                </Typography>

                {/* Mobile Close Button */}
                {!matchUpMd && (
                    <IconButton onClick={handleDrawerToggle} sx={{ ml: 'auto' }}>
                        <ChevronLeftIcon />
                    </IconButton>
                )}
            </Box>

            {/* Navigation Items */}
            <List sx={{ px: 2, py: 2, flexGrow: 1 }}>
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <ListItemButton
                            key={item.id}
                            selected={isActive}
                            onClick={() => {
                                setActiveTab(item.id);
                                if (!matchUpMd) handleDrawerToggle();
                            }}
                            sx={{
                                mb: 1,
                                borderRadius: '8px',
                                py: 1.5,
                                px: 2,
                                transition: 'all 0.2s',
                                position: 'relative',
                                bgcolor: isActive ? '#eff6ff' : 'transparent', // Light Blue if active
                                color: isActive ? '#2563eb' : '#64748b', // Blue text if active, Slate if not
                                borderRight: isActive ? '3px solid #2563eb' : '3px solid transparent', // Right border indicator
                                '&:hover': {
                                    bgcolor: isActive ? '#eff6ff' : '#f1f5f9',
                                    color: isActive ? '#2563eb' : '#1e293b'
                                }
                            }}
                        >
                            <ListItemIcon sx={{
                                minWidth: 40,
                                color: 'inherit' // Inherit color from parent (Blue or Slate)
                            }}>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{
                                    fontWeight: isActive ? 600 : 500,
                                    fontSize: '0.95rem'
                                }}
                            />
                        </ListItemButton>
                    );
                })}
            </List>

            {/* Bottom Section (Logout/Profile Summary) */}
            <Box sx={{ p: 2, borderTop: '1px solid #f1f5f9' }}>
                <ListItemButton sx={{ borderRadius: '8px', color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}>
                    <ListItemIcon sx={{ minWidth: 40, color: '#ef4444' }}>
                        <ChevronLeftIcon sx={{ transform: 'rotate(180deg)' }} /> {/* Logout Icon substitute */}
                    </ListItemIcon>
                    <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 600 }} />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Box
            component="nav"
            sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            aria-label="mailbox folders"
        >
            {/* Mobile Drawer (Temporary) */}
            <Drawer
                container={container}
                variant="temporary"
                open={open}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}
            >
                {drawer}
            </Drawer>

            {/* Desktop Drawer (Permanent & Fixed) */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', md: 'block' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: drawerWidth,
                        borderRight: '1px solid #e2e8f0',
                        height: '100vh',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        zIndex: 100 // Ensure it sits below the header if header is z-1100, OR above if sidebar is full height?
                        // User said "Side menu bar till top of the page".
                        // Use zIndex 1200 to be safe/standard.
                    },
                }}
                open
            >
                {drawer}
            </Drawer>
        </Box>
    );
};

export default Sidebar;
