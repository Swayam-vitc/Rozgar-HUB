import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    workerName: {
        type: String,
        required: true
    },
    workerPhone: {
        type: String
    },
    workerPhoto: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'hired'],
        default: 'pending'
    },
    appliedDate: {
        type: Date,
        default: Date.now
    },
    teamMembers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    message: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Prevent duplicate applications
applicationSchema.index({ jobId: 1, workerId: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

export default Application;
