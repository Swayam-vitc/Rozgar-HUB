import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import HireRequest from '../models/HireRequest.js';
import User from '../models/User.js';

// @desc    Send a message
// @route   POST /api/messages/send
// @access  Private
export const sendMessage = async (req, res) => {
    try {
        const { connectionId, text } = req.body;
        const senderId = req.user._id;

        // Validate input
        if (!connectionId || !text) {
            return res.status(400).json({
                success: false,
                message: 'Connection ID and message text are required'
            });
        }

        // Check if connection exists and user is a participant
        const connection = await HireRequest.findById(connectionId);
        if (!connection) {
            return res.status(404).json({
                success: false,
                message: 'Connection not found'
            });
        }

        // Verify user is part of this connection
        const isParticipant =
            connection.workerId.toString() === senderId.toString() ||
            connection.employerId.toString() === senderId.toString();

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to send messages in this conversation'
            });
        }

        // Determine receiver
        const receiverId = connection.workerId.toString() === senderId.toString()
            ? connection.employerId
            : connection.workerId;

        // Create message
        const message = await Message.create({
            connectionId,
            senderId,
            receiverId,
            text: text.trim()
        });

        // Populate sender info
        await message.populate('senderId', 'name profilePhoto');

        // Update or create conversation
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
                    [receiverId.toString()]: 1
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

        res.status(201).json({
            success: true,
            message: message,
            conversation
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending message',
            error: error.message
        });
    }
};

// @desc    Get messages for a connection
// @route   GET /api/messages/:connectionId
// @access  Private
export const getMessages = async (req, res) => {
    try {
        const { connectionId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const userId = req.user._id;

        // Check if connection exists
        const connection = await HireRequest.findById(connectionId);
        if (!connection) {
            return res.status(404).json({
                success: false,
                message: 'Connection not found'
            });
        }

        // Verify user is part of this connection
        const isParticipant =
            connection.workerId.toString() === userId.toString() ||
            connection.employerId.toString() === userId.toString();

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view these messages'
            });
        }

        // Fetch messages with pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const messages = await Message.find({ connectionId })
            .populate('senderId', 'name profilePhoto')
            .populate('receiverId', 'name profilePhoto')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalMessages = await Message.countDocuments({ connectionId });
        const hasMore = skip + messages.length < totalMessages;

        res.json({
            success: true,
            messages: messages.reverse(), // Reverse to show oldest first
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalMessages,
                hasMore
            }
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching messages',
            error: error.message
        });
    }
};

// @desc    Get all conversations for current user
// @route   GET /api/messages/conversations
// @access  Private
export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all conversations where user is a participant
        const conversations = await Conversation.find({
            participants: userId
        })
            .populate({
                path: 'connectionId',
                populate: [
                    { path: 'workerId', select: 'name profilePhoto role' },
                    { path: 'employerId', select: 'name profilePhoto role' },
                    { path: 'jobId', select: 'title' }
                ]
            })
            .populate('lastMessage.senderId', 'name')
            .sort({ 'lastMessage.timestamp': -1 });

        // Format conversations with other participant info
        const formattedConversations = conversations.map(conv => {
            const connection = conv.connectionId;
            if (!connection) return null;

            // Determine the other participant
            const otherParticipant = connection.workerId._id.toString() === userId.toString()
                ? connection.employerId
                : connection.workerId;

            return {
                _id: conv._id,
                connectionId: connection._id,
                jobTitle: connection.jobId?.title || 'Unknown Job',
                otherUser: {
                    _id: otherParticipant._id,
                    name: otherParticipant.name,
                    profilePhoto: otherParticipant.profilePhoto,
                    role: otherParticipant.role
                },
                lastMessage: conv.lastMessage,
                unreadCount: conv.unreadCount.get(userId.toString()) || 0,
                updatedAt: conv.updatedAt
            };
        }).filter(conv => conv !== null);

        res.json({
            success: true,
            conversations: formattedConversations
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching conversations',
            error: error.message
        });
    }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/mark-read
// @access  Private
export const markAsRead = async (req, res) => {
    try {
        const { connectionId } = req.body;
        const userId = req.user._id;

        if (!connectionId) {
            return res.status(400).json({
                success: false,
                message: 'Connection ID is required'
            });
        }

        // Update all unread messages for this user in this conversation
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

        // Reset unread count in conversation
        const conversation = await Conversation.findOne({ connectionId });
        if (conversation) {
            await conversation.resetUnread(userId);
        }

        res.json({
            success: true,
            message: 'Messages marked as read'
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking messages as read',
            error: error.message
        });
    }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get all conversations for user
        const conversations = await Conversation.find({
            participants: userId
        });

        // Sum up unread counts
        const totalUnread = conversations.reduce((sum, conv) => {
            return sum + (conv.unreadCount.get(userId.toString()) || 0);
        }, 0);

        res.json({
            success: true,
            count: totalUnread
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting unread count',
            error: error.message
        });
    }
};
