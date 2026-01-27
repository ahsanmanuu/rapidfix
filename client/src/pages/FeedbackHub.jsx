import React, { useState } from 'react';
import TechnicianLayout from '../components/TechnicianLayout';

// Custom Icons as simple SVGs to match reference precisely
const MaterialIcon = ({ name, className = "" }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const FeedbackHub = () => {
    // State for interactive elements
    const [communicationRating, setCommunicationRating] = useState(8.5);
    const [safetyRating, setSafetyRating] = useState(7);
    const [clarityRating, setClarityRating] = useState(9); // Excellent

    const headerActions = (
        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            <MaterialIcon name="file_download" className="text-[16px]" />
            <span className="hidden sm:inline">Export Report</span>
        </button>
    );

    return (
        <TechnicianLayout title="Feedback Hub" headerActions={headerActions}>
            <div className="space-y-4 font-sans text-slate-900">

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Avg Rating Card */}
                    <div className="bg-white border border-slate-200 p-3 rounded shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="flex justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avg Rating</span>
                            <MaterialIcon name="star_rate" className="text-amber-500" />
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-2xl font-black text-slate-800">4.92</p>
                            <span className="text-[10px] text-emerald-600 font-bold">▲ 0.2%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                            <div className="bg-amber-500 h-full w-[98%]"></div>
                        </div>
                    </div>

                    {/* Reviews Card */}
                    <div className="bg-white border border-slate-200 p-3 rounded shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="flex justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reviews</span>
                            <MaterialIcon name="chat_bubble" className="text-indigo-500" />
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-2xl font-black text-slate-800">1,240</p>
                            <span className="text-[10px] text-emerald-600 font-bold">+15 new</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 italic">88% Response Rate</p>
                    </div>

                    {/* Sentiment Card */}
                    <div className="bg-white border border-slate-200 p-3 rounded shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                        <div className="flex justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sentiment</span>
                            <MaterialIcon name="mood" className="text-emerald-500" />
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-2xl font-black text-slate-800">94%</p>
                            <span className="text-[10px] text-slate-400">Positive AI</span>
                        </div>
                        <div className="flex gap-1 mt-2">
                            <div className="flex-1 h-1 bg-emerald-500 rounded-full"></div>
                            <div className="flex-1 h-1 bg-emerald-500 rounded-full"></div>
                            <div className="flex-1 h-1 bg-slate-100 rounded-full"></div>
                        </div>
                    </div>

                    {/* AI Performance Card */}
                    <div className="bg-indigo-600 text-white p-3 rounded shadow-md flex flex-col hover:shadow-lg transition-all">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <MaterialIcon name="auto_awesome" className="text-[18px]" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">AI Performance Insights</span>
                        </div>
                        <p className="text-xs leading-relaxed opacity-90">
                            "Technicians with your profile increase ratings by <span className="font-bold underline">15%</span> when following up after 24h."
                        </p>
                        <div className="mt-auto pt-2">
                            <button className="text-[10px] font-bold flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded hover:bg-white/30 transition-colors">
                                View Recommendations
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Split: Reviews Feed & Review Form */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left Column: Reviews Feed */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden flex flex-col">
                            <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h2 className="text-xs font-black uppercase text-slate-600 tracking-tighter">Verified Reviews Feed</h2>
                                <div className="flex gap-1">
                                    <button className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-600 text-white">All</button>
                                    <button className="text-[10px] font-bold px-2 py-0.5 rounded text-slate-500 hover:bg-slate-100 transition-colors">Negative</button>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-100 text-left">
                                {/* Review 1 */}
                                <div className="p-3 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold">JS</div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">James Smith <span className="text-[10px] font-normal text-slate-400 ml-1">Panel Upgrade • Oct 24</span></p>
                                                <div className="flex text-amber-500 scale-75 origin-left -mt-0.5">
                                                    {[...Array(5)].map((_, i) => <MaterialIcon key={i} name="star" className="!text-[18px]" />)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-emerald-50 px-2 py-0.5 rounded-full flex items-center border border-emerald-100">
                                            <MaterialIcon name="check_circle" className="text-[12px] text-emerald-600 mr-1" />
                                            <span className="text-[9px] font-black text-emerald-700 uppercase">Top Tier</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-normal mb-3">"Mark was extremely professional and completed the panel upgrade ahead of schedule. Very clean workspace."</p>
                                    <div className="flex gap-4 pt-2 border-t border-slate-50">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase font-bold text-slate-400">Repeat Likelihood</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 w-[95%]"></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-emerald-600">95%</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase font-bold text-slate-400">Hist. Tip Avg</span>
                                            <span className="text-[10px] font-bold text-slate-700">$25.50</span>
                                        </div>
                                        <button className="ml-auto text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                            <MaterialIcon name="reply" className="text-[14px]" /> Respond
                                        </button>
                                    </div>
                                </div>
                                {/* Review 2 */}
                                <div className="p-3 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold">LH</div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">Linda Harrison <span className="text-[10px] font-normal text-slate-400 ml-1">EV Charger • Oct 22</span></p>
                                                <div className="flex text-amber-500 scale-75 origin-left -mt-0.5">
                                                    {[...Array(5)].map((_, i) => <MaterialIcon key={i} name="star" className="!text-[18px]" />)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-100 px-2 py-0.5 rounded-full flex items-center border border-slate-200">
                                            <span className="text-[9px] font-black text-slate-600 uppercase">Standard</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-normal mb-3">"Service was fine, but pricing was a bit higher than the estimate. Professional behavior overall."</p>
                                    <div className="flex gap-4 pt-2 border-t border-slate-50">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase font-bold text-slate-400">Repeat Likelihood</span>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-amber-400 w-[60%]"></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-amber-600">60%</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase font-bold text-slate-400">Hist. Tip Avg</span>
                                            <span className="text-[10px] font-bold text-slate-700">$5.00</span>
                                        </div>
                                        <button className="ml-auto text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                            <MaterialIcon name="reply" className="!text-[14px]" /> Respond
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-2 border-t border-slate-100 text-center">
                                <button className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-widest">Load History (254)</button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Review Form & Career Tier */}
                    <div className="lg:col-span-5 space-y-4">
                        {/* Technical Review Form */}
                        <div className="bg-white border border-indigo-200 rounded shadow-sm overflow-hidden ring-1 ring-indigo-50">
                            <div className="p-3 border-b border-indigo-100 flex items-center justify-between bg-indigo-50/30">
                                <div className="flex items-center gap-2">
                                    <MaterialIcon name="how_to_reg" className="text-indigo-600" />
                                    <h2 className="text-xs font-black uppercase text-indigo-900 tracking-tight">Technical Review & Rating</h2>
                                </div>
                                <span className="text-[9px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">ID: #88219</span>
                            </div>
                            <div className="p-4 flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter text-left">Current Job Reference</label>
                                    <select className="text-xs rounded border border-slate-200 bg-slate-50 p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium">
                                        <option>Linda Harrison - 204 Oak St (In Progress)</option>
                                        <option>Robert King - 55 Pine Rd (Review Required)</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 gap-3.5">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-bold text-slate-700 uppercase">Communication</label>
                                            <span className="text-[10px] font-black text-indigo-600">{communicationRating} / 10</span>
                                        </div>
                                        <input
                                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            max="10" min="0" step="0.5" type="range"
                                            value={communicationRating}
                                            onChange={(e) => setCommunicationRating(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-bold text-slate-700 uppercase">Payment Reliability</label>
                                            <span className="text-[10px] font-black text-indigo-600">Auto-Verified</span>
                                        </div>
                                        <div className="flex gap-1">
                                            {[...Array(5)].map((_, i) => <div key={i} className="h-1 flex-1 bg-indigo-600 rounded"></div>)}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-bold text-slate-700 uppercase">Site Safety & Environment</label>
                                            <span className="text-[10px] font-black text-indigo-600">High Risk</span>
                                        </div>
                                        <input
                                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                            max="10" min="0" type="range"
                                            value={safetyRating}
                                            onChange={(e) => setSafetyRating(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] font-bold text-slate-700 uppercase">Clarity of Instructions</label>
                                            <span className="text-[10px] font-black text-indigo-600">Excellent</span>
                                        </div>
                                        <input
                                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                            max="10" min="0" type="range"
                                            value={clarityRating}
                                            onChange={(e) => setClarityRating(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded border border-slate-100 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-800 uppercase">Technical Self-Assessment</label>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button className="text-[9px] font-bold py-1 px-2 rounded border border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-1 justify-center transition-colors shadow-sm" type="button">
                                            <MaterialIcon name="hardware" className="text-[12px]" /> Parts Shortage
                                        </button>
                                        <button className="text-[9px] font-bold py-1 px-2 rounded border border-indigo-200 bg-indigo-50 text-indigo-700 flex items-center gap-1 justify-center transition-colors shadow-sm" type="button">
                                            <MaterialIcon name="bolt" className="text-[12px]" /> Complex Wiring
                                        </button>
                                    </div>
                                    <textarea className="w-full text-xs rounded border border-slate-200 p-2 h-16 focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-slate-400" placeholder="Describe any technical blockers or environment challenges..."></textarea>
                                </div>
                                <button className="w-full bg-indigo-600 text-white font-bold text-[11px] py-2.5 rounded hover:bg-indigo-700 transition-colors uppercase tracking-widest shadow-sm">
                                    Submit Final Professional Report
                                </button>
                            </div>
                        </div>

                        {/* Career Tier Card */}
                        <div className="bg-white border border-slate-200 rounded p-3 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Next Career Tier</span>
                                <span className="text-xs font-black text-indigo-600">85% Complete</span>
                            </div>
                            <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                                <div className="absolute h-full bg-indigo-600 w-[85%]"></div>
                                <div className="absolute h-full bg-emerald-400 w-[10%] left-[85%] opacity-40"></div>
                            </div>
                            <div className="flex items-start gap-2 bg-emerald-50 p-2 rounded">
                                <MaterialIcon name="verified" className="text-emerald-600 text-[18px]" />
                                <p className="text-[10px] text-emerald-800 leading-tight text-left">
                                    <span className="font-bold">Elite Status Reward:</span> 12 more positive reviews unlocks Featured Placement.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TechnicianLayout>
    );
};

export default FeedbackHub;
