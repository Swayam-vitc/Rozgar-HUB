import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { messageAPI } from '@/lib/api';

export const useUnreadMessages = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const { socket, isConnected } = useSocket();

    const fetchUnreadCount = async () => {
        try {
            const response = await messageAPI.getConversations() as any;
            if (response.success) {
                const total = response.conversations.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0);
                setUnreadCount(total);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    useEffect(() => {
        fetchUnreadCount();

        // Listen for local event to update count (e.g. when user reads messages)
        const handleLocalUpdate = () => {
            fetchUnreadCount();
        };

        window.addEventListener('messages-read-update', handleLocalUpdate);

        return () => {
            window.removeEventListener('messages-read-update', handleLocalUpdate);
        };
    }, []);

    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleNewMessage = () => {
            fetchUnreadCount();
        };

        socket.on('receive-message', handleNewMessage);
        socket.on('new-message-notification', handleNewMessage);

        return () => {
            socket.off('receive-message', handleNewMessage);
            socket.off('new-message-notification', handleNewMessage);
        };
    }, [socket, isConnected]);

    return unreadCount;
};
