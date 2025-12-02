import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Verify JWT token and attach user to request
export const protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        console.log('Auth middleware - Token present:', !!token);
        console.log('Auth middleware - Path:', req.path);

        if (!token) {
            console.log('Auth middleware - No token provided');
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token provided'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Auth middleware - Token decoded, user ID:', decoded.id);

            // Get user from token (exclude password)
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                console.log('Auth middleware - User not found for ID:', decoded.id);
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            console.log('Auth middleware - User authenticated:', req.user._id, 'Role:', req.user.role);
            next();
        } catch (error) {
            console.log('Auth middleware - Token verification failed:', error.message);
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            });
        }
    } catch (error) {
        console.error('Auth middleware - Server error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error in authentication'
        });
    }
};

// Require worker role
export const requireWorker = (req, res, next) => {
    if (req.user && req.user.role === 'worker') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Worker role required.'
        });
    }
};

// Require employer role
export const requireEmployer = (req, res, next) => {
    console.log('requireEmployer - User role:', req.user?.role);
    if (req.user && req.user.role === 'employer') {
        next();
    } else {
        console.log('requireEmployer - Access denied, role:', req.user?.role);
        res.status(403).json({
            success: false,
            message: 'Access denied. Employer role required.'
        });
    }
};
