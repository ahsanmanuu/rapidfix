import React from 'react';
import TechnicianLayout from '../components/TechnicianLayout';

// Helper for Material Symbols (matching the reference styling)
const MaterialIcon = ({ name, className = "", style = {} }) => (
    <span className={`material-symbols-outlined ${className}`} style={style}>{name}</span>
);

const TechnicianChat = () => {
    // Header Actions from the reference design
    const headerActions = (
        <div className="flex items-center gap-3">
            {/* The reference had "Tech: Jordan Smith" and status in header, but TechnicianLayout handles user profile. 
                 We will add the 'End All Sessions' button here. */}
            <button className="bg-[#135bec] text-white text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                End All Sessions
            </button>
            {/* We could add the avatar from the reference header here if needed, but Layout has one. 
                The reference showed a specific tech avatar. I'll stick to the button to avoid duplication. */}
        </div>
    );

    return (
        <TechnicianLayout title="Triple-Channel Chat Hub" headerActions={headerActions}>
            {/* Main Chat Content - Matching the <main> tag from reference */}
            <div className="flex-1 flex overflow-hidden p-3 gap-3 h-full bg-[#f6f6f8] font-sans">

                {/* Column 1: Customer Chat */}
                <section className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <header className="bg-[#10b981] text-white px-4 py-2.5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="size-8 rounded-full bg-cover border border-white/20" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBqLjknw1yQ_xxdFBB4F1vkVtweYl1je9poQHY72ji975TPN9G7kX2qPNpphoSRTXJmHLSaiSbVyFViW_L1c0Y1aqtElRv0F8Ior0cykZ_XUszR8LQjJy1mPgYuCAvmkChTdMcGqShV5-eIMupdgLP0S-6auxlMvHE5Ag2VwnEJNs0pezYcW3i1X6bycD76y61FcUHym--F3PPFCXxSaGgiB-nk53IWz7VNdsY2SfnQtDOCXaKt8NWXr5w9d7GE4DUXvy3pV62OAZk")' }}></div>
                            <div>
                                <h3 className="text-sm font-bold leading-tight">Sarah Jenkins</h3>
                                <p className="text-[10px] opacity-90 font-medium">Customer • Job #4412</p>
                            </div>
                        </div>
                        <button className="hover:bg-black/10 rounded p-1 transition-colors">
                            <MaterialIcon name="more_vert" className="text-sm" />
                        </button>
                    </header>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-[#f9fafb]">
                        <div className="flex justify-center"><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Live Feed</span></div>

                        {/* Incoming Message */}
                        <div className="flex gap-2 max-w-[85%]">
                            <div className="bg-white p-2.5 shadow-sm border border-gray-100 text-xs text-gray-800" style={{ borderRadius: '2px 12px 12px 12px' }}>
                                The kitchen faucet is still leaking from the base.
                            </div>
                        </div>

                        {/* Outgoing Message */}
                        <div className="flex gap-2 max-w-[85%] self-end flex-row-reverse">
                            <div className="bg-[#135bec] p-2.5 shadow-sm text-xs text-white" style={{ borderRadius: '12px 2px 12px 12px' }}>
                                I'm on my way. Can you send a photo?
                            </div>
                        </div>

                        {/* Incoming Image */}
                        <div className="flex gap-2 max-w-[85%]">
                            <div className="bg-white p-1.5 shadow-sm border border-gray-100" style={{ borderRadius: '2px 12px 12px 12px' }}>
                                <img className="rounded-lg w-full h-32 object-cover mb-1" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcwVJ0Shc4YYOWRX5PVKKlK_yIcYm13pxeJkGm5il3kSRnXHjJzS4sZW14kLQI5EqSaqcxpPe0FPd10rykm8hSsR5Rh0HEQ7RJlCf_Fwt-e2Sd14jI8mK70OsKgOJUNQLQdjvmBUwxPcoDGNQlA1heDcnd3fhhvyCiMHy-wdpWwwpVJWo3__AJQdr81EkjE7kvRUObdUKtgccJpJOAUyd4wuik5-7iy5cimRhPNDGixiI7-MbH4ZKOfOM9zoFxjEYQWdz7Kj2T6vo" alt="faucet" />
                                <p className="text-[11px] text-gray-600 px-1">Here is the view from the side.</p>
                            </div>
                        </div>
                    </div>

                    {/* Input Area */}
                    <footer className="p-2 border-t border-gray-100 bg-white">
                        <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1.5 border border-gray-200">
                            <textarea className="flex-1 bg-transparent border-none focus:ring-0 text-xs py-1 resize-none h-8 placeholder:text-gray-400 outline-none" placeholder="Type to Sarah..."></textarea>
                            <div className="flex items-center gap-0.5">
                                <button className="p-1 hover:text-[#135bec] text-gray-400 transition-colors"><MaterialIcon name="mic" /></button>
                                <button className="p-1 hover:text-[#135bec] text-gray-400 transition-colors"><MaterialIcon name="photo_camera" /></button>
                                <button className="p-1 hover:text-[#135bec] text-gray-400 transition-colors"><MaterialIcon name="attach_file" /></button>
                                <button className="p-1 text-[#135bec] hover:opacity-80 transition-opacity"><MaterialIcon name="send" style={{ fontVariationSettings: "'FILL' 1" }} /></button>
                            </div>
                        </div>
                    </footer>
                </section>

                {/* Column 2: Internal Comms */}
                <section className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <header className="bg-[#f59e0b] text-white px-4 py-2.5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="size-8 rounded-full bg-cover border border-white/20" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDdkirWXjIgtZ3_N0uVn7QM5WW2xJzH0sTljAdQGYBGaahx11napx1qosoadFK0qNSt353oqj_wfFJ2j6dYpdYGChkK8_gQbTA2hz5hOsGYnHi-UHb3rP6iCr8pFMg8Lasc1XMBbbD62jTSDSGhHslNcEjWm68GAg8F7qUbGz0EoT-3QVKBloif0S_DyN59uDAYm_nr0fT7jo_dg1u98UPe1Q4RR70qty3bD3qFQFbCaD4ybfD08l-3_CkhHIE71MGTjlXlSUd3fXE")' }}></div>
                            <div>
                                <h3 className="text-sm font-bold leading-tight">David Chen</h3>
                                <p className="text-[10px] opacity-90 font-medium">Area Admin • North Sector</p>
                            </div>
                        </div>
                        <button className="hover:bg-black/10 rounded p-1 transition-colors">
                            <MaterialIcon name="more_vert" className="text-sm" />
                        </button>
                    </header>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-[#f9fafb]">
                        <div className="flex justify-center"><span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Internal Comms</span></div>

                        <div className="flex gap-2 max-w-[85%] self-end flex-row-reverse">
                            <div className="bg-[#135bec] p-2.5 shadow-sm text-xs text-white" style={{ borderRadius: '12px 2px 12px 12px' }}>
                                Need approval for part #XJ-99.
                            </div>
                        </div>

                        <div className="flex gap-2 max-w-[85%]">
                            <div className="bg-white p-2.5 shadow-sm border border-gray-100 text-xs text-gray-800" style={{ borderRadius: '2px 12px 12px 12px' }}>
                                Approved. It's available at the central warehouse.
                            </div>
                        </div>

                        <div className="flex gap-2 max-w-[85%]">
                            <div className="bg-white p-2.5 shadow-sm border border-gray-100 text-xs text-gray-800" style={{ borderRadius: '2px 12px 12px 12px' }}>
                                <div className="flex items-center gap-2 p-1.5 bg-gray-50 rounded border border-dashed border-gray-200">
                                    <MaterialIcon name="description" className="text-orange-500" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold truncate">APPROVAL_882.pdf</p>
                                        <p className="text-[9px] text-gray-500">2.4 MB</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <footer className="p-2 border-t border-gray-100 bg-white">
                        <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1.5 border border-gray-200">
                            <textarea className="flex-1 bg-transparent border-none focus:ring-0 text-xs py-1 resize-none h-8 placeholder:text-gray-400 outline-none" placeholder="Message David..."></textarea>
                            <div className="flex items-center gap-0.5">
                                <button className="p-1 hover:text-[#135bec] text-gray-400 transition-colors"><MaterialIcon name="mic" /></button>
                                <button className="p-1 hover:text-[#135bec] text-gray-400 transition-colors"><MaterialIcon name="photo_camera" /></button>
                                <button className="p-1 hover:text-[#135bec] text-gray-400 transition-colors"><MaterialIcon name="attach_file" /></button>
                                <button className="p-1 text-[#135bec] hover:opacity-80 transition-opacity"><MaterialIcon name="send" style={{ fontVariationSettings: "'FILL' 1" }} /></button>
                            </div>
                        </div>
                    </footer>
                </section>

                {/* Column 3: Super Admin Alerts */}
                <section className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <header className="bg-[#ef4444] text-white px-4 py-2.5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="size-8 rounded-full bg-cover border border-white/20" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDUwYOik8yS0iNPMxFUJn4_xLcLR1FFBIGIe-5CiCBMK6WRBt81D6MINO0d3A8L8O56Y3frxUncQEUN71Z5nnWohVysvuWNnpCOma3FjjwiZ4MkA_kt51c12qFEtwbhVRwZ1deuGXwFAXhifEARqYutbBQDtQZUx_JjXZf8ZFy-e_g6NoS9bVCiEETCbPV2gHSNbkQ8bVN2pJPLZ9sQfA7qWAqk293yM1B7M1yTUrRdDaViANmE0wScmPAIe0thdyQVap52TjoZLs8")' }}></div>
                            <div>
                                <h3 className="text-sm font-bold leading-tight">Admin Operations</h3>
                                <p className="text-[10px] opacity-90 font-medium">Super Admin • Priority Support</p>
                            </div>
                        </div>
                        <button className="hover:bg-black/10 rounded p-1 transition-colors">
                            <MaterialIcon name="more_vert" className="text-sm" />
                        </button>
                    </header>
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-[#f9fafb]">
                        <div className="flex justify-center"><span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">System Alerts</span></div>

                        <div className="flex gap-2 max-w-[85%]">
                            <div className="bg-red-50 p-2.5 shadow-sm border border-red-100 text-xs text-red-800" style={{ borderRadius: '2px 12px 12px 12px' }}>
                                <span className="font-bold">System Maintenance:</span> The technician portal will be offline for 15 mins at 12:00 PM.
                            </div>
                        </div>

                        <div className="flex gap-2 max-w-[85%] self-end flex-row-reverse">
                            <div className="bg-[#135bec] p-2.5 shadow-sm text-xs text-white" style={{ borderRadius: '12px 2px 12px 12px' }}>
                                Understood. Will sync logs before then.
                            </div>
                        </div>

                        <div className="flex gap-2 max-w-[85%]">
                            <div className="bg-white p-2.5 shadow-sm border border-gray-100 text-xs text-gray-800" style={{ borderRadius: '2px 12px 12px 12px' }}>
                                Confirmed. Thank you for the update.
                            </div>
                        </div>
                    </div>
                    <footer className="p-2 border-t border-gray-100 bg-white">
                        <div className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1.5 border border-gray-200">
                            <textarea className="flex-1 bg-transparent border-none focus:ring-0 text-xs py-1 resize-none h-8 placeholder:text-gray-400 outline-none" placeholder="Direct to Admin..."></textarea>
                            <div className="flex items-center gap-0.5">
                                <button className="p-1 hover:text-[#135bec] text-gray-400 transition-colors"><MaterialIcon name="mic" /></button>
                                <button className="p-1 hover:text-[#135bec] text-gray-400 transition-colors"><MaterialIcon name="photo_camera" /></button>
                                <button className="p-1 hover:text-[#135bec] text-gray-400 transition-colors"><MaterialIcon name="attach_file" /></button>
                                <button className="p-1 text-[#135bec] hover:opacity-80 transition-opacity"><MaterialIcon name="send" style={{ fontVariationSettings: "'FILL' 1" }} /></button>
                            </div>
                        </div>
                    </footer>
                </section>

            </div>

            {/* Footer from reference - integrated into main content or TechnicianLayout footer?
                TechnicianLayout doesn't seem to have a content footer, only sidebar footer.
                The reference HTML had a <footer> at the bottom of the page.
                I will add it below the chat columns container if I want to match exactly.
            */}
            <footer className="h-10 bg-white border-t border-gray-200 flex items-center px-6 justify-between text-[11px] text-gray-500 font-medium shrink-0">
                <div className="flex gap-4">
                    <span>Active Connections: 3</span>
                    <span>Avg Latency: 24ms</span>
                </div>
                <div className="flex gap-4">
                    <a className="hover:text-[#135bec]" href="#">Help Center</a>
                    <a className="hover:text-[#135bec]" href="#">System Status</a>
                </div>
            </footer>
        </TechnicianLayout>
    );
};

export default TechnicianChat;
