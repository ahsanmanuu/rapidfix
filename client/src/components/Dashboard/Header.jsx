import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Avatar,
    Box,
    ButtonBase,
    IconButton,
    InputAdornment,
    OutlinedInput,
    useTheme,
    Menu,
    MenuItem,
    ListItemIcon,
    Divider,
    Typography,
    Badge,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
import {
    Menu as MenuIcon,
    Search as SearchIcon,
    NotificationsNone as NotificationsIcon,
    Settings as SettingsIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    AccountBalanceWallet,
    CheckCircle,
    Info,
    Warning
} from '@mui/icons-material';
import axios from '../../services/api'; // Assuming default axios verify later
import { useSocket } from '../../context/SocketContext';

const Header = ({ handleDrawerToggle, onLogout, setActiveTab, user }) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const socket = useSocket();

    // State
    const [anchorElSettings, setAnchorElSettings] = useState(null);
    const [anchorElNotifications, setAnchorElNotifications] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const handleClickSettings = (event) => setAnchorElSettings(event.currentTarget);
    const handleCloseSettings = () => setAnchorElSettings(null);

    const handleClickNotifications = (event) => setAnchorElNotifications(event.currentTarget);
    const handleCloseNotifications = () => setAnchorElNotifications(null);

    // Initial Fetch
    useEffect(() => {
        if (user?.id) fetchNotifications();
    }, [user]);

    // Real-time Listener
    useEffect(() => {
        if (!socket) return;

        socket.on('job_status_updated', (data) => {
            // Optimistically add notification or refetch
            // Since backend persists, we can just fetch or construct local
            const newNotif = {
                id: Date.now(),
                title: `Job ${data.title || 'Update'}`,
                message: `Job status updated to ${data.status}`,
                type: 'job_update',
                read: false,
                createdAt: new Date().toISOString()
            };
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        socket.on('membership_update', (data) => {
            console.log("Header: Membership updated, refetching notifications");
            fetchNotifications();
        });

        return () => {
            socket.off('job_status_updated');
            socket.off('membership_update');
        };
    }, [socket, user?.id]); // Adding user.id as dependency for fetchNotifications availability

    const fetchNotifications = async () => {
        try {
            const res = await axios.get(`/notifications/${user.id}`);
            if (res.data.success) {
                setNotifications(res.data.notifications);
                setUnreadCount(res.data.notifications.filter(n => !n.read).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await axios.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error("Failed to mark read", e);
        }
    };

    const handleProfileClick = () => {
        if (setActiveTab) setActiveTab('profile');
        navigate('/dashboard');
        handleCloseSettings();
    };

    const handleWalletClick = () => {
        navigate('/wallet');
        handleCloseSettings();
    };

    const getIcon = (type) => {
        if (type?.includes('job')) return <CheckCircle color="success" fontSize="small" />;
        if (type === 'payment') return <AccountBalanceWallet color="primary" fontSize="small" />;
        return <Info color="info" fontSize="small" />;
    };

    return (
        <>
            {/* Logo Section / Menu Toggle */}
            <Box
                sx={{
                    width: 228,
                    display: 'flex',
                    [theme.breakpoints.down('md')]: {
                        width: 'auto'
                    }
                }}
            >
                <Box component="span" sx={{ display: { xs: 'none', md: 'block' }, flexGrow: 1 }}>
                    {/* Logo is in Sidebar for Desktop */}
                </Box>
                <ButtonBase
                    sx={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        '&:hover': {
                            backgroundColor: theme.palette.secondary.light
                        }
                    }}
                    onClick={handleDrawerToggle}
                >
                    <Avatar
                        variant="rounded"
                        sx={{
                            ...theme.typography.commonAvatar,
                            ...theme.typography.mediumAvatar,
                            transition: 'all .2s ease-in-out',
                            background: theme.palette.secondary.light,
                            color: theme.palette.secondary.dark,
                            '&:hover': {
                                background: theme.palette.secondary.dark,
                                color: theme.palette.secondary.light
                            }
                        }}
                    >
                        <MenuIcon stroke={1.5} size="1.3rem" />
                    </Avatar>
                </ButtonBase>
            </Box>

            {/* Search Section (Hidden on small, expands on lg) */}
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }}>
                {/* Search Bar - Preserved */}
            </Box>
            <Box sx={{ flexGrow: 1 }} />

            {/* Notification & Settings */}
            <Box sx={{ ml: 2, mr: 3, display: 'flex', alignItems: 'center' }}>
                {/* Notifications */}
                <IconButton
                    color="inherit"
                    onClick={handleClickNotifications}
                    sx={{
                        borderRadius: '12px',
                        ml: 2,
                        '&:hover': { backgroundColor: theme.palette.secondary.light, color: theme.palette.secondary.dark }
                    }}
                >
                    <Badge badgeContent={unreadCount} color="error">
                        <NotificationsIcon stroke={1.5} size="1.3rem" />
                    </Badge>
                </IconButton>
                <Menu
                    anchorEl={anchorElNotifications}
                    open={Boolean(anchorElNotifications)}
                    onClose={handleCloseNotifications}
                    PaperProps={{ sx: { width: 360, borderRadius: 3, mt: 1.5, maxHeight: 400 } }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <Box sx={{ p: 2, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h4">Notifications</Typography>
                        <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }} onClick={() => notifications.forEach(n => handleMarkRead(n.id))}>Mark all read</Typography>
                    </Box>
                    <Divider />
                    <List sx={{ p: 0 }}>
                        {notifications.length === 0 ? (
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <Typography variant="body2" color="textSecondary">No new notifications</Typography>
                            </Box>
                        ) : (
                            notifications.map((notif) => (
                                <MenuItem key={notif.id} onClick={() => handleMarkRead(notif.id)} sx={{
                                    whiteSpace: 'normal',
                                    opacity: notif.read ? 0.6 : 1,
                                    bgcolor: notif.read ? 'transparent' : theme.palette.action.hover
                                }}>
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        {getIcon(notif.type)}
                                    </ListItemIcon>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle2" fontWeight={notif.read ? 400 : 700}>
                                            {notif.title}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {notif.message}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                    </Box>
                                </MenuItem>
                            ))
                        )}
                    </List>
                </Menu>

                {/* Settings */}
                <IconButton
                    color="inherit"
                    onClick={handleClickSettings}
                    sx={{
                        borderRadius: '12px',
                        ml: 2,
                        '&:hover': { backgroundColor: theme.palette.secondary.light, color: theme.palette.secondary.dark }
                    }}
                >
                    <SettingsIcon stroke={1.5} size="1.3rem" />
                </IconButton>
                <Menu
                    anchorEl={anchorElSettings}
                    open={Boolean(anchorElSettings)}
                    onClose={handleCloseSettings}
                    PaperProps={{ sx: { width: 200, borderRadius: 3, mt: 1.5 } }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    <MenuItem onClick={handleProfileClick}>
                        <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                        Account Profile
                    </MenuItem>
                    <MenuItem onClick={handleWalletClick}>
                        <ListItemIcon><AccountBalanceWallet fontSize="small" /></ListItemIcon>
                        Billing & Wallet
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={onLogout || handleCloseSettings}>
                        <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                        Logout
                    </MenuItem>
                </Menu>
            </Box>
        </>
    );
};

export default Header;
