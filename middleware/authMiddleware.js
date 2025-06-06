import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const verifyUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, error: "Token not provided" });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_KEY);
        } catch (err) {
            return res.status(401).json({ success: false, error: "Invalid or expired token" });
        }

        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Token Verification Error:', error);
        return res.status(500).json({ success: false, error: "Server error" });
    }
};


export default verifyUser;
