import React, { useState, useEffect } from 'react';
import {
    Box,
    IconButton,
    InputBase,
    Badge,
    Avatar,
    Typography,
    Divider
} from '@mui/material';
import {
    Search as SearchIcon,
    Notifications as NotificationsIcon,
    Menu as MenuIcon
} from '@mui/icons-material';
import { useSocket } from '../../context/SocketContext';
import axios from '../../services/api';

const Header = ({ handleDrawerToggle, user }) => {
    const socket = useSocket();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Basic Notification Logic
    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user?.id) return;
            try {
                const res = await axios.get(`/notifications/${user.id}`);
                if (res.data.success) {
                    setNotifications(res.data.data);
                    setUnreadCount(res.data.data.filter(n => !n.read).length);
                }
            } catch (e) {
                console.error("Failed to fetch notifications", e);
            }
        };

        fetchNotifications();

        if (socket) {
            socket.on('job_status_updated', () => fetchNotifications());
        }
        return () => {
            if (socket) socket.off('job_status_updated');
        };
    }, [user?.id, socket]);


    return (
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
                    aria-label="open drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ mr: 2, display: { md: 'none' }, color: '#64748b' }}
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
                        placeholder="Search services, orders, or help..."
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
                <IconButton sx={{
                    color: '#64748b',
                    bgcolor: 'transparent',
                    '&:hover': { bgcolor: '#f1f5f9' }
                }}>
                    <Badge badgeContent={unreadCount} color="error" variant="dot">
                        <NotificationsIcon />
                    </Badge>
                </IconButton>

                <Divider orientation="vertical" flexItem sx={{ height: 32, alignSelf: 'center', borderColor: '#e2e8f0' }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer' }}>
                    <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                            {user?.name || 'User'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                            {user?.membership || 'Free Member'}
                        </Typography>
                    </Box>
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
