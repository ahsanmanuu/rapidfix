import React from 'react';
import { CompactStatCard } from '../CompactStatCard';

const TechnicianStats = ({ technicians }) => {
    const total = technicians.length;
    const active = technicians.filter(t => t.status === 'Active' || t.status === 'Available').length;
    const pending = technicians.filter(t => t.status === 'Pending' || t.status === 'Verification Pending').length;
    // Assume suspended/banned logic roughly
    const blacklisted = technicians.filter(t => t.status === 'Banned' || t.status === 'Suspended').length;
    const verified = technicians.filter(t => t.status === 'Approved' || t.status === 'Verified').length;

    // Calculare trends or ratios (mock logic for now or simple stats)
    const verificationRate = total > 0 ? Math.round((verified / total) * 100) : 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <CompactStatCard
                stat={{
                    label: 'Total Technicians',
                    value: total,
                    icon: 'engineering',
                    color: 'blue'
                }}
            />
            <CompactStatCard
                stat={{
                    label: 'Active & Available',
                    value: active,
                    icon: 'wifi',
                    color: 'emerald'
                }}
            />
            <CompactStatCard
                stat={{
                    label: 'Pending Verification',
                    value: pending,
                    icon: 'verified_user',
                    color: 'orange'
                }}
            />
            <CompactStatCard
                stat={{
                    label: 'Blacklisted',
                    value: blacklisted,
                    icon: 'block',
                    color: 'red',
                    alert: blacklisted > 0 ? 'Action Required' : null
                }}
            />
        </div>
    );
};

export default TechnicianStats;
