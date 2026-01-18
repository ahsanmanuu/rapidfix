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
    LocalOffer as OfferIcon
} from '@mui/icons-material';

const drawerWidth = 260;

const Sidebar = ({ open, handleDrawerToggle, window, activeTab, setActiveTab, user }) => {
    const theme = useTheme();
    const matchUpMd = useMediaQuery(theme.breakpoints.up('md'));

    const container = window !== undefined ? () => window().document.body : undefined;

    const navItems = [
        { id: 'home', label: 'Dashboard', icon: <HomeIcon /> },
        { id: 'history', label: 'Job History', icon: <HistoryIcon /> },
        { id: 'jobs', label: 'Services', icon: <WorkIcon /> },
        { id: 'chat', label: 'Live Chat', icon: <ChatIcon /> },
        { id: 'complaints', label: 'Complaints', icon: <ReportIcon /> },
        { id: 'offers', label: 'Latest Offers', icon: <OfferIcon /> },
        { id: 'profile', label: 'Settings', icon: <PersonIcon /> }, // Mapped 'Profile' to 'Settings'
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
                <Box sx={{
                    width: 40, height: 40,
                    bgcolor: '#2563eb', // Primary Blue
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)'
                }}>
                    <HomeIcon sx={{ color: '#fff' }} />
                </Box>
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
            {/* Mobile Drawer */}
            <Drawer
                container={container}
                anchor="left"
                open={open}
                onClose={handleDrawerToggle}
                sx={{
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        borderRight: 'none',
                        background: 'transparent', // Let the gradient box handle bg
                        [theme.breakpoints.up('md')]: {
                            top: '80px',
                            height: 'calc(100vh - 80px)'
                        }
                    }
                }}
                ModalProps={{ keepMounted: true }}
                color="inherit"
            >
                {drawer}
            </Drawer>
        </Box>
    );
};

export default Sidebar;
