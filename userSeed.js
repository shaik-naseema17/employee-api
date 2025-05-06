import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import connectToDatabase from './db/db.js';
import User from './models/User.js';

const userRegister = async () => {
    await connectToDatabase();

    try {
        const existingUser = await User.findOne({ email: 'admin@gmail.com' });

        if (existingUser) {
            console.log('Admin user already exists. Skipping creation.');
            return;
        }

        const hashedPassword = await bcrypt.hash('admin', 10);

        const newUser = new User({
            name: 'Admin',
            email: 'admin@gmail.com',
            password: hashedPassword,
            role: 'admin'
        });

        await newUser.save();
        console.log('Admin user created successfully');
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
};

userRegister();
