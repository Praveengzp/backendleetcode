const redisClient = require("../config/redis");
const User =  require("../models/user")
const validate = require('../utils/validator');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const Submission = require("../models/submission")

const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;
const authCookieOptions = {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    maxAge: 60 * 60 * 1000
};

const clearAuthCookieOptions = {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    expires: new Date(0)
};

const createAuthResponse = (user, token) => ({
    user: {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
        role: user.role,
    },
    token
});

const getTokenFromRequest = (req) => {
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.split(" ")[1];
    }

    return cookieToken;
};


const register = async (req,res)=>{
    
    try{
        // validate the data;

      validate(req.body); 
      const {firstName, emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
      req.body.role = 'user'
    //
    
     const user =  await User.create(req.body);
     const token =  jwt.sign({_id:user._id , emailId:emailId, role:'user'},process.env.JWT_KEY,{expiresIn: 60*60});
     res.cookie('token',token,authCookieOptions);
     res.status(201).json({
        ...createAuthResponse(user, token),
        message:"Registered Successfully"
    })
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}


const login = async (req,res)=>{

    try{
        const {emailId, password} = req.body;

        if(!emailId)
            throw new Error("Invalid Credentials");
        if(!password)
            throw new Error("Invalid Credentials");

        const user = await User.findOne({emailId});

        if(!user)
            throw new Error("Invalid Credentials");

        const match = await bcrypt.compare(password,user.password);

        if(!match)
            throw new Error("Invalid Credentials");

        const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
        res.cookie('token',token,authCookieOptions);
        res.status(201).json({
            ...createAuthResponse(user, token),
            message:"Loggin Successfully"
        })
    }
    catch(err){
        res.status(401).send("Error: "+err);
    }
}


// logOut feature

const logout = async(req,res)=>{

    try{
        const token = getTokenFromRequest(req);
        if(!token)
            throw new Error("Token is not persent");

        const payload = jwt.decode(token);


        await redisClient.set(`token:${token}`,'Blocked');
        await redisClient.expireAt(`token:${token}`,payload.exp);
    //    Token add kar dung Redis ke blockList
    //    Cookies ko clear kar dena.....

    res.clearCookie("token",clearAuthCookieOptions);
    res.send("Logged Out Succesfully");

    }
    catch(err){
       res.status(503).send("Error: "+err);
    }
}


const adminRegister = async(req,res)=>{
    try{
        // validate the data;
    //   if(req.result.role!='admin')
    //     throw new Error("Invalid Credentials");  
      validate(req.body); 
      const {firstName, emailId, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
    //
    
     const user =  await User.create(req.body);
     const token =  jwt.sign({_id:user._id , emailId:emailId, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
     res.cookie('token',token,authCookieOptions);
     res.status(201).json({
        ...createAuthResponse(user, token),
        message:"User Registered Successfully"
    });
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}

const deleteProfile = async(req,res)=>{
  
    try{
       const userId = req.result._id;
      
    // userSchema delete
    await User.findByIdAndDelete(userId);

    // Submission se bhi delete karo...
    
    // await Submission.deleteMany({userId});
    
    res.status(200).send("Deleted Successfully");

    }
    catch(err){
      
        res.status(500).send("Internal Server Error");
    }
}


module.exports = {register, login,logout,adminRegister,deleteProfile};
