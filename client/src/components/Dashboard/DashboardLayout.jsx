import { useState, useEffect } from 'react';
import { Box, CssBaseline, useMediaQuery, useTheme, styled } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';


const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('md')]: {
        width: open ? `calc(100% - 260px)` : '100%',
        marginLeft: open ? '260px' : 0,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
}));


const DashboardLayout = ({ user, activeTab, setActiveTab, onLogout, children }) => {
    const theme = useTheme();
    const matchDownMd = useMediaQuery(theme.breakpoints.down('md'));
    // Default to CLOSED initially to prevent mobile flash
    // Default to CLOSED initially to prevent mobile flash
    // We strictly initialize to FALSE.
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Sync sidebar state: Open on Desktop, Close on Mobile
    useEffect(() => {
        if (!matchDownMd) {
            setSidebarOpen(true);
        } else {
            setSidebarOpen(false);
        }
    }, [matchDownMd]);

    const handleDrawerToggle = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            {/* Header */}
            <Box
                position="fixed"
                sx={{
                    width: '100%',
                    zIndex: 1200,
                    backgroundColor: '#fff',
                    transition: 'none',
                    borderBottom: '1px solid #eef2f6'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', height: 80, px: 3 }}>
                    <Header
                        handleDrawerToggle={handleDrawerToggle}
                        onLogout={onLogout}
                        setActiveTab={setActiveTab}
                        user={user}
                    />
                </Box>
            </Box>

            {/* Sidebar */}
            <Sidebar
                open={sidebarOpen}
                handleDrawerToggle={handleDrawerToggle}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={user}
            />

            {/* Main Content */}
            <Main open={sidebarOpen} sx={{ pt: 12, pb: 4, minHeight: '100vh', bgcolor: '#f4f6f8' }}>
                {children}
            </Main>
        </Box>
    );
};

export default DashboardLayout;
