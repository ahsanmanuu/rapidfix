import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children, user }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (user) {
            // Use window.location.origin for reliable production connection
            const socketURL = import.meta.env.PROD ? window.location.origin : 'http://localhost:3000';
            const newSocket = io(socketURL, {
                transports: ['websocket', 'polling'], // Allow polling fallbacks
                path: '/socket.io' // Ensure path matches server
            });

            newSocket.on('connect', () => {
                console.log('Connected to socket server:', newSocket.id);
                // Join user-specific room
                const roomPrefix = user.role === 'technician' ? 'tech_' : 'user_';
                const roomName = `${roomPrefix}${user.id}`;
                console.log(`🔌 Requesting to join room: ${roomName}`);
                newSocket.emit('join_room', roomName);

                // Also update location immediately upon connection if available
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((position) => {
                        const { latitude, longitude } = position.coords;
                        newSocket.emit('update_location', {
                            userId: user.id,
                            role: user.role,
                            location: { latitude, longitude }
                        });
                    }, (error) => {
                        console.error('Socket Location Error:', error);
                    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
                }
                // General Broadcast Listener
                newSocket.on('general_broadcast', (data) => {
                    console.log('📢 Broadcast received:', data);
                    alert(`📢 IMPORTANT: ${data.title}\n\n${data.message}`);
                });

                // [FIX] Real-time Personal Notifications
                newSocket.on('new_notification', (data) => {
                    console.log('🔔 Notification received:', data);
                    // Use browser API if available, fallback to alert
                    if (Notification.permission === "granted") {
                        new Notification(data.title, { body: data.message });
                    } else if (Notification.permission !== "denied") {
                        Notification.requestPermission().then(permission => {
                            if (permission === "granted") {
                                new Notification(data.title, { body: data.message });
                            }
                        });
                    }
                    // Simple fallback Alert for visibility
                    // alert(`🔔 ${data.title}: ${data.message}`); 
                });
            });

            setSocket(newSocket);

            return () => newSocket.close();
        }
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
