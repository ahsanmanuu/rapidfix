import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Globe, Mail, Camera } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-[#101922] text-white pt-16 pb-8 border-t border-[#1e293b]">
            <div className="container mx-auto px-4 lg:px-10 flex flex-col gap-12 max-w-[1280px]">
                {/* Main Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand Column */}
                    <div className="flex flex-col gap-4">
                        <Link to="/" className="flex items-center gap-3 select-none group w-fit">
                            <img src="/logo.png" alt="Fixofy Logo" className="h-10 w-auto group-hover:scale-105 transition-transform brightness-0 invert" />
                            <div className="flex items-center gap-2">
                                <h1 className="text-white text-3xl font-black tracking-tighter lowercase m-0 leading-none">fixofy</h1>
                            </div>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                            Connecting you with trusted local professionals for all your home service needs through Fixofy. Fast, reliable, and secure.
                        </p>
                        <div className="flex gap-4 mt-2">
                            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Globe size={20} /></a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Mail size={20} /></a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Camera size={20} /></a>
                        </div>
                    </div>

                    {/* Company Links */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-white font-bold text-base">Company</h3>
                        <div className="flex flex-col gap-2">
                            <Link to="/about" className="text-gray-400 hover:text-[#FF6B00] text-sm transition-colors">About Us</Link>
                            <Link to="/careers" className="text-gray-400 hover:text-[#FF6B00] text-sm transition-colors">Careers</Link>
                            <Link to="/blog" className="text-gray-400 hover:text-[#FF6B00] text-sm transition-colors">Blog</Link>
                            <Link to="/press" className="text-gray-400 hover:text-[#FF6B00] text-sm transition-colors">Press</Link>
                        </div>
                    </div>

                    {/* Customer Links */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-white font-bold text-base">For Customers</h3>
                        <div className="flex flex-col gap-2">
                            <Link to="/how-it-works" className="text-gray-400 hover:text-[#FF6B00] text-sm transition-colors">How it works</Link>
                            <Link to="/safety" className="text-gray-400 hover:text-[#FF6B00] text-sm transition-colors">Safety</Link>
                            <Link to="/help" className="text-gray-400 hover:text-[#FF6B00] text-sm transition-colors">Help Center</Link>
                            <Link to="/search" className="text-gray-400 hover:text-[#FF6B00] text-sm transition-colors">Nearby Professionals</Link>
                        </div>
                    </div>

                    {/* Pro Links */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-white font-bold text-base">For Pros</h3>
                        <div className="flex flex-col gap-2">
                            <Link to="/join-partner" className="text-gray-400 hover:text-[#FF6B00] text-sm transition-colors">Become a Pro</Link>
                            <Link to="/success-stories" className="text-gray-400 hover:text-[#FF6B00] text-sm transition-colors">Success Stories</Link>
                            <Link to="/community" className="text-gray-400 hover:text-[#FF6B00] text-sm transition-colors">Community</Link>
                            <Link to="/pro-support" className="text-gray-400 hover:text-[#FF6B00] text-sm transition-colors">Pro Support</Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center border-t border-[#1e293b] pt-8 gap-4">
                    <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Fixofy Technologies Inc.</p>
                    <div className="flex gap-6">
                        <Link to="/privacy" className="text-gray-500 hover:text-white text-sm transition-colors">Privacy</Link>
                        <Link to="/terms" className="text-gray-500 hover:text-white text-sm transition-colors">Terms</Link>
                        <Link to="/sitemap" className="text-gray-500 hover:text-white text-sm transition-colors">Sitemap</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
