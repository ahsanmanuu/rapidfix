import React, { useState, useEffect } from 'react';
import {
    Box,
    IconButton,
    InputBase,
    Badge,
    Avatar,
    Typography,
    Divider,
    Menu,
    MenuItem,
    ListItemIcon,
    List,
    ListItem,
    ListItemText
} from '@mui/material';
import {
    Search as SearchIcon,
    Notifications as NotificationsIcon,
    Menu as MenuIcon,
    Person as PersonIcon,
    Settings as SettingsIcon,
    Logout as LogoutIcon,
    CheckCircle,
    Info,
    Warning
} from '@mui/icons-material';
import { useSocket } from '../../context/SocketContext';
import axios from '../../services/api';

const Header = ({ handleDrawerToggle, user, onLogout, setActiveTab }) => {
    const socket = useSocket();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Menu States
    const [anchorElNotifications, setAnchorElNotifications] = useState(null);
    const [anchorElProfile, setAnchorElProfile] = useState(null);

    // Handlers
    const handleNotifClick = (event) => setAnchorElNotifications(event.currentTarget);
    const handleNotifClose = () => setAnchorElNotifications(null);
    const handleProfileClick = (event) => setAnchorElProfile(event.currentTarget);
    const handleProfileClose = () => setAnchorElProfile(null);

    // Notifications Logic
    const fetchNotifications = async () => {
        if (!user?.id) return;
        try {
            const res = await axios.get(`/notifications/${user.id}`);
            if (res.data.success) {
                const data = Array.isArray(res.data.data) ? res.data.data : [];
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            }
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        }
    };

    useEffect(() => {
        fetchNotifications();
        if (socket) {
            socket.on('job_status_updated', () => fetchNotifications());
            socket.on('membership_update', () => fetchNotifications());
        }
        return () => {
            if (socket) {
                socket.off('job_status_updated');
                socket.off('membership_update');
            }
        };
    }, [user?.id, socket]);

    const handleMarkRead = async (id) => {
        try {
            await axios.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <>
            <Box sx={{
                height: 80,
                px: { xs: 2, md: 4 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid #e2e8f0',
                position: 'sticky',
                top: 0,
                zIndex: 1100
            }}>
                {/* Left: Search Bar & Mobile Toggle */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, maxWidth: 500 }}>
                    <IconButton
                        color="inherit"
                        onClick={handleDrawerToggle}
                        sx={{ display: { md: 'none' }, color: '#64748b' }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Box sx={{
                        position: 'relative',
                        width: '100%',
                        display: { xs: 'none', sm: 'block' }
                    }}>
                        <SearchIcon sx={{
                            position: 'absolute',
                            left: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#94a3b8'
                        }} />
                        <InputBase
                            placeholder="Search services, invoices, or help..."
                            sx={{
                                width: '100%',
                                bgcolor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                pl: 5,
                                pr: 2,
                                py: 1,
                                fontSize: '0.9rem',
                                transition: 'all 0.2s',
                                '&.Mui-focused': {
                                    boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.2)',
                                    borderColor: '#2563eb'
                                }
                            }}
                        />
                    </Box>
                </Box>

                {/* Right: Actions & Profile */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <IconButton
                        onClick={handleNotifClick}
                        sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}
                    >
                        <Badge badgeContent={unreadCount} color="error" variant="dot">
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>

                    <Divider orientation="vertical" flexItem sx={{ height: 32, alignSelf: 'center', borderColor: '#e2e8f0' }} />

                    <Box
                        onClick={handleProfileClick}
                        sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}
                    >
                        <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                                {user?.name || 'User'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                                {user?.membership || 'Free Member'}
                            </Typography>
                        </Box>
                        <Avatar
                            src={user?.photo}
                            sx={{
                                width: 40,
                                height: 40,
                                border: '2px solid #f1f5f9',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}
                        />
                    </Box>
                </Box>
            </Box>

            {/* Notifications Menu */}
            <Menu
                anchorEl={anchorElNotifications}
                open={Boolean(anchorElNotifications)}
                onClose={handleNotifClose}
                PaperProps={{
                    sx: { width: 320, maxHeight: 400, borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography variant="subtitle2" fontWeight="bold">Notifications</Typography>
                </Box>
                <List sx={{ p: 0 }}>
                    {notifications.length === 0 ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <NotificationsIcon sx={{ color: '#cbd5e1', fontSize: 40, mb: 1 }} />
                            <Typography variant="body2" color="text.secondary">No new notifications</Typography>
                        </Box>
                    ) : (
                        notifications.map((n) => (
                            <ListItem
                                key={n.id}
                                button
                                onClick={() => handleMarkRead(n.id)}
                                sx={{ bgcolor: n.read ? 'transparent' : '#f8fafc' }}
                            >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    {n.type === 'warning' ? <Warning color="warning" fontSize="small" /> : <Info color="primary" fontSize="small" />}
                                </ListItemIcon>
                                <ListItemText
                                    primary={n.title}
                                    secondary={n.message}
                                    primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: n.read ? 400 : 600 }}
                                    secondaryTypographyProps={{ fontSize: '0.8rem', noWrap: true }}
                                />
                            </ListItem>
                        ))
                    )}
                </List>
            </Menu>

            {/* Profile Menu */}
            <Menu
                anchorEl={anchorElProfile}
                open={Boolean(anchorElProfile)}
                onClose={handleProfileClose}
                PaperProps={{
                    sx: { width: 200, borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={() => { setActiveTab('profile'); handleProfileClose(); }}>
                    <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                    My Profile
                </MenuItem>
                <MenuItem onClick={handleProfileClose}>
                    <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                    Settings
                </MenuItem>
                <Divider sx={{ my: 1 }} />
                <MenuItem onClick={() => { if (onLogout) onLogout(); handleProfileClose(); }} sx={{ color: '#ef4444' }}>
                    <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#ef4444' }} /></ListItemIcon>
                    Logout
                </MenuItem>
            </Menu>
        </>
    );
};

export default Header;
