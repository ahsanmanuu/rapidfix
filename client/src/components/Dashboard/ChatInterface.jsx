import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import useSupabaseRealtime from '../../hooks/useSupabaseRealtime';
import {
    Box,
    Card,
    CardHeader,
    CardContent,
    TextField,
    IconButton,
    Typography,
    Avatar,
    InputAdornment,
    Divider
} from '@mui/material';
import { Send, ChatBubbleOutline, SupportAgent } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const ChatInterface = ({ user }) => {
    const theme = useTheme();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const socket = useSocket();
    const messagesEndRef = useRef(null);
    const roomId = `chat_${user.id}`;

    useEffect(() => {
        if (socket) {
            socket.emit('join_room', roomId);
            socket.on('receive_message', (data) => {
                setMessages((prev) => [...prev, data]);
            });
            return () => {
                socket.off('receive_message');
            };
        }
    }, [socket, roomId]);

    // [NEW] Supabase Realtime Hook for Chat
    useSupabaseRealtime('chats', (payload) => {
        if (payload.new) {
            const msg = payload.new;
            // Check if message belongs to this room (user-admin pair usually)
            // Simple check: if sender or receiver matches current user
            if (msg.senderId === user.id || msg.receiverId === user.id) {
                // Avoid duplicates if socket also sends (or just rely on Supabase)
                // For now, we add if not present by ID
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
        }
    }, 'INSERT');

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !socket) return;

        const messageData = {
            roomId: roomId,
            senderId: user.id,
            senderName: user.name,
            message: newMessage,
            timestamp: new Date().toISOString()
        };

        socket.emit('send_message', messageData);
        setMessages((prev) => [...prev, messageData]);
        setNewMessage('');
    };

    return (
        <Card sx={{ borderRadius: '16px', height: 600, display: 'flex', flexDirection: 'column' }}>
            <CardHeader
                avatar={
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        <SupportAgent />
                    </Avatar>
                }
                title={<Typography variant="h4">Live Support</Typography>}
                subheader={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, bgcolor: theme.palette.success.main, borderRadius: '50%' }} />
                        <Typography variant="caption" color="textSecondary">Online</Typography>
                    </Box>
                }
                sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}
            />

            <CardContent sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: theme.palette.grey[50] }}>
                {messages.length === 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 5, opacity: 0.5 }}>
                        <ChatBubbleOutline sx={{ fontSize: 60, color: theme.palette.text.secondary, mb: 2 }} />
                        <Typography variant="body1" color="textSecondary">No messages yet. Start a conversation!</Typography>
                    </Box>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {messages.map((msg, index) => {
                        const isMe = msg.senderId === user.id;
                        return (
                            <Box key={index} sx={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                                <Box sx={{
                                    p: 2,
                                    borderRadius: '12px',
                                    bgcolor: isMe ? theme.palette.primary.main : theme.palette.background.paper,
                                    color: isMe ? '#fff' : theme.palette.text.primary,
                                    boxShadow: theme.shadows[1],
                                    borderBottomRightRadius: isMe ? 0 : 12,
                                    borderBottomLeftRadius: isMe ? 12 : 0
                                }}>
                                    {!isMe && <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>{msg.senderName}</Typography>}
                                    <Typography variant="body1">{msg.message}</Typography>
                                </Box>
                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, textAlign: isMe ? 'right' : 'left', color: theme.palette.text.secondary }}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Typography>
                            </Box>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </Box>
            </CardContent>

            <Box component="form" onSubmit={handleSend} sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
                <TextField
                    fullWidth
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    variant="outlined"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton type="submit" color="primary" disabled={!newMessage.trim()}>
                                    <Send />
                                </IconButton>
                            </InputAdornment>
                        ),
                        sx: { borderRadius: '12px' }
                    }}
                />
            </Box>
        </Card>
    );
};

export default ChatInterface;
