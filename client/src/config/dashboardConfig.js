import {
    Home, Clock, Briefcase, User, MessageSquare, DollarSign,
    Settings, Shield, Users, AlertCircle, Award
} from 'lucide-react';

/**
 * Universal Dashboard Configuration
 * Defines the layout, sidebar, and widgets for each user role automatically.
 */
export const ROLE_CONFIG = {
    user: {
        theme: 'blue',
        routes: [
            { id: 'home', label: 'Overview', icon: Home },
            { id: 'history', label: 'My Bookings', icon: Clock },
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'chat', label: 'Messages', icon: MessageSquare },
            { id: 'finance', label: 'Wallet', icon: DollarSign },
        ],
        defaultTab: 'home',
        widgets: ['UserStats', 'ActiveJobs', 'TechnicianSearch']
    },
    technician: {
        theme: 'emerald',
        routes: [
            { id: 'home', label: 'Dashboard', icon: Home },
            { id: 'jobs', label: 'Job Requests', icon: Briefcase },
            { id: 'history', label: 'Job History', icon: Clock },
            { id: 'profile', label: 'Profile & Skills', icon: User },
            { id: 'chat', label: 'Client Chat', icon: MessageSquare },
            { id: 'finance', label: 'Earnings', icon: DollarSign },
        ],
        defaultTab: 'home',
        widgets: ['TechStats', 'JobQueue', 'EarningsSummary', 'AvailabilityToggle']
    },
    admin: {
        theme: 'purple',
        routes: [
            { id: 'dashboard', label: 'Overview', icon: Home },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'technicians', label: 'Technicians', icon: Wrench },
            { id: 'jobs', label: 'Job Control', icon: Briefcase },
            { id: 'finance', label: 'Finance', icon: DollarSign },
            { id: 'complaints', label: 'Complaint Center', icon: AlertCircle },
            { id: 'offers', label: 'Offers & Promos', icon: Award }, // New
            { id: 'testimonials', label: 'Testimonials', icon: MessageSquare }, // New
        ],
        defaultTab: 'dashboard',
        widgets: ['AdminStats', 'NearbyMap', 'RecentActivity', 'FinancialOverview']
    },
    superadmin: {
        theme: 'red', // Distinct from Admin
        routes: [
            { id: 'dashboard', label: 'Master Control', icon: Shield },
            { id: 'admins', label: 'Admin Management', icon: Users },
            { id: 'system', label: 'System Health', icon: Settings },
            // Inherits Admin routes usually, or defines superset
        ],
        defaultTab: 'dashboard',
        widgets: ['SystemHealth', 'GlobalStats', 'ErrorLogs']
    }
};

// Helper to get config for a user
export const getRoleConfig = (role) => {
    const normRole = role?.toLowerCase() || 'user';
    return ROLE_CONFIG[normRole] || ROLE_CONFIG.user;
};

// Icon Mapper for string identifiers if needed
import { Wrench } from 'lucide-react'; // Import locally to use in object
