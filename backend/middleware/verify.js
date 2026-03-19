const jwt=require("jsonwebtoken")
require('dotenv').config();
const user = require("../models/user");
const redisClient=require('../config/redis')

const verifyToken= async (req,res,next)=>{
   
    try{
          
     const token = req.cookies.token;

    if(!token)
    return res.status(401).send("Access Denied. No token present.")

    const decoded= jwt.verify(token,process.env.JWT_KEY)

    const userData= await user.findOne({email:decoded.email})

    if(!userData)
    return res.status(401).send("User not found.")

     const IsBlocked = await redisClient.exists(`token:${token}`);

    if(IsBlocked)
     throw new Error("Invalid Token");

    req.user=userData;

    next();
    }
    catch(err){
       res.status(401).send("Invalid token: "+ err.message)
    }
    
    

}

module.exports=verifyToken;