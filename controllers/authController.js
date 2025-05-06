import User from '../models/User.js';
import bcrypt from 'bcrypt';


import jwt from 'jsonwebtoken';

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, error: "User does not exist" });
        }

        // Verify password
        console.log("Plaintext Password Received:", password);

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ success: false, error: "Invalid password" });
        }
        

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_KEY,
            { expiresIn: "10d" }
        );

        // Send response
        return res.status(200).json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Login Error:', error.message);
        return res.status(500).json({ success: false, error: "Server error" });
    }
};

const verify = (req, res) => {
    return res.status(200).json({ success: true, user: req.user });
};

export { login, verify };
