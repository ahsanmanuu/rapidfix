
import React, { useState, useEffect } from 'react';
import { LifeBuoy, CheckCircle, Clock } from 'lucide-react';
import api from '../../../services/api';
import { useSocket } from '../../../context/SocketContext';

const SupportView = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const socket = useSocket();

    const fetchComplaints = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/complaints');
            setComplaints(res.data.complaints || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComplaints();

        if (socket) {
            socket.on('new_complaint', fetchComplaints);
            socket.on('complaint_status_change', fetchComplaints);
            return () => {
                socket.off('new_complaint', fetchComplaints);
                socket.off('complaint_status_change', fetchComplaints);
            };
        }
    }, [socket]);

    const handleResolve = async (id) => {
        // Placeholder for update
        alert("Marking as resolved... (Backend endpoint pending for update)");
    };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 flex items-center gap-3">
                <LifeBuoy className="text-rose-500" /> Support & Complaints
            </h2>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading tickets...</div>
                ) : complaints.length === 0 ? (
                    <div className="p-12 text-center">
                        <LifeBuoy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No active support tickets</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {complaints.map(c => (
                            <div key={c.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {c.status || 'Pending'}
                                        </span>
                                        <span className="text-xs text-slate-400">#{c.id.slice(0, 8)}</span>
                                    </div>
                                    <p className="font-bold text-slate-800 dark:text-white mb-1">{c.subject || 'Support Request'}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">{c.description}</p>
                                    <p className="text-xs text-slate-400 mt-2">From User: {c.userId}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400 mr-2">{new Date(c.createdAt || Date.now()).toLocaleDateString()}</span>
                                    {c.status !== 'Resolved' && (
                                        <button
                                            onClick={() => handleResolve(c.id)}
                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                            title="Mark as Resolved"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportView;
