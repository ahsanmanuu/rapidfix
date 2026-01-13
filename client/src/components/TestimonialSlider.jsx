import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { getTestimonials } from '../services/api';

const TestimonialSlider = () => {
    const [testimonials, setTestimonials] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [direction, setDirection] = useState(0);

    // Fallback data if API fails or returns empty (for demo excellence)
    const fallbackTestimonials = [
        {
            id: 1,
            name: "Sarah Chen",
            role: "VP of Operations, TechSphere Inc.",
            photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
            comment: "Absolutely game-changing for our team. A must-have platform! The software has streamlined our entire workflow, significantly boosting productivity and collaboration.",
            rating: 5
        },
        {
            id: 2,
            name: "Michael Ross",
            role: "Property Manager",
            photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
            comment: "Fixofy's technicians are top-notch. I've never had a service request handled so quickly and professionally before.",
            rating: 5
        },
        {
            id: 3,
            name: "Elena Rodriguez",
            role: "Interior Designer",
            photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
            comment: "The attention to detail is impressive. The painters were clean, respectful, and did a fantastic job transforming my client's living room.",
            rating: 4.8
        },
        {
            id: 4,
            name: "David Kim",
            role: "Restaurant Owner",
            photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
            comment: "Emergency AC repair saved my business during the heatwave. Highly recommended for any commercial needs!",
            rating: 5
        }
    ];

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const res = await getTestimonials();
                if (res.data.success && res.data.testimonials.length > 0) {
                    setTestimonials(res.data.testimonials);
                } else {
                    setTestimonials(fallbackTestimonials);
                }
            } catch (err) {
                console.error("Failed to load testimonials, using fallback", err);
                setTestimonials(fallbackTestimonials);
            } finally {
                setLoading(false);
            }
        };

        fetchTestimonials();
    }, []);

    const slideVariants = {
        enter: (direction) => ({
            x: direction > 0 ? 50 : -50,
            opacity: 0,
            scale: 0.95
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.4,
                ease: [0.25, 1, 0.5, 1], // Cubic bezier for smooth feeling
            }
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 50 : -50,
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.4 }
        })
    };

    const swipe = (newDirection) => {
        setDirection(newDirection);
        setCurrentIndex((prev) => (prev + newDirection + testimonials.length) % testimonials.length);
    };

    const jumpTo = (index) => {
        setDirection(index > currentIndex ? 1 : -1);
        setCurrentIndex(index);
    };

    if (loading) return <div className="py-20 text-center text-slate-400 animate-pulse">Loading testimonials...</div>;

    const currentData = testimonials[currentIndex];

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-8 relative">
            <h2 className="text-center text-4xl font-extrabold text-slate-900 mb-16 tracking-tight">
                Trusted by Experts & Homeowners
            </h2>

            <div className="relative flex items-center justify-center min-h-[350px]">

                {/* Nav Buttons (Desktop) - Positioned further out */}
                <button
                    onClick={() => swipe(-1)}
                    className="absolute left-0 md:-left-4 z-20 p-4 rounded-full bg-white shadow-xl text-slate-400 hover:text-blue-600 hover:scale-110 transition-all border border-slate-100 hidden md:flex items-center justify-center"
                    aria-label="Previous testimonial"
                >
                    <ChevronLeft size={28} />
                </button>

                <button
                    onClick={() => swipe(1)}
                    className="absolute right-0 md:-right-4 z-20 p-4 rounded-full bg-white shadow-xl text-slate-400 hover:text-blue-600 hover:scale-110 transition-all border border-slate-100 hidden md:flex items-center justify-center"
                    aria-label="Next testimonial"
                >
                    <ChevronRight size={28} />
                </button>

                {/* Main Card */}
                <div className="relative w-full max-w-4xl perspective-1000">
                    <AnimatePresence initial={false} custom={direction} mode='wait'>
                        <motion.div
                            key={currentIndex}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="bg-white rounded-[2rem] shadow-2xl p-10 md:p-14 relative border border-slate-100" // Cleaner border, larger padding
                            style={{
                                boxShadow: "0 20px 60px -15px rgba(0, 0, 0, 0.05)" // Very soft, premium shadow
                            }}
                        >
                            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-14">
                                {/* Photo Circle - Larger and Centered */}
                                <div className="shrink-0 relative">
                                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-lg relative z-10 mx-auto">
                                        <img
                                            src={currentData.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentData.name)}&background=random`}
                                            alt={currentData.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    {/* Decorative Pattern - Subtle */}
                                    <div className="absolute -top-4 -left-4 w-full h-full rounded-full border border-blue-100 -z-0 scale-110"></div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 text-center md:text-left flex flex-col justify-center">
                                    <div className="flex items-center justify-center md:justify-start gap-1 mb-5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={22}
                                                className={i < Math.round(currentData.rating) ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                                            />
                                        ))}
                                    </div>

                                    <div className="relative mb-6">
                                        <h3 className="text-xl md:text-2xl font-bold text-slate-800 leading-normal">
                                            "{currentData.comment}"
                                        </h3>
                                    </div>

                                    <div>
                                        <p className="font-bold text-slate-900 text-lg mb-0.5">{currentData.name}</p>
                                        <p className="text-slate-500 text-base font-medium">{currentData.role}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Thumbnails Navigation */}
            <div className="mt-16 flex justify-center items-center gap-5 flex-wrap">
                {testimonials.map((item, idx) => (
                    <button
                        key={item.id}
                        onClick={() => jumpTo(idx)}
                        className={`relative group transition-all duration-300 ${currentIndex === idx ? 'scale-110 opacity-100' : 'opacity-40 hover:opacity-100 hover:scale-105'}`}
                        aria-label={`View testimonial by ${item.name}`}
                    >
                        <div className={`w-14 h-14 rounded-full overflow-hidden border-2 cursor-pointer transition-colors ${currentIndex === idx ? 'border-blue-600 ring-4 ring-blue-50' : 'border-transparent'}`}>
                            <img
                                src={item.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random`}
                                alt={item.name}
                                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                            />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default TestimonialSlider;
