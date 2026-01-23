import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Mail, Camera } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-[#101922] text-white pt-12 pb-6">
            <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
                {/* Main Grid - Stack on mobile */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
                    {/* Brand Column - Full width on mobile */}
                    <div className="col-span-2 sm:col-span-2 md:col-span-1 mb-4 md:mb-0">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <img src="/logo.png" alt="Fixofy" className="h-8 w-auto brightness-0 invert" />
                            <span className="text-white text-xl font-black lowercase">fixofy</span>
                        </Link>
                        <p className="text-gray-400 text-sm leading-relaxed mb-4 max-w-xs">
                            Connecting you with trusted local professionals for all your home service needs.
                        </p>
                        <div className="flex gap-3">
                            <a href="#" className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                                <Globe size={18} />
                            </a>
                            <a href="#" className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                                <Mail size={18} />
                            </a>
                            <a href="#" className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                                <Camera size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="text-white font-semibold text-sm mb-3">Company</h3>
                        <div className="flex flex-col gap-2">
                            <Link to="/about" className="text-gray-400 hover:text-[#FF6B00] text-sm">About Us</Link>
                            <Link to="/careers" className="text-gray-400 hover:text-[#FF6B00] text-sm">Careers</Link>
                            <Link to="/blog" className="text-gray-400 hover:text-[#FF6B00] text-sm">Blog</Link>
                            <Link to="/press" className="text-gray-400 hover:text-[#FF6B00] text-sm">Press</Link>
                        </div>
                    </div>

                    {/* Customer Links */}
                    <div>
                        <h3 className="text-white font-semibold text-sm mb-3">Customers</h3>
                        <div className="flex flex-col gap-2">
                            <Link to="/how-it-works" className="text-gray-400 hover:text-[#FF6B00] text-sm">How it works</Link>
                            <Link to="/safety" className="text-gray-400 hover:text-[#FF6B00] text-sm">Safety</Link>
                            <Link to="/help" className="text-gray-400 hover:text-[#FF6B00] text-sm">Help Center</Link>
                            <Link to="/search" className="text-gray-400 hover:text-[#FF6B00] text-sm">Find Pros</Link>
                        </div>
                    </div>

                    {/* Pro Links */}
                    <div>
                        <h3 className="text-white font-semibold text-sm mb-3">For Pros</h3>
                        <div className="flex flex-col gap-2">
                            <Link to="/join-partner" className="text-gray-400 hover:text-[#FF6B00] text-sm">Become a Pro</Link>
                            <Link to="/success-stories" className="text-gray-400 hover:text-[#FF6B00] text-sm">Success Stories</Link>
                            <Link to="/community" className="text-gray-400 hover:text-[#FF6B00] text-sm">Community</Link>
                            <Link to="/pro-support" className="text-gray-400 hover:text-[#FF6B00] text-sm">Pro Support</Link>
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
