import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't include password in queries by default
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    role: {
        type: String,
        enum: ['worker', 'employer'],
        required: [true, 'Role is required']
    },
    profilePhoto: {
        type: String,
        default: ''
    },
    language: {
        type: String,
        enum: ['en', 'hi'],
        default: 'en'
    },
    // Worker-specific fields
    skills: [{
        type: String
    }],
    location: {
        state: {
            type: String,
            default: '',
            index: true // For efficient location-based queries
        },
        city: {
            type: String,
            default: ''
        }
    },
    hourlyRate: {
        type: Number,
        default: 0
    },
    dailyRate: {
        type: Number,
        default: 0
    },
    bio: {
        type: String,
        default: ''
    },
    workPhotos: [{
        type: String
    }],
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    completedJobs: {
        type: Number,
        default: 0
    },
    streak: {
        type: Number,
        default: 0
    },
    level: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'diamond'],
        default: 'bronze'
    },
    totalEarnings: {
        type: Number,
        default: 0
    },
    verified: {
        type: Boolean,
        default: false
    },
    // Rating system fields
    ratings: [{
        employerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        feedback: String,
        hireRequestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'HireRequest'
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    bestRating: {
        type: Number,
        default: 0
    },
    worstRating: {
        type: Number,
        default: 5
    },
    totalRatings: {
        type: Number,
        default: 0
    },
    // Employer-specific fields
    companyName: {
        type: String,
        default: ''
    },
    projectsPosted: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
};

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

const User = mongoose.model('User', userSchema);

export default User;
