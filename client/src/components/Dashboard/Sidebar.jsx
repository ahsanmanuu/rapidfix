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
    Chip
} from '@mui/material';
import {
    Home as HomeIcon,
    Work as WorkIcon,
    Person as PersonIcon,
    Chat as ChatIcon,
    AccountBalanceWallet as WalletIcon,
    History as HistoryIcon
} from '@mui/icons-material';

const drawerWidth = 260;

const Sidebar = ({ open, handleDrawerToggle, window, activeTab, setActiveTab, user }) => {
    const theme = useTheme();
    const matchUpMd = useMediaQuery(theme.breakpoints.up('md'));

    const container = window !== undefined ? () => window().document.body : undefined;

    const navItems = [
        { id: 'home', label: 'Dashboard', icon: <HomeIcon /> },
        { id: 'jobs', label: 'Request Services', icon: <WorkIcon /> },
        { id: 'history', label: 'Job History', icon: <HistoryIcon /> },
        { id: 'profile', label: 'Profile', icon: <PersonIcon /> },
        { id: 'chat', label: 'Messages', icon: <ChatIcon /> },
        { id: 'finance', label: 'Billing', icon: <WalletIcon /> }
    ];

    const drawer = (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', // Premium Dark Gradient
            color: '#fff'
        }}>
            {/* Logo Section */}
            <Box sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <Avatar
                    src="/logo.png"
                    variant="rounded"
                    sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'transparent',
                        '& img': { objectFit: 'contain' }
                    }}
                >
                    F
                </Avatar>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#fff', letterSpacing: '0.5px' }}>
                    Fixofy
                </Typography>
            </Box>

            {/* Navigation Items */}
            <List sx={{ px: 2, py: 3, flexGrow: 1 }}>
                <Typography variant="caption" sx={{ pl: 2, mb: 2, display: 'block', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>
                    MENU
                </Typography>
                {navItems.map((item) => (
                    <ListItemButton
                        key={item.id}
                        selected={activeTab === item.id}
                        onClick={() => {
                            setActiveTab(item.id);
                            if (!matchUpMd) handleDrawerToggle();
                        }}
                        sx={{
                            mb: 1,
                            borderRadius: '12px',
                            minHeight: 48,
                            transition: 'all 0.2s',
                            '&.Mui-selected': {
                                bgcolor: 'primary.main',
                                color: '#fff',
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)', // Glow effect
                                '&:hover': {
                                    bgcolor: 'primary.dark',
                                },
                                '& .MuiListItemIcon-root': {
                                    color: '#fff',
                                },
                            },
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.05)',
                                transform: 'translateX(4px)'
                            },
                            '& .MuiListItemIcon-root': {
                                color: activeTab === item.id ? '#fff' : 'rgba(255,255,255,0.5)',
                                minWidth: 40
                            },
                            '& .MuiTypography-root': {
                                fontWeight: activeTab === item.id ? 600 : 500,
                                color: activeTab === item.id ? '#fff' : 'rgba(255,255,255,0.7)'
                            }
                        }}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} />
                    </ListItemButton>
                ))}
            </List>

            {/* User Profile Footer */}
            <Box sx={{ p: 2, mt: 'auto' }}>
                <Box
                    sx={{
                        p: 2,
                        bgcolor: 'rgba(255,255,255,0.05)',
                        borderRadius: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <Avatar
                        src={user.photo}
                        sx={{ width: 44, height: 44, border: '2px solid rgba(255,255,255,0.2)' }}
                    >
                        {user.name ? user.name[0].toUpperCase() : 'U'}
                    </Avatar>
                    <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600 }} noWrap>
                            {user.name}
                        </Typography>
                        <Chip
                            label={user.membership || 'Free'}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.65rem',
                                bgcolor: user.membership === 'Premium' ? '#f59e0b' : 'rgba(255,255,255,0.2)',
                                color: '#fff',
                                mt: 0.5
                            }}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box
            component="nav"
            sx={{ flexShrink: { md: 0 }, width: matchUpMd ? drawerWidth : 'auto' }}
            aria-label="mailbox folders"
        >
            <Drawer
                container={container}
                variant={matchUpMd ? 'persistent' : 'temporary'}
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
