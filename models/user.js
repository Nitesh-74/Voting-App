const mongoose=require("mongoose");
const bcrypt=require("bcrypt");


const userSchema=new mongoose.Schema({
      name:{
        type:String,
        required:true
      },
      age:{
        type:Number,
        required:true,
      },
      email:{
        type:String,
      },
      mobile:{
        type:String,
      },
      address:{
        type:String,
        required:true,
      },
      adharCardNumber:{
        type:Number,
        required:true,
        unique:true
      },
      password:{
        type:String,
        required:true,
      },
      role:{
        type:String,
        enum:["voter","admin"],
        default:"voter"
      },
      isVoted:{
        type:Boolean,
        default:false
      }

})

userSchema.pre('save', async function(next){
            const user=this;
            // hash the password only if it has been modified (or is new)
            if(!user.isModified('password')) return next();

            try {
              const salt=await bcrypt.genSalt(10);
              const hashpassword= bcrypt.hash(user.password,salt);
              user.password=hashpassword
              next();
            } catch (error) {
              return next(error)
            }
})

userSchema.methods.comparePassword=async function(candidatePassword){
  try {
    
    const isMatch=await bcrypt.compare(candidatePassword,this.password)
    return isMatch;
  } catch (error) {
    throw error
  }
}



const User=mongoose.model('User',userSchema);
module.exports=User

