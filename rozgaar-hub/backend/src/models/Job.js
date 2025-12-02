import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Job title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Job description is required']
    },
    employerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    employerName: {
        type: String,
        required: true
    },
    employerPhoto: {
        type: String,
        default: ''
    },
    location: {
        state: {
            type: String,
            required: [true, 'State is required'],
            index: true
        },
        city: {
            type: String,
            required: [true, 'City is required']
        }
    },
    coordinates: {
        lat: { type: Number },
        lng: { type: Number }
    },
    payAmount: {
        type: Number,
        required: [true, 'Pay amount is required'],
        min: 0
    },
    payType: {
        type: String,
        enum: ['hourly', 'daily', 'fixed'],
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    requiredSkills: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['open', 'in-progress', 'completed', 'cancelled'],
        default: 'open'
    },
    teamRequired: {
        type: Boolean,
        default: false
    },
    teamSize: {
        type: Number,
        default: 1
    },
    postedDate: {
        type: Date,
        default: Date.now
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    verified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for searching jobs
jobSchema.index({ 'location.state': 1, status: 1 });
jobSchema.index({ requiredSkills: 1 });
jobSchema.index({ employerId: 1 });

const Job = mongoose.model('Job', jobSchema);

export default Job;
