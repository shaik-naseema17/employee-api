import express from 'express'
connectToDatabase()
import salaryRouter from './routes/salary.js'
import authRouter from './routes/auth.js'
import connectToDatabase from './db/db.js';
import cors from 'cors'
import departmentRouter from './routes/department.js';
import employeeRouter from './routes/employee.js';
import settingRouter from './routes/setting.js'
import leaveRouter from './routes/leave.js'
import dashboardRouter from "./routes/dashboard.js";

const app=express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public/uploads'))
app.use('/api/auth',authRouter)
app.use('/api/department',departmentRouter);
app.use("/api/employee",employeeRouter)
app.use("/api/leave",leaveRouter)
app.use('/api/setting',settingRouter)
app.use('/api/salary',salaryRouter)
app.use('/api/dashboard',dashboardRouter)
app.listen(process.env.PORT,()=>{
    console.log(`server is running on the port ${process.env.PORT}`)
})