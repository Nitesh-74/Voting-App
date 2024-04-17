const express=require("express");
const router=express.Router();
const {jwtAuthMiddleware}=require('../jwt');
const Candidate = require("./../models/candidates");
const User = require("./../models/user");

const checkIsAdmin= async (userId)=>{
    try {

        const user=await User.findById(userId);
         return user.role==='admin'
    } catch (error) {
        return false
        
    }
}
router.post('/',jwtAuthMiddleware,async (req,res)=>{
    try {

        if(!await checkIsAdmin(req.user.id))
     return res.status(404).json({message:"User has not an admin role "})
 


    const data=req.body;

    const newCamdidate=new Candidate(data);
    const response= await newCamdidate.save();
    console.log("data saved")

        res.status(200).json({response: response});
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})


// update canidate

router.put("/:candidateID",jwtAuthMiddleware,async (req,res)=>{
   try {

    if(!await checkIsAdmin(req.user.id))
    return res.status(404).json({message:"User has not an admin role "})


    const  candidateID=req.params.candidateID;
    const updatedCandidateData=req.body;
    const response=await Candidate.findByIdAndUpdate(candidateID,updatedCandidateData,{
        new:true,
        runValidators:true
    })

    if(!response) return res.status(404).json({message:"Canidate not found during updation"})
     
    res.status(200).json(response)

    
   } catch (error) {
    res.send(error)
    res.status(500).json({
        success:false,
        message:"issue in the candidate data updation"
    })
   }
})


router.delete("/:candidateID",jwtAuthMiddleware,async (req,res)=>{
    try {
 
     if(!await checkIsAdmin(req.user.id))
     return res.status(404).json({message:"User has not an admin role "})
 
 
     const  candidateID=req.params.candidateID;
   
     const response=await Candidate.findByIdAndDelete(candidateID)
 
     if(!response) return res.status(403).json({message:"Canidate not found during deletion"})
      
     res.send(200).json(response)
 
     
    } catch (error) {
     res.send(error)
     res.status(500).json({
         success:false,
         message:"issue in the candidate data deletion"
     })
    }
 })


// now start voting
router.post('/votes/:candidateID',jwtAuthMiddleware,async(req,res)=>{
    // admin cant vote
    // one user one vote
   
    try {
        const candidateID=req.params.id;
        const userId=req.user.id;

        // find the candidate with specified candidateid

        const candidate=await Candidate.findById(candidateID)
        if(!candidate) return res.status(404).json({message:"candidate not found"})
        //  specified user voted to specified candidate
        const user=await User.findById(userId)
        if(!user) return res.status(404).json({message:"user not found"})
        
        if(user.isVoted) return res.status(400).json({message:"User has already voted once"})


        if(user.role==='admin') res.status(403).json({message:"admin cant vote"})

        // update the candidate document to record th vote
        candidate.votes.push({user:userId});
        candidate.voteCount++
        await candidate.save()
        
        // update the user document
        user.isVoted=true;
        await user.save()

        res.status(200).json({message:"vote added successfully"})

    } catch (error) {
        console.log(error)
        res.status(400).json({message:"error in adding votes"})
    }
})


router.get("/vote/count",jwtAuthMiddleware,async(req,res)=>{
    try {
        const candidate=await Candidate.find().sort({voteCount:"desc"});
        // map the candidate to only retutn theit their party name and vote count

       const voteRecord= candidate.map((data)=>{
            return {
                party:data.party,
                count:data.voteCount
            }
        })
        return res.status(200).json({message:"successfully counted the votes for every party"})
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"error in counting votes for a party based"})
    }
})

router.get('/', async (req, res) => {
    try {
        // Find all candidates and select only the name and party fields, excluding _id
        const candidates = await Candidate.find({}, 'name party -_id');

        // Return the list of candidates
        res.status(200).json(candidates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})


module.exports = router;