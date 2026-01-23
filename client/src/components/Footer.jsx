import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Mail, Camera } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-[#101922] text-white pt-12 pb-6">
            <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
                {/* Main Content - Brand on top (mobile) or left (desktop) */}
                <div className="flex flex-col md:flex-row gap-10 md:gap-8 mb-10">
                    {/* Brand Section */}
                    <div className="md:w-1/4">
                        <Link to="/" className="flex items-center gap-2 mb-3">
                            <img src="/logo.png" alt="Fixofy" className="h-7 w-auto brightness-0 invert" />
                            <span className="text-white text-lg font-black lowercase">fixofy</span>
                        </Link>
                        <p className="text-gray-400 text-[11px] leading-relaxed mb-4 max-w-[200px]">
                            Connecting you with trusted local professionals for all your home service needs.
                        </p>
                        <div className="flex gap-2">
                            <a href="#" className="p-1.5 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                                <Globe size={14} />
                            </a>
                            <a href="#" className="p-1.5 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                                <Mail size={14} />
                            </a>
                            <a href="#" className="p-1.5 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                                <Camera size={14} />
                            </a>
                        </div>
                    </div>

                    {/* Links Row - Always 3 columns on mobile */}
                    <div className="grid grid-cols-3 flex-1 gap-4 md:gap-8">
                        {/* Company Links */}
                        <div>
                            <h3 className="text-white font-bold text-[10px] uppercase tracking-widest mb-3 opacity-60">Company</h3>
                            <div className="flex flex-col gap-2">
                                <Link to="/about" className="text-gray-400 hover:text-[#FF6B00] text-[11px] transition-colors">About Us</Link>
                                <Link to="/careers" className="text-gray-400 hover:text-[#FF6B00] text-[11px] transition-colors">Careers</Link>
                                <Link to="/blog" className="text-gray-400 hover:text-[#FF6B00] text-[11px] transition-colors">Blog</Link>
                                <Link to="/press" className="text-gray-400 hover:text-[#FF6B00] text-[11px] transition-colors">Press</Link>
                            </div>
                        </div>

                        {/* Customer Links */}
                        <div>
                            <h3 className="text-white font-bold text-[10px] uppercase tracking-widest mb-3 opacity-60">Customers</h3>
                            <div className="flex flex-col gap-2">
                                <Link to="/how-it-works" className="text-gray-400 hover:text-[#FF6B00] text-[11px] transition-colors">How it works</Link>
                                <Link to="/safety" className="text-gray-400 hover:text-[#FF6B00] text-[11px] transition-colors">Safety</Link>
                                <Link to="/help" className="text-gray-400 hover:text-[#FF6B00] text-[11px] transition-colors">Help</Link>
                                <Link to="/search" className="text-gray-400 hover:text-[#FF6B00] text-[11px] transition-colors">Pros</Link>
                            </div>
                        </div>

                        {/* Pro Links */}
                        <div>
                            <h3 className="text-white font-bold text-[10px] uppercase tracking-widest mb-3 opacity-60">For Pros</h3>
                            <div className="flex flex-col gap-2">
                                <Link to="/join-partner" className="text-gray-400 hover:text-[#FF6B00] text-[11px] transition-colors">Join Us</Link>
                                <Link to="/success-stories" className="text-gray-400 hover:text-[#FF6B00] text-[11px] transition-colors">Stories</Link>
                                <Link to="/community" className="text-gray-400 hover:text-[#FF6B00] text-[11px] transition-colors">Community</Link>
                                <Link to="/pro-support" className="text-gray-400 hover:text-[#FF6B00] text-[11px] transition-colors">Support</Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-center border-t border-gray-800 pt-6 gap-4">
                    <p className="text-gray-500 text-xs text-center sm:text-left">
                        © {new Date().getFullYear()} Fixofy Technologies Inc.
                    </p>
                    <div className="flex gap-4 text-xs">
                        <Link to="/privacy" className="text-gray-500 hover:text-white">Privacy</Link>
                        <Link to="/terms" className="text-gray-500 hover:text-white">Terms</Link>
                        <Link to="/sitemap" className="text-gray-500 hover:text-white">Sitemap</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
