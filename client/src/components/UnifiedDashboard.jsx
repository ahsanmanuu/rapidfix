import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleConfig } from '../config/dashboardConfig';
import DashboardLayout from './Dashboard/DashboardLayout';
import { useSocket } from '../context/SocketContext';
import { useToast } from './ToastSystem';

// Import All Potential Widgets
import DashboardHome from './Dashboard/DashboardHome';
import DashboardJobs from './Dashboard/DashboardJobs';
import DashboardProfile from './Dashboard/DashboardProfile';
import ChatInterface from './Dashboard/ChatInterface';
import DashboardFinance from './Dashboard/DashboardFinance';
import NearbyMap from './admin/NearbyMap';

// Temporary placeholders for missing widgets to prevent crash
const PlaceholderWidget = ({ name }) => (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center h-64">
        <p className="text-slate-500">Widget: {name} (Coming Soon)</p>
    </div>
);

const WIDGET_REGISTRY = {
    'UserStats': DashboardHome, // Reuse existing Home
    'ActiveJobs': DashboardJobs,
    'TechnicianSearch': PlaceholderWidget,

    'TechStats': DashboardHome, // Reuse
    'JobQueue': DashboardJobs,
    'EarningsSummary': DashboardFinance,

    'AdminStats': DashboardHome, // Reuse or specialized
    'NearbyMap': NearbyMap,
    'FinancialOverview': DashboardFinance,

    'SystemHealth': PlaceholderWidget
};

const UnifiedDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const socket = useSocket();
    const { info } = useToast();

    // 1. Load Configuration based on Role
    const roleConfig = getRoleConfig(user?.role);
    const [activeTab, setActiveTab] = useState(roleConfig.defaultTab);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // 2. Redirect if not logged in
    useEffect(() => {
        if (!user) navigate('/login');
    }, [user, navigate]);

    // 3. Render the specific content based on activeTab
    // This maps the 'routes' IDs from config to actual components
    const renderContent = () => {
        switch (activeTab) {
            case 'home':
            case 'dashboard':
                // Render configured widgets for the "Home" view
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {roleConfig.widgets.map(widgetName => {
                                const WidgetComponent = WIDGET_REGISTRY[widgetName] || PlaceholderWidget;
                                return (
                                    <div key={widgetName} className="col-span-1">
                                        {/* Pass generic props, widgets can ignore if not needed */}
                                        <WidgetComponent user={user} name={widgetName} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            case 'jobs':
            case 'history':
                return <DashboardJobs user={user} />;
            case 'profile':
            case 'users': // Admin view of users
                return <DashboardProfile user={user} />;
            case 'chat':
                return <ChatInterface user={user} />;
            case 'finance':
                return <DashboardFinance user={user} />;
            case 'technicians':
                // Special admin route
                return <NearbyMap user={user} />;
            default:
                return <DashboardHome user={user} />;
        }
    };

    if (!user) return null;

    return (
        <DashboardLayout
            user={user}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={logout}
            roleConfig={roleConfig} // Pass config to Layout to render Sidebar dynamically
        >
            <div className="h-full overflow-y-auto p-4 md:p-8">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
                            {activeTab.replace('-', ' ')}
                        </h1>
                        <p className="text-slate-500 text-sm">
                            {user.role === 'admin' ? 'Administration Portal' : `Welcome back, ${user.name}`}
                        </p>
                    </div>
                </header>

                {renderContent()}
            </div>
        </DashboardLayout>
    );
};

export default UnifiedDashboard;
