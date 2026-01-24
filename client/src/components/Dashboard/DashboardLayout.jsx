import { useState, useEffect } from 'react';
import { Box, CssBaseline, useMediaQuery, useTheme } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

const drawerWidth = 260;

const DashboardLayout = ({ user, activeTab, setActiveTab, onLogout, children }) => {
    const theme = useTheme();
    const matchUpMd = useMediaQuery(theme.breakpoints.up('md'));
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Auto-open sidebar on desktop
    useEffect(() => {
        setSidebarOpen(matchUpMd);
    }, [matchUpMd]);

    const handleDrawerToggle = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
            <CssBaseline />

            {/* Sidebar (Left Panel) */}
            <Box
                component="nav"
                sx={{
                    width: { md: drawerWidth },
                    flexShrink: { md: 0 }
                }}
            >
                <Sidebar
                    open={sidebarOpen}
                    handleDrawerToggle={handleDrawerToggle}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    user={user}
                />
            </Box>

            {/* Main Content Area (Right Panel) */}
            <Box sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0, // Prevent flex item overflow
                height: '100vh',
                overflow: 'hidden'
            }}>
                {/* Header (Sticky Top) */}
                <Header
                    handleDrawerToggle={handleDrawerToggle}
                    onLogout={onLogout}
                    user={user}
                />

                {/* Dashboard Content (Scrollable) */}
                <Box component="main" sx={{
                    flexGrow: 1,
                    p: { xs: 2, md: 4 },
                    overflowY: 'auto',
                    bgcolor: '#f8fafc'
                }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
};

export default DashboardLayout;
