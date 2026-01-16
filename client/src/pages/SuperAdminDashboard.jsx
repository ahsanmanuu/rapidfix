
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Plus, Users, Map, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import AdminCreationModal from '../components/admin-creation/AdminCreationModal';
import { Header } from '../components/admin/Header'; // Reusing Header
import { Sidebar } from '../components/admin/Sidebar'; // Reusing Sidebar if possible, or Custom
import { StatsCard } from '../components/admin/StatsCard'; // Reusing
import api from '../services/api';

const SuperAdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const handleLogout = () => {
        logout();
        navigate('/superadmin/login');
    };

    const handleAdminCreated = (newAdmin) => {
        alert(`Admin ${newAdmin.name} created successfully!`);
        // Refresh logic here if needed
    };

    return (
        <div className="flex h-screen bg-slate-900 text-white">
            {/* Custom Super Sidebar */}
            <aside className="w-20 lg:w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
                <div className="p-6 flex items-center gap-3 justify-center lg:justify-start">
                    <Shield className="w-8 h-8 text-red-500" />
                    <span className="hidden lg:block font-bold text-xl tracking-wider">SUPER ADMIN</span>
                </div>

                <nav className="flex-1 py-6 space-y-2 px-3">
                    <SidebarItem icon={<LayoutDashboard />} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <SidebarItem icon={<Users />} label="Admins" active={activeTab === 'admins'} onClick={() => setActiveTab('admins')} />
                    <SidebarItem icon={<Map />} label="Global Map" active={activeTab === 'map'} onClick={() => setActiveTab('map')} />
                    <SidebarItem icon={<Settings />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 hover:text-white transition p-2 rounded-lg hover:bg-slate-700 w-full justify-center lg:justify-start">
                        <LogOut size={20} />
                        <span className="hidden lg:block font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-slate-900 p-8">
                {/* Header Section */}
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold">Control Center</h1>
                        <p className="text-slate-400 mt-1">Welcome back, Commander {user?.name}</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-900/40 transition-all hover:scale-105"
                    >
                        <Plus size={20} />
                        Create New Admin
                    </button>
                </header>

                {/* Content Area */}
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {/* Stats Row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <SuperStatCard label="Total Admins" value="12" icon={<Shield />} color="red" />
                                <SuperStatCard label="Active Users" value="2,450" icon={<Users />} color="blue" />
                                <SuperStatCard label="Total Technicians" value="850" icon={<Settings />} color="emerald" />
                            </div>

                            {/* Recent Actions / Placeholders */}
                            <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
                                <h3 className="text-xl font-bold mb-6">System Status</h3>
                                <div className="h-64 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-2xl">
                                    Interactive Global Map Coming Soon
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'admins' && (
                        <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700">
                            <h2 className="text-2xl font-bold mb-6">Regional Admins</h2>
                            <p className="text-slate-400">List of all created admins and their locations will appear here.</p>
                        </div>
                    )}
                </div>
            </main>

            <AdminCreationModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreated={handleAdminCreated}
            />
        </div>
    );
};

const SidebarItem = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${active ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
    >
        <span className="w-6 h-6 flex justify-center items-center">{icon}</span>
        <span className="hidden lg:block font-medium">{label}</span>
    </button>
);

const SuperStatCard = ({ label, value, icon, color }) => (
    <div className={`bg-slate-800 p-6 rounded-2xl border border-slate-700 relative overflow-hidden group hover:border-${color}-500/50 transition-all`}>
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-${color}-500 transform scale-150`}>
            {icon}
        </div>
        <p className="text-slate-400 font-medium uppercase text-xs tracking-wider mb-2">{label}</p>
        <h3 className="text-3xl font-black text-white">{value}</h3>
    </div>
);

export default SuperAdminDashboard;
