import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            // In a real app, check if role === 'admin'
            setUser(parsedUser);
        }
    }, [navigate]);

    if (!user) return null;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="glass-panel p-8 rounded-2xl mb-8 border-l-4 border-purple-500">
                <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                <p className="text-gray-400">System Overview</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard title="Total Users" value="1,234" change="+12%" color="blue" />
                <StatsCard title="Technicians" value="56" change="+3%" color="green" />
                <StatsCard title="Active Jobs" value="23" change="-5%" color="yellow" />
                <StatsCard title="Complaint" value="5" change="0%" color="red" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-xl font-bold mb-6">Recent Users</h3>
                    <div className="space-y-4">
                        <UserRow name="Alice Johnson" email="alice@example.com" role="User" status="Active" />
                        <UserRow name="Bob Builder" email="bob@fixofy.com" role="Technician" status="Verified" />
                        <UserRow name="Charlie Brown" email="charlie@example.com" role="User" status="Active" />
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-xl">
                    <h3 className="text-xl font-bold mb-6">Recent Complaints</h3>
                    <div className="space-y-4">
                        <ComplaintRow id="#C-102" subject="Technician Late" status="Open" />
                        <ComplaintRow id="#C-101" subject="Service Quality" status="Resolved" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatsCard = ({ title, value, change, color }) => {
    const colors = {
        blue: "text-blue-400",
        green: "text-green-400",
        yellow: "text-yellow-400",
        red: "text-red-400"
    };

    return (
        <div className="glass-panel p-6 rounded-xl">
            <h4 className="text-gray-400 text-sm mb-1">{title}</h4>
            <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-white">{value}</span>
                <span className={`text-sm ${colors[color]}`}>{change}</span>
            </div>
        </div>
    );
};

const UserRow = ({ name, email, role, status }) => (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
        <div>
            <div className="font-semibold text-white">{name}</div>
            <div className="text-xs text-gray-500">{email}</div>
        </div>
        <div className="text-right">
            <div className="text-sm text-gray-300">{role}</div>
            <div className="text-xs text-green-400">{status}</div>
        </div>
    </div>
);

const ComplaintRow = ({ id, subject, status }) => {
    const statusColor = status === 'Open' ? 'text-red-400' : 'text-green-400';
    return (
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
            <div>
                <div className="font-semibold text-white">{id}</div>
                <div className="text-sm text-gray-400">{subject}</div>
            </div>
            <div className={`text-sm font-bold ${statusColor}`}>{status}</div>
        </div>
    );
};

export default AdminDashboard;
