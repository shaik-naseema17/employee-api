import bcrypt from 'bcrypt';
import Employee from "../models/Employee.js"
import User from "../models/User.js"
import multer from 'multer'
import path from 'path';
import fs from 'fs';
import Department from '../models/Department.js'

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create uploads directory if it doesn't exist
        const uploadsDir = 'public/uploads';
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Initialize multer
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
}).single('image');

const addEmployee = async (req, res) => {
    // First handle the file upload
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ 
                success: false, 
                error: err.message 
            });
        }

        try {
            const {
                name,
                email,
                employeeId,
                dob,
                gender,
                maritalStatus,
                designation,
                department,
                salary,
                password,
                role,
            } = req.body;
            
            // Validate required fields
            if (!name || !email || !password || !employeeId) {
                return res.status(400).json({ 
                    success: false, 
                    error: "Missing required fields" 
                });
            }

            // Check if user exists
            const user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ 
                    success: false, 
                    error: "User already registered" 
                });
            }

            // Hash password
            const hashPassword = await bcrypt.hash(password, 10);
            
            // Create new user
            const newUser = new User({
                name,
                email,
                password: hashPassword,
                role,
                profileImage: req.file ? `/uploads/${req.file.filename}` : ""
            });

            const savedUser = await newUser.save();

            // Create new employee
            const newEmployee = new Employee({
                userId: savedUser._id,
                employeeId,
                dob,
                gender,
                maritalStatus,
                designation,
                department,
                salary
            });

            await newEmployee.save();
            
            return res.status(201).json({ 
                success: true, 
                message: "Employee created successfully",
                employee: {
                    id: savedUser._id,
                    name: savedUser.name,
                    email: savedUser.email
                }
            });
        } catch (error) {
            console.error("Error adding employee:", error);
            
            // Clean up uploaded file if error occurred
            if (req.file) {
                fs.unlink(`public/uploads/${req.file.filename}`, (unlinkErr) => {
                    if (unlinkErr) console.error("Error deleting uploaded file:", unlinkErr);
                });
            }
            
            return res.status(500).json({ 
                success: false, 
                error: "Server error while adding employee",
                ...(process.env.NODE_ENV === 'development' && { 
                    detailedError: error.message,
                    stack: error.stack 
                })
            });
        }
    });
};

const getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find()
            .populate('userId', { password: 0 })
            .populate("department");
        return res.status(200).json({ 
            success: true, 
            count: employees.length,
            employees 
        });
    } catch (error) {
        console.error("Error fetching employees:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Server error while fetching employees" 
        });
    }
};

const getEmployee = async (req, res) => {
    const { id } = req.params;
    try {
        let employee;
        employee = await Employee.findById(id)
            .populate('userId', { password: 0 })
            .populate("department");
        
        if (!employee) {
            employee = await Employee.findOne({ userId: id })
                .populate('userId', { password: 0 })
                .populate("department");
        }

        if (!employee) {
            return res.status(404).json({ 
                success: false, 
                error: "Employee not found" 
            });
        }

        return res.status(200).json({ 
            success: true, 
            employee 
        });
    } catch (error) {
        console.error("Error fetching employee:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Server error while fetching employee" 
        });
    }
};

const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            maritalStatus,
            designation,
            department,
            salary,
        } = req.body;

        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ 
                success: false, 
                error: "Employee not found" 
            });
        }

        const user = await User.findById(employee.userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: "User not found" 
            });
        }

        // Update user
        if (name) user.name = name;
        await user.save();

        // Update employee
        if (maritalStatus) employee.maritalStatus = maritalStatus;
        if (designation) employee.designation = designation;
        if (department) employee.department = department;
        if (salary) employee.salary = salary;
        await employee.save();

        return res.status(200).json({ 
            success: true, 
            message: "Employee updated successfully",
            employee 
        });
    } catch (error) {
        console.error("Error updating employee:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Server error while updating employee" 
        });
    }
};

const fetchEmployeesByDepId = async (req, res) => {
    const { id } = req.params;
    try {
        const employees = await Employee.find({ department: id })
            .populate('userId', { password: 0 })
            .populate("department");
        
        return res.status(200).json({ 
            success: true, 
            count: employees.length,
            employees 
        });
    } catch (error) {
        console.error("Error fetching employees by department:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Server error while fetching employees by department" 
        });
    }
};

export { 
    addEmployee, 
    getEmployees, 
    getEmployee, 
    updateEmployee, 
    fetchEmployeesByDepId 
};