import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import HireRequest from '../models/HireRequest.js';

let io;
const userSockets = new Map(); // Map userId to socketId

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
            credentials: true
        }
    });

    // Authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);

            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.userId = user._id.toString();
            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.userId}`);

        // Store user's socket ID
        userSockets.set(socket.userId, socket.id);

        // Emit user online status to all their conversations
        emitUserStatus(socket.userId, 'online');

        // Join conversation room
        socket.on('join-conversation', async (connectionId) => {
            try {
                // Verify user is part of this connection
                const connection = await HireRequest.findById(connectionId);
                if (!connection) {
                    socket.emit('error', { message: 'Connection not found' });
                    return;
                }

                const isParticipant =
                    connection.workerId.toString() === socket.userId ||
                    connection.employerId.toString() === socket.userId;

                if (!isParticipant) {
                    socket.emit('error', { message: 'Not authorized to join this conversation' });
                    return;
                }

                socket.join(`conversation-${connectionId}`);
                console.log(`User ${socket.userId} joined conversation ${connectionId}`);

                socket.emit('joined-conversation', { connectionId });
            } catch (error) {
                console.error('Error joining conversation:', error);
                socket.emit('error', { message: 'Error joining conversation' });
            }
        });

        // Send message
        socket.on('send-message', async (data) => {
            try {
                const { connectionId, text } = data;
                const senderId = socket.userId;

                // Validate
                if (!connectionId || !text) {
                    socket.emit('error', { message: 'Invalid message data' });
                    return;
                }

                // Check connection and authorization
                const connection = await HireRequest.findById(connectionId);
                if (!connection) {
                    socket.emit('error', { message: 'Connection not found' });
                    return;
                }

                const isParticipant =
                    connection.workerId.toString() === senderId ||
                    connection.employerId.toString() === senderId;

                if (!isParticipant) {
                    socket.emit('error', { message: 'Not authorized' });
                    return;
                }

                // Determine receiver
                const receiverId = connection.workerId.toString() === senderId
                    ? connection.employerId.toString()
                    : connection.workerId.toString();

                // Create message
                const message = await Message.create({
                    connectionId,
                    senderId,
                    receiverId,
                    text: text.trim()
                });

                await message.populate('senderId', 'name profilePhoto');

                // Update conversation
                let conversation = await Conversation.findOne({ connectionId });

                if (!conversation) {
                    conversation = await Conversation.create({
                        connectionId,
                        participants: [connection.workerId, connection.employerId],
                        lastMessage: {
                            text: text.trim(),
                            senderId,
                            timestamp: message.createdAt
                        },
                        unreadCount: {
                            [receiverId]: 1
                        }
                    });
                } else {
                    conversation.lastMessage = {
                        text: text.trim(),
                        senderId,
                        timestamp: message.createdAt
                    };
                    await conversation.incrementUnread(receiverId);
                }

                // Emit to conversation room
                io.to(`conversation-${connectionId}`).emit('receive-message', {
                    message,
                    conversation
                });

                // Emit to receiver for notification (if not in this conversation)
                const receiverSocketId = userSockets.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('new-message-notification', {
                        connectionId,
                        message,
                        sender: socket.user
                    });
                }

                console.log(`Message sent in conversation ${connectionId}`);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Error sending message' });
            }
        });

        // Typing indicator
        socket.on('typing', ({ connectionId, isTyping }) => {
            socket.to(`conversation-${connectionId}`).emit('typing-indicator', {
                userId: socket.userId,
                userName: socket.user.name,
                isTyping
            });
        });

        // Mark messages as read
        socket.on('mark-read', async ({ connectionId }) => {
            try {
                const userId = socket.userId;

                await Message.updateMany(
                    {
                        connectionId,
                        receiverId: userId,
                        read: false
                    },
                    {
                        read: true,
                        readAt: new Date()
                    }
                );

                const conversation = await Conversation.findOne({ connectionId });
                if (conversation) {
                    await conversation.resetUnread(userId);
                }

                // Notify the other user that messages were read
                socket.to(`conversation-${connectionId}`).emit('messages-read', {
                    connectionId,
                    readBy: userId
                });

            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);
            userSockets.delete(socket.userId);

            // Emit user offline status
            emitUserStatus(socket.userId, 'offline');
        });
    });

    return io;
};

// Helper function to emit user status to their conversations
const emitUserStatus = async (userId, status) => {
    try {
        const conversations = await Conversation.find({
            participants: userId
        });

        conversations.forEach(conv => {
            io.to(`conversation-${conv.connectionId}`).emit('user-status', {
                userId,
                status,
                timestamp: new Date()
            });
        });
    } catch (error) {
        console.error('Error emitting user status:', error);
    }
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};
