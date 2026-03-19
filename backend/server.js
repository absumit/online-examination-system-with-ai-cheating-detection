const express=require('express')
const app=express();
const main=require("./database")
const jwt=require("jsonwebtoken")
require('dotenv').config();
const cookieParser = require('cookie-parser')
const cors = require('cors')

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');

const verifyToken=require('./middleware/verify')
const authorizeRole=require('./middleware/authrole')
const redisClient=require('./config/redis')

app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))



// ============= ROUTE SETUP =============
// Auth Routes (no authentication needed)
app.use('/auth', authRoutes);

// Admin Routes (authentication + admin role required)
app.use('/admin', verifyToken, authorizeRole(['admin']), adminRoutes);

// Student Routes (authentication + student role required)
app.use('/student', verifyToken, authorizeRole(['student']), studentRoutes);

// ============= START SERVER =============

const initilizeconnection=async()=>{

   try{
         // await redisClient.connect();
        // console.log("connected to Reddis");

        // await main();
        // console.log("connected to MongoDB");

        await Promise.all([redisClient.connect(),main()]);
        console.log("DB connected");


        app.listen(process.env.PORT, ()=>{
            console.log("Listening at port 8080");
        })
   }
    catch(err){
        console.log("Error: "+err.message);
    }


}

initilizeconnection();