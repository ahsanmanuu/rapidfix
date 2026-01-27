import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Complaints = () => {
    const { user } = useAuth();
    const socket = useSocket();

    const [complaints, setComplaints] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [selectedJob, setSelectedJob] = useState('');
    const [category, setCategory] = useState('Quality');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            fetchData();
        }

        const handleStatusUpdate = (updatedComplaint) => {
            setComplaints(prev => prev.map(c => c.id === updatedComplaint.id ? updatedComplaint : c));
        };

        const handleNewComplaint = (newComplaint) => {
            if (newComplaint.userId === user.id) {
                setComplaints(prev => [newComplaint, ...prev]);
            }
        };

        if (socket && user) {
            socket.on('complaint_status_updated', handleStatusUpdate);
            socket.on('new_complaint', handleNewComplaint);
        }

        return () => {
            if (socket) {
                socket.off('complaint_status_updated', handleStatusUpdate);
                socket.off('new_complaint', handleNewComplaint);
            }
        };
    }, [user, socket]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [complaintsRes, jobsRes] = await Promise.all([
                api.get(`/complaints/user/${user.id}`),
                api.get(`/jobs/user/${user.id}`)
            ]);

            if (complaintsRes.data.success) {
                // Sort by latest
                const sorted = complaintsRes.data.complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setComplaints(sorted);
            }
            if (jobsRes.data.success) {
                setJobs(jobsRes.data.jobs);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description) return alert("Please provide a description");

        setSubmitting(true);
        try {
            // Find job details if selected
            const job = jobs.find(j => j.id === selectedJob);
            const techId = job ? job.technicianId : null; // Associate with tech if job selected

            const payload = {
                userId: user.id,
                technicianId: techId, // Optional
                subject: `${category} Issue ${selectedJob ? `(Job #${selectedJob})` : ''}`,
                description: description,
                category: category,
                // evidence: null // pending file upload implementation
            };

            const res = await api.post('/complaints', payload);
            if (res.data.success) {
                // Add to list immediately (optimistic or wait for response)
                setComplaints(prev => [res.data.complaint, ...prev]);
                // Reset form
                setDescription('');
                setSelectedJob('');
                setCategory('Quality');
                alert("Complaint submitted successfully.");
            }
        } catch (error) {
            console.error("Submission error:", error);
            alert("Failed to submit complaint.");
        } finally {
            setSubmitting(false);
        }
    };

    // Helper to format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    const getStatusColor = (status) => {
        switch ((status || '').toLowerCase()) {
            case 'resolved': return 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
            case 'pending': return 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
            case 'investigation': return 'text-amber-700 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    return (
        <div className="font-sans w-full">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
        
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            font-family: 'Material Symbols Outlined';
            font-weight: normal;
            font-style: normal;
            font-size: 24px;
            display: inline-block;
            line-height: 1;
            text-transform: none;
            letter-spacing: normal;
            word-wrap: normal;
            white-space: nowrap;
            direction: ltr;
        }
        body {
            font-family: 'Inter', sans-serif;
        }
      `}</style>

            <div className="max-w-[1280px] mx-auto py-4">
                {/* Page Heading */}
                <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
                    <div className="flex flex-col gap-2">
                        <p className="text-[#111318] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Complaints & Real-time Resolution Center</p>
                        <p className="text-[#636e88] dark:text-gray-400 text-base font-normal leading-normal">Report an issue and track your resolution progress in real-time.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    {/* Left Column: File Complaint Form */}
                    <div className="xl:col-span-7 flex flex-col gap-6 min-w-0 w-full">
                        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] p-6 md:p-8 border border-gray-200 dark:border-gray-800">
                            <h2 className="text-[#111318] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] mb-8 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#3e74ea]">report_problem</span>
                                Report an Issue
                            </h2>
                            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                                {/* Job Selection */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[#111318] dark:text-gray-200 text-sm font-semibold">Select Active/Past Job</label>
                                    <div className="relative">
                                        <select
                                            value={selectedJob}
                                            onChange={(e) => setSelectedJob(e.target.value)}
                                            className="w-full appearance-none rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3.5 text-base text-[#111318] dark:text-white focus:ring-2 focus:ring-[#3e74ea]/20 focus:border-[#3e74ea] transition-all outline-none">
                                            <option value="">General Issue (No specific job)</option>
                                            {jobs.map(job => (
                                                <option key={job.id} value={job.id}>
                                                    {job.serviceType || 'Service'} - #{job.id} ({new Date(job.createdAt).toLocaleDateString()})
                                                </option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">expand_more</span>
                                    </div>
                                </div>

                                {/* Category Selection */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[#111318] dark:text-gray-200 text-sm font-semibold">Issue Category</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {['Quality', 'Professionalism', 'Pricing', 'Delay'].map(cat => (
                                            <label key={cat} className="cursor-pointer">
                                                <input
                                                    className="hidden peer"
                                                    name="category"
                                                    type="radio"
                                                    checked={category === cat}
                                                    onChange={() => setCategory(cat)}
                                                />
                                                <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 peer-checked:border-[#3e74ea] peer-checked:bg-[#3e74ea]/5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all h-full">
                                                    <span className="material-symbols-outlined mb-2 text-gray-600 dark:text-gray-400 peer-checked:text-[#3e74ea]">
                                                        {cat === 'Quality' ? 'verified' : cat === 'Professionalism' ? 'badge' : cat === 'Pricing' ? 'payments' : 'schedule'}
                                                    </span>
                                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{cat}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[#111318] dark:text-gray-200 text-sm font-semibold">Detailed Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-base text-[#111318] dark:text-white focus:ring-2 focus:ring-[#3e74ea]/20 focus:border-[#3e74ea] transition-all outline-none placeholder:text-gray-400"
                                        placeholder="Please describe the issue you encountered..."
                                        rows="5"
                                        required
                                    ></textarea>
                                </div>

                                {/* Submit */}
                                <button disabled={submitting} type="submit" className="mt-4 flex items-center justify-center gap-2 w-full rounded-lg h-12 bg-[#3e74ea] text-white text-sm font-bold tracking-[0.015em] hover:bg-[#3e74ea]/90 hover:shadow-lg transition-all disabled:opacity-50">
                                    {submitting ? 'Submitting...' : 'Submit Complaint'}
                                    <span className="material-symbols-outlined text-[18px]">send</span>
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Live Ticket Status Feed */}
                    <div className="xl:col-span-5 flex flex-col gap-6 min-w-0 w-full xl:sticky xl:top-6 xl:self-start xl:h-[calc(100vh-3rem)]">
                        <div className="flex flex-wrap items-center justify-between px-2 gap-2">
                            <h2 className="text-[#111318] dark:text-white text-xl font-bold leading-relaxed py-1.5 flex items-center gap-3">
                                Live Ticket Feed
                                <span className="flex h-2.5 w-2.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                            </h2>
                        </div>

                        <div className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0 pr-2">
                            {loading && <p>Loading tickets...</p>}
                            {!loading && complaints.length === 0 && <p className="text-gray-500 text-center">No active complaints.</p>}

                            {complaints.map(ticket => (
                                <div key={ticket.id} className="group bg-white dark:bg-gray-900 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] border border-gray-200 dark:border-gray-800 p-5 hover:border-[#3e74ea]/40 transition-all cursor-pointer relative">
                                    <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded">Ticket</span>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">#{ticket.id}</p>
                                            </div>
                                            <h3 className="text-base font-bold text-[#111318] dark:text-white break-words leading-snug py-0.5">{ticket.subject}</h3>
                                        </div>
                                        <span className={`shrink-0 px-3 py-1 text-[11px] font-bold rounded-full border ${getStatusColor(ticket.status)}`}>
                                            {ticket.status || 'Pending'}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 break-words font-medium">{ticket.description}</p>
                                        <div className="mt-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-3">Timeline</p>
                                            {/* Simple Timeline for now - Render last update or Created */}
                                            <div className="flex flex-col gap-4">
                                                <div className="flex gap-3">
                                                    <div className="flex flex-col items-center">
                                                        <div className="size-2.5 rounded-full bg-[#3e74ea] mt-1.5 shadow-[0_0_0_3px_#dbeafe] dark:shadow-[0_0_0_3px_#1e3a8a]"></div>
                                                        <div className="w-[1.5px] h-full bg-gray-100 dark:bg-gray-800 my-1"></div>
                                                    </div>
                                                    <div className="flex flex-col min-w-0 pb-2">
                                                        <p className="text-sm text-[#111318] dark:text-gray-200 font-semibold break-words">Complaint Created</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(ticket.createdAt)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Complaints;
