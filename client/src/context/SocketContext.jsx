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
            // Use dynamic URL based on environment
            const socketURL = import.meta.env.PROD ? '/' : 'http://localhost:3000';
            const newSocket = io(socketURL);

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
                    // Simple alert for now, can be replaced with a Toast component later
                    alert(`📢 IMPORTANT: ${data.title}\n\n${data.message}`);
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
