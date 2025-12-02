import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    connectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HireRequest',
        required: true,
        unique: true,
        index: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        text: {
            type: String,
            default: ''
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    }
}, {
    timestamps: true
});

// Index for fetching user's conversations
conversationSchema.index({ participants: 1, 'lastMessage.timestamp': -1 });

// Method to increment unread count for a user
conversationSchema.methods.incrementUnread = function (userId) {
    const currentCount = this.unreadCount.get(userId.toString()) || 0;
    this.unreadCount.set(userId.toString(), currentCount + 1);
    return this.save();
};

// Method to reset unread count for a user
conversationSchema.methods.resetUnread = function (userId) {
    this.unreadCount.set(userId.toString(), 0);
    return this.save();
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
