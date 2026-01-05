import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8 text-slate-600">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <Link to="/" className="text-2xl font-bold flex items-center gap-2 text-slate-900">
                            <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-lg font-bold">F</span>
                            Fixofy
                        </Link>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            Your trusted partner for home services. Professional, reliable, and just a click away.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <SocialIcon icon={<Facebook size={18} />} />
                            <SocialIcon icon={<Twitter size={18} />} />
                            <SocialIcon icon={<Instagram size={18} />} />
                            <SocialIcon icon={<Linkedin size={18} />} />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-slate-900 mb-6">Quick Links</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/" className="hover:text-blue-600 transition-colors">Home</Link></li>
                            <li><Link to="/about" className="hover:text-blue-600 transition-colors">About Us</Link></li>
                            <li><Link to="/services" className="hover:text-blue-600 transition-colors">Services</Link></li>
                            <li><Link to="/contact" className="hover:text-blue-600 transition-colors">Contact</Link></li>
                            <li><Link to="/join-partner" className="text-blue-600 font-medium hover:text-blue-700">Join as Partner</Link></li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h4 className="font-bold text-slate-900 mb-6">Popular Services</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/service/electrical" className="hover:text-blue-600 transition-colors">Electrical Repair</Link></li>
                            <li><Link to="/service/plumbing" className="hover:text-blue-600 transition-colors">Plumbing Solutions</Link></li>
                            <li><Link to="/service/ac-repair" className="hover:text-blue-600 transition-colors">AC Maintenance</Link></li>
                            <li><Link to="/service/cleaning" className="hover:text-blue-600 transition-colors">Home Cleaning</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="font-bold text-slate-900 mb-6">Contact Us</h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3">
                                <MapPin size={18} className="text-blue-600 shrink-0 mt-0.5" />
                                <span>123 Innovation Drive,<br />Tech City, TC 90210</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone size={18} className="text-blue-600 shrink-0" />
                                <span>+1 (555) 123-4567</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail size={18} className="text-blue-600 shrink-0" />
                                <span>support@fixofy.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
                    <p>&copy; {new Date().getFullYear()} Fixofy Home Services. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

const SocialIcon = ({ icon }) => (
    <a href="#" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white transition-all duration-300">
        {icon}
    </a>
);

export default Footer;
