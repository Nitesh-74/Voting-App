const express=require("express");
const router=express.Router();
const User=require("./../models/user");
const {jwtAuthMiddleware,generateToken}=require('../jwt');
// const { json } = require("body-parser");

router.post('/signup',async (req,res)=>{
    try {
    const data=req.body;

    // Check if there is already an admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (data.role === 'admin' && adminUser) {
        return res.status(400).json({ error: 'Admin user already exists' });
    }


     // Validate Aadhar Card Number must have exactly 12 digit
     if (!/^\d{12}$/.test(data.aadharCardNumber)) {
        return res.status(400).json({ error: 'Aadhar Card Number must be exactly 12 digits' });
    }



    const existingUser = await User.findOne({ aadharCardNumber: data.aadharCardNumber });
    if (existingUser) {
        return res.status(400).json({ error: 'User with the same Aadhar Card Number already exists' });
    }

    const newUser=new User(data);
    const response= await newUser.save();
    console.log("data saved")

      const payload = {
            id: response.id
        }
        console.log(JSON.stringify(payload));
        const token = generateToken(payload);

        res.status(200).json({response: response, token: token});
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.post("/login", async (req,res)=>{
    try {
    const {adharCardNumber,password}=req.body;


    if (!adharCardNumber|| !password) {
        return res.status(400).json({ error: 'Aadhar Card Number and password are required' });
    }

    const user=await User.findOne({adharCardNumber:adharCardNumber});
     
    if(!user ||!(await user.comparePassword(password))){
        return res.status(401).json({error:"Invalid username and password"});
    }

     const payload={
        id:user.id
     }
    const token=generateToken(payload);
    res.send(token);

    } catch (error) {
        res.status(500).json({error:"Error during login"})
    }
    
})


router.get("/profile", jwtAuthMiddleware, async(req,res)=>{
    try {
        const userData=req.user;
        const userId=userData.id;
        const user=await User.findById(userId);
        res.status(200).json({user});
    } catch (error) {
        res.status(400).json({error:"error in getting the user profile"})
    }
   

})

// for password change

router.put("/profile/password",jwtAuthMiddleware,async (req,res)=>{
   try {
    const userId=req.user.id;

    const {currentPassword,newPassword}=req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Both currentPassword and newPassword are required' });
    }
    const user=await User.findById(userId);

    if (!user || !(await user.comparePassword(currentPassword))) {
        return res.status(401).json({ error: 'Invalid current password' });
    }


     user.password=newPassword;
     await user.save()
     console.log("password updated");
     res.status(200).json({success:true,message:"password updated"})
   } catch (error) {
    res.send(error)
    res.status(500).json({
        success:false,
        message:"issue in the password change"
    })
   }
})


module.exports = router;