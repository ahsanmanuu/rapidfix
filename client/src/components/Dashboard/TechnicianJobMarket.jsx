import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, Clock, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

const TechnicianJobMarket = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchBids();

        if (socket) {
            socket.on('new_offer_created', (offer) => {
                if (offer.type === 'job_bid' && offer.status === 'open') {
                    setBids(prev => [offer, ...prev]);
                }
            });
            socket.on('offer_accepted', ({ offerId }) => {
                setBids(prev => prev.filter(b => b.id !== offerId));
            });
            socket.on('offer_deleted', ({ id }) => {
                setBids(prev => prev.filter(b => b.id !== id));
            });
        }

        return () => {
            if (socket) {
                socket.off('new_offer_created');
                socket.off('offer_accepted');
                socket.off('offer_deleted');
            }
        };
    }, [socket]);

    const fetchBids = async () => {
        try {
            const res = await api.get('/offers/bids');
            if (res.data.success) {
                setBids(res.data.offers);
            }
        } catch (err) {
            console.error("Failed to fetch bids", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptBid = async (bid) => {
        if (!user) return;
        if (!confirm(`Are you sure you want to accept this job for ₹${bid.price}?`)) return;

        setProcessingId(bid.id);
        try {
            const res = await api.post(`/offers/${bid.id}/accept`, { technicianId: user.id });
            if (res.data.success) {
                // Success animation or toast could trigger here
                alert(`Job Accepted! Job ID: ${res.data.job.id}`);
                // Remove from list immediately (socket will also trigger, but for responsiveness)
                setBids(prev => prev.filter(b => b.id !== bid.id));
            }
        } catch (err) {
            alert("Failed to accept job: " + (err.response?.data?.error || err.message));
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Market...</div>;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <Briefcase className="text-blue-600" />
                        Job Market
                    </h2>
                    <p className="text-slate-500">Pick up open jobs from customers directly.</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold text-sm">
                    {bids.length} Jobs Available
                </div>
            </div>

            {bids.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="text-slate-300" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">No Open Jobs</h3>
                    <p className="text-slate-500">Check back later for new customer bids.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bids.map((bid) => (
                        <div key={bid.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
                            {bid.jobType && (
                                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                                    {bid.jobType}
                                </div>
                            )}

                            <h3 className="font-bold text-lg text-slate-800 mb-2 pr-8">{bid.title}</h3>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-2xl font-black text-slate-900">₹{bid.price}</span>
                                <span className="text-xs text-slate-400 font-medium">Fixed Price</span>
                            </div>

                            <p className="text-sm text-slate-600 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-[60px]">
                                {bid.description || "No description provided."}
                            </p>

                            <div className="flex flex-col gap-3 text-xs text-slate-500 font-medium mb-6">
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-slate-400" />
                                    Posted {new Date(bid.createdAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-slate-400" />
                                    {/* Location is not in offer explicitly usually, showing generic or asking chat */}
                                    View location after acceptance
                                </div>
                            </div>

                            <button
                                onClick={() => handleAcceptBid(bid)}
                                disabled={processingId === bid.id}
                                className={`
                                    w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                                    ${processingId === bid.id
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-slate-900 text-white hover:bg-emerald-600 shadow-xl shadow-slate-200 hover:shadow-emerald-200'
                                    }
                                `}
                            >
                                {processingId === bid.id ? (
                                    'Processing...'
                                ) : (
                                    <>
                                        <CheckCircle size={18} /> Accept Job
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TechnicianJobMarket;
