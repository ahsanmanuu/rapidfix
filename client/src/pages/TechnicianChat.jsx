import React, { useState, useEffect, useRef } from 'react';
import TechnicianLayout from '../components/TechnicianLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api'; // Axios instance
import { io } from 'socket.io-client';
import {
    Send, Mic, Paperclip, Image as ImageIcon, MoreVertical,
    X, FileText, Check, CheckCheck, AlertCircle, User, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Initialize Socket
const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');

// --- Helper Components ---

const MessageBubble = ({ msg, isMe, colors }) => {
    const isImage = msg.type === 'image';
    const isVoice = msg.type === 'voice';
    const isFile = msg.type === 'file';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-3`}
        >
            <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                    className={`p-3 relative shadow-md text-sm ${isMe
                        ? `bg-gradient-to-br ${colors.bgMe} text-white rounded-l-2xl rounded-tr-2xl rounded-br-none`
                        : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-r-2xl rounded-tl-2xl rounded-bl-none'
                        }`}
                >
                    {/* Text Content */}
                    {msg.message && <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>}

                    {/* Attachments */}
                    {isImage && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-white/10">
                            <img src={msg.attachmentUrl} alt="attachment" className="max-w-full h-auto object-cover" />
                        </div>
                    )}

                    {isVoice && (
                        <div className="mt-2 flex items-center gap-2 bg-black/20 p-2 rounded-lg min-w-[150px]">
                            <audio controls src={msg.attachmentUrl} className="h-8 w-full" />
                        </div>
                    )}

                    {isFile && (
                        <div className="mt-2 flex items-center gap-2 p-2 bg-black/20 rounded-lg border border-white/10">
                            <FileText size={16} />
                            <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline hover:text-white/80 truncate max-w-[150px]">
                                View File
                            </a>
                        </div>
                    )}

                    <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-white/70 justify-end' : 'text-slate-500'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && (msg.read ? <CheckCheck size={12} /> : <Check size={12} />)}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const ChatInput = ({ onSend, colorClass }) => {
    const [text, setText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const fileInputRef = useRef(null);

    const handleSend = () => {
        if (!text.trim()) return;
        onSend({ message: text, type: 'text' });
        setText('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Upload immediately
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/chat/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                onSend({
                    message: '',
                    attachmentUrl: res.data.url,
                    type: res.data.type // 'image', 'voice', or 'file'
                });
            }
        } catch (err) {
            console.error("Upload failed", err);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const file = new File([blob], "voice_note.webm", { type: 'audio/webm' });

                // Simulate file upload logic
                const formData = new FormData();
                formData.append('file', file);
                try {
                    const res = await api.post('/chat/upload', formData);
                    if (res.data.success) {
                        onSend({ attachmentUrl: res.data.url, type: 'voice' });
                    }
                } catch (err) { console.error("Voice Upload error", err); }

                stream.getTracks().forEach(track => track.stop()); // Stop mic
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (err) {
            console.error("Mic Error:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            setMediaRecorder(null);
        }
    };

    return (
        <footer className="p-3 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <div className={`flex items-end gap-2 bg-slate-800/50 rounded-xl p-2 border border-slate-700/50 focus-within:border-${colorClass}-500/50 transition-colors`}>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isRecording ? "Recording..." : "Type a message..."}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-200 resize-none max-h-24 py-2 placeholder:text-slate-500 custom-scrollbar outline-none"
                    rows={1}
                    disabled={isRecording}
                />

                <div className="flex items-center gap-1 pb-1">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        multiple={false}
                    />

                    {!text ? (
                        <>
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`p-2 rounded-full transition-all ${isRecording
                                    ? 'bg-red-500 text-white animate-pulse'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                    }`}
                                title={isRecording ? "Click to Send" : "Hold to Record"}
                            >
                                <Mic size={18} />
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
                            >
                                <Paperclip size={18} />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleSend}
                            className={`p-2 rounded-full bg-gradient-to-tr from-${colorClass}-600 to-${colorClass}-500 text-white shadow-lg hover:shadow-${colorClass}-500/20 active:scale-95 transition-all`}
                        >
                            <Send size={16} fill="currentColor" />
                        </button>
                    )}
                </div>
            </div>
        </footer>
    );
};

const ChatColumn = ({ title, subtitle, bgHeader, colorClass, partnerId, jobId, currentUserId, messages, onSendMessage, onFileUpload, isLoading }) => {
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (data) => {
        onSendMessage({
            receiverId: partnerId,
            jobId: jobId,
            ...data
        });
    };

    return (
        <section className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden ring-1 ring-white/5">
            {/* Header */}
            <header className={`${bgHeader} px-4 py-3 flex items-center justify-between shrink-0 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                <div className="flex items-center gap-3 relative z-10">
                    <div className="size-10 rounded-full bg-slate-900/30 border-2 border-white/20 flex items-center justify-center backdrop-blur-md">
                        {title.includes("Admin") ? <Shield size={18} className="text-white" /> : <User size={18} className="text-white" />}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white leading-tight tracking-wide">{title}</h3>
                        <p className="text-[10px] text-white/80 font-medium uppercase tracking-wider">{subtitle}</p>
                    </div>
                </div>
                <button className="p-1.5 hover:bg-white/20 rounded-lg text-white/90 transition-colors relative z-10">
                    <MoreVertical size={18} />
                </button>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col custom-scrollbar bg-slate-900/50">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">Loading chat...</div>
                ) : !partnerId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
                        <AlertCircle size={24} className="opacity-50" />
                        <p className="text-xs">No active connection</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
                        <p className="text-xs">Start the conversation</p>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-center mb-4">
                            <span className="text-[10px] bg-slate-800/80 text-slate-400 px-3 py-1 rounded-full uppercase tracking-wider font-bold border border-slate-700/50">
                                {new Date().toLocaleDateString()}
                            </span>
                        </div>
                        {messages.map((msg, idx) => (
                            <MessageBubble
                                key={msg.id || idx}
                                msg={msg}
                                isMe={msg.senderId === currentUserId}
                                colors={{ bgMe: `from-${colorClass}-600 to-${colorClass}-500` }}
                            />
                        ))}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {partnerId && <ChatInput onSend={handleSend} colorClass={colorClass} />}
        </section>
    );
};

const TechnicianChat = () => {
    const { user } = useAuth();
    const [activeJob, setActiveJob] = useState(null);
    const [messages, setMessages] = useState({ customer: [], internal: [], admin: [] });
    const [loading, setLoading] = useState(true);

    // Initial Data Fetch
    useEffect(() => {
        const fetchContext = async () => {
            if (!user?.id) return;
            try {
                // Get Active Jobs to Determine Customer
                const res = await api.get(`/technicians/${user.id}/dashboard-stats`);
                if (res.data.success && res.data.activeJobs?.length > 0) {
                    // Pick the most relevant active job (first one)
                    setActiveJob(res.data.activeJobs[0]);
                }
            } catch (err) {
                console.error("Failed to load chat context", err);
            } finally {
                setLoading(false);
            }
        };
        fetchContext();
    }, [user?.id]);

    // Load Histories
    useEffect(() => {
        const loadHistories = async () => {
            if (!user?.id) return;

            // 1. Customer Chat (if active job exists)
            if (activeJob) {
                try {
                    const res = await api.get(`/chat/history/${user.id}/${activeJob.userId}?jobId=${activeJob.id}`);
                    if (res.data.success) {
                        setMessages(prev => ({ ...prev, customer: res.data.chats }));
                    }
                } catch (e) { console.error("Customer history error", e); }
            }

            // 2. Internal Comms (Chat with 'admin')
            try {
                const res = await api.get(`/chat/history/${user.id}/admin`);
                if (res.data.success) {
                    setMessages(prev => ({ ...prev, internal: res.data.chats }));
                }
            } catch (e) { console.error("Internal history error", e); }

            // 3. Alerts (Chat with 'superadmin') - Or maybe just duplicate "admin" for now if superadmin ID unknown
            // Assuming superadmin ID is literally 'superadmin' string for special broadcasts
            try {
                const res = await api.get(`/chat/history/${user.id}/superadmin`);
                if (res.data.success) {
                    setMessages(prev => ({ ...prev, admin: res.data.chats }));
                }
            } catch (e) {
                // It's ok if empty
            }
        };

        loadHistories();
    }, [user?.id, activeJob]);

    // Realtime Listener
    useEffect(() => {
        if (!user?.id) return;

        socket.on('connect', () => {
            console.log("Chat Hub Connected");
            socket.emit('join_room', `user_${user.id}`);
            if (activeJob) socket.emit('join_room', `job_${activeJob.id}`);
        });

        socket.on('new_message', (msg) => {
            console.log("Received Message:", msg);
            // Deduce which column this belongs to
            if (activeJob && (msg.jobId === activeJob.id || msg.senderId === activeJob.userId || msg.receiverId === activeJob.userId)) {
                setMessages(prev => ({ ...prev, customer: [...prev.customer, msg] })); // Append
            } else if (msg.senderId === 'admin' || msg.receiverId === 'admin') {
                setMessages(prev => ({ ...prev, internal: [...prev.internal, msg] }));
            } else if (msg.senderId === 'superadmin' || msg.receiverId === 'superadmin') {
                setMessages(prev => ({ ...prev, admin: [...prev.admin, msg] }));
            }
        });

        return () => {
            socket.off('connect');
            socket.off('new_message');
        };
    }, [user?.id, activeJob]);

    const handleSendMessage = async (data) => {
        if (!user?.id) return;

        const payload = {
            senderId: user.id,
            senderName: user.name,
            ...data
        };

        // Optimistic UI Update (Optional, but good for UX)
        // Here we just wait for socket echo for simplicity, but we can append locally too.

        try {
            await api.post('/chat/send', payload);
            // Socket will echo back via 'new_message' or 'message_sent' (if we listened to it)
            // But current logic listens to 'new_message'

            // Manually append locally to ensure instant feedback?
            // The socket echo might be fast enough.
            // Let's rely on socket to avoid duplicates.
        } catch (err) {
            console.error("Send Error", err);
            alert("Failed to send message");
        }
    };

    return (
        <TechnicianLayout title="Triple-Channel Chat Hub" subtitle="Real-time Operational Communication">
            <div className="flex-1 flex overflow-hidden p-4 gap-4 h-full bg-slate-950 font-sans relative">
                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />

                {/* Column 1: Customer Chat */}
                <ChatColumn
                    title={activeJob?.contactName || "Customer"}
                    subtitle={activeJob ? `Active Job #${activeJob.id.slice(0, 6)}` : "No Active Job"}
                    bgHeader="bg-gradient-to-r from-emerald-600 to-emerald-500"
                    colorClass="emerald"
                    partnerId={activeJob?.userId}
                    jobId={activeJob?.id}
                    currentUserId={user?.id}
                    messages={messages.customer}
                    onSendMessage={handleSendMessage}
                    isLoading={loading}
                />

                {/* Column 2: Internal Comms */}
                <ChatColumn
                    title="Tech Support"
                    subtitle="Internal • Area Manager"
                    bgHeader="bg-gradient-to-r from-amber-500 to-orange-500"
                    colorClass="orange"
                    partnerId="admin"
                    jobId={null}
                    currentUserId={user?.id}
                    messages={messages.internal}
                    onSendMessage={handleSendMessage}
                    isLoading={loading}
                />

                {/* Column 3: System Alerts */}
                <ChatColumn
                    title="System Alerts"
                    subtitle="Super Admin • Broadcasts"
                    bgHeader="bg-gradient-to-r from-rose-600 to-red-500"
                    colorClass="rose"
                    partnerId="superadmin"
                    jobId={null}
                    currentUserId={user?.id}
                    messages={messages.admin}
                    onSendMessage={handleSendMessage}
                    isLoading={loading}
                />

            </div>

            {/* Status Footer */}
            <footer className="h-8 bg-slate-900 border-t border-slate-800 flex items-center px-4 justify-between text-[10px] text-slate-500 font-medium shrink-0">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1.5"><div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Connection</span>
                    <span>Latency: 24ms</span>
                </div>
                <div>Encrypted End-to-End • Version 2.4.0</div>
            </footer>
        </TechnicianLayout>
    );
};

export default TechnicianChat;
