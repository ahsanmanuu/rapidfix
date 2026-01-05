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
    AccountBalanceWallet as WalletIcon
} from '@mui/icons-material';

const drawerWidth = 260;

const Sidebar = ({ open, handleDrawerToggle, window, activeTab, setActiveTab, user }) => {
    const theme = useTheme();
    const matchUpMd = useMediaQuery(theme.breakpoints.up('md'));

    const container = window !== undefined ? () => window().document.body : undefined;

    const navItems = [
        { id: 'home', label: 'Dashboard', icon: <HomeIcon /> },
        { id: 'jobs', label: 'Request Services', icon: <WorkIcon /> },
        { id: 'profile', label: 'Profile', icon: <PersonIcon /> },
        { id: 'chat', label: 'Messages', icon: <ChatIcon /> },
        { id: 'finance', label: 'Billing', icon: <WalletIcon /> }
    ];

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                    variant="rounded"
                    sx={{
                        bgcolor: theme.palette.secondary.dark,
                        width: 40,
                        height: 40,
                        boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)'
                    }}
                >
                    F
                </Avatar>
                <Typography variant="h3" color="textPrimary">
                    Fixofy
                </Typography>
            </Box>

            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Box
                    sx={{
                        p: 2,
                        bgcolor: 'background.default',
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        boxShadow: '0 4px 20px 0px rgba(0,0,0,0.05)'
                    }}
                >
                    <Avatar
                        src={user.photo}
                        sx={{ width: 64, height: 64, mb: 1, border: `2px solid ${theme.palette.secondary.main}` }}
                    >
                        {user.name ? user.name[0].toUpperCase() : 'U'}
                    </Avatar>
                    <Typography variant="h4">{user.name}</Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                        Premium Member
                    </Typography>
                </Box>
            </Box>

            <List sx={{ px: 2 }}>
                <Typography variant="caption" sx={{ pl: 2, mb: 1, display: 'block', fontWeight: 600 }}>
                    MENU
                </Typography>
                {navItems.map((item) => (
                    <ListItemButton
                        key={item.id}
                        selected={activeTab === item.id}
                        onClick={() => setActiveTab(item.id)}
                        sx={{
                            mb: 0.5,
                            borderRadius: '12px',
                            '&.Mui-selected': {
                                bgcolor: theme.palette.secondary.light,
                                color: theme.palette.secondary.dark,
                                '&:hover': {
                                    bgcolor: theme.palette.secondary.light,
                                },
                                '& .MuiListItemIcon-root': {
                                    color: theme.palette.secondary.dark,
                                },
                            },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.label} primaryTypographyProps={{ variant: 'body1', fontWeight: activeTab === item.id ? 600 : 400 }} />
                    </ListItemButton>
                ))}
            </List>
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
                        background: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        borderRight: 'none',
                        [theme.breakpoints.up('md')]: {
                            top: '0px'
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
