import Employee from "../models/Employee.js";
import Department from "../models/Department.js";
import Salary from "../models/Salary.js";
import Leave from "../models/Leave.js";

const getSummary = async (req, res) => {
    try {
        const totalEmployees = await Employee.countDocuments();
        const totalDepartments = await Department.countDocuments();

        // Calculate total monthly salary (only current month)
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const salaries = await Salary.aggregate([
            {
                $match: {
                    payDate: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSalary: { $sum: "$netSalary" }
                }
            }
        ]);

        // Leave statistics
        const employeeAppliedForLeave = await Leave.distinct("employeeId");
        const leaveStatus = await Leave.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const leaveSummary = {
            appliedFor: employeeAppliedForLeave.length,
            approved: leaveStatus.find(item => item._id === "Approved")?.count || 0,
            rejected: leaveStatus.find(item => item._id === "Rejected")?.count || 0,
            pending: leaveStatus.find(item => item._id === "Pending")?.count || 0,
        };

        return res.status(200).json({
            success: true,
            totalEmployees,
            totalDepartments,
            totalSalary: salaries[0]?.totalSalary || 0,
            leaveSummary
        });

    } catch (error) {
        console.error("Error in getSummary:", error);
        return res.status(500).json({ 
            success: false, 
            error: "Dashboard summary error",
            message: error.message 
        });
    }
};

export { getSummary };
