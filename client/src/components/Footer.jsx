import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-slate-900 pt-20 pb-10 text-slate-400 font-sans border-t border-slate-800">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-16">
                    {/* Brand Section - Full Width on Mobile */}
                    <div className="col-span-2 lg:col-span-1 space-y-6">
                        <Link to="/" className="text-3xl font-extrabold flex items-center gap-3 text-white tracking-tight">
                            <img src="/logo.png" alt="Fixofy" className="h-10 w-auto brightness-0 invert" />
                            Fixofy
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                            Your trusted partner for home services. Professional, reliable, and just a click away. We bring experts to your doorstep.
                        </p>
                        <div className="flex gap-3 pt-2">
                            <SocialIcon icon={<Facebook size={18} />} />
                            <SocialIcon icon={<Twitter size={18} />} />
                            <SocialIcon icon={<Instagram size={18} />} />
                            <SocialIcon icon={<Linkedin size={18} />} />
                        </div>
                    </div>

                    {/* Quick Links - Half Width on Mobile */}
                    <div className="col-span-1">
                        <h4 className="font-bold text-white text-lg mb-6 relative inline-block">
                            Quick Links
                            <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-blue-600 rounded-full"></span>
                        </h4>
                        <ul className="space-y-4 text-sm">
                            <li><FooterLink to="/">Home</FooterLink></li>
                            <li><FooterLink to="/about">About Us</FooterLink></li>
                            <li><FooterLink to="/services">Services</FooterLink></li>
                            <li><FooterLink to="/contact">Contact</FooterLink></li>
                            <li><Link to="/join-partner" className="text-blue-500 font-semibold hover:text-blue-400 transition-colors">Join as Partner</Link></li>
                        </ul>
                    </div>

                    {/* Services - Half Width on Mobile */}
                    <div className="col-span-1">
                        <h4 className="font-bold text-white text-lg mb-6 relative inline-block">
                            Popular Services
                            <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-blue-600 rounded-full"></span>
                        </h4>
                        <ul className="space-y-4 text-sm">
                            <li><FooterLink to="/service/electrician">Electrician</FooterLink></li>
                            <li><FooterLink to="/service/plumber">Plumber</FooterLink></li>
                            <li><FooterLink to="/service/painter">Painter</FooterLink></li>
                            <li><FooterLink to="/service/ac-technician">A.C. Technician</FooterLink></li>
                            <li><FooterLink to="/service/inverter-technician">Inverter Technician</FooterLink></li>
                            <li><FooterLink to="/service/cctv-technician">CCTV Technician</FooterLink></li>
                            <li><FooterLink to="/service/biometrics-technician">Biometrics Technician</FooterLink></li>
                            <li><FooterLink to="/service/printer-technician">Printer Technician</FooterLink></li>
                        </ul>
                    </div>

                    {/* Contact Info - Full Width on Mobile (to accommodate long address) */}
                    <div className="col-span-2 lg:col-span-1">
                        <h4 className="font-bold text-white text-lg mb-6 relative inline-block">
                            Contact Us
                            <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-blue-600 rounded-full"></span>
                        </h4>
                        <ul className="space-y-5 text-sm">
                            <li className="flex items-start gap-4 group">
                                <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-blue-600 transition-colors text-white mt-1">
                                    <MapPin size={16} />
                                </div>
                                <span className="leading-relaxed">123 Innovation Drive,<br />Tech City, TC 90210</span>
                            </li>
                            <li className="flex items-center gap-4 group">
                                <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-blue-600 transition-colors text-white">
                                    <Phone size={16} />
                                </div>
                                <span>+1 (555) 123-4567</span>
                            </li>
                            <li className="flex items-center gap-4 group">
                                <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-blue-600 transition-colors text-white">
                                    <Mail size={16} />
                                </div>
                                <span>support@fixofy.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                    <p>&copy; {new Date().getFullYear()} Fixofy Home Services. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

const FooterLink = ({ to, children }) => (
    <Link to={to} className="block hover:text-white hover:translate-x-1 transition-all duration-300">
        {children}
    </Link>
);

const SocialIcon = ({ icon }) => (
    <a href="#" className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-black/20">
        {icon}
    </a>
);

export default Footer;
