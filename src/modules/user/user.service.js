import {OAuth2Client} from 'google-auth-library'
import  { userModel,providerOptions, postModel } from '../../DB/models/index.js';
import { roleOptions } from '../../middleware/authorization.js';
import * as module from '../../utils/index.js';
import cloudinary from '../../utils/Cloudinary/index.js';
import { decodedToken, tokenTypes } from '../../middleware/authentication.js';


//------------------------------------------------signInWithGmail
export const signInWithGmail=async(req,res,next)=>{

    const {idToken}=req.body
    const client = new OAuth2Client();

    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.CLIENT_ID,  
        })
    const payload=ticket.getPayload()
    return payload
    }

 const userData=await verify()
 const {email_verified,name,email,picture}=userData
 if(!email_verified){
    return next(new Error('Email is invalid',{cause:400}))
 }
 let user= await userModel.findOne({email})
 if(!user){
    user= await userModel.create({email,name,confirmed:true,provider:providerOptions.google,profileImage:picture})
 }
 if(user.provider!=providerOptions.google){
    return next(new Error('invalid provider,please Log In With in System',{cause:400}))
 }
 const accessToken= await module.GenerateToken({payload:{email,id:user._id},JWT_SECRET:user.role==roleOptions.user?process.env.ACCESS_JWT_SECRET_USER:process.env.ACCESS_JWT_SECRET_ADMIN,option:{ expiresIn: '1h' }})
 const refreshToken= await module.GenerateToken({payload:{email,id:user._id},JWT_SECRET:user.role==roleOptions.user?process.env.REFRESH_JWT_SECRET_USER:process.env.REFRESH_JWT_SECRET_ADMIN,option:{ expiresIn: '1w' }})

 return res.status(201).json({message:'Done',Tokens:{accessToken,refreshToken}})
}

//------------------------------------------------signUp
export const signUp=async(req,res,next)=>{
   const {name,email,password,gender,phone,provider}=req.body
   if(await userModel.findOne({email})){
      return next(new Error('Email Already Exist',{cause:409}))
   }
   const users = await userModel.find({}, { phone: 1 });
   for (const user of users) {
       const decryptedPhone =await module.Decrypt({key:user.phone,SECRET_KEY:process.env.SECRET_KEY_PHONE}); 
       if (decryptedPhone === phone) {
         return next(new Error('Phone Already Exist',{cause:409}))
       }
   }
   let pathsForCoverImages=[]
   let pathForProfileImage={}
   if(req?.files){


    if (req?.files?.coverImages) {
      for (const file of req.files.coverImages) {
          const { public_id, secure_url } = await cloudinary.uploader.upload(file.path, {
              folder: 'socialApp/users',
          });
          pathsForCoverImages.push({ public_id, secure_url });
      }
     }
  
    if (req?.files?.profileImage) {
          const { public_id, secure_url } = await cloudinary.uploader.upload(req.files.profileImage[0].path, {
           folder: 'socialApp/users',
          });
           pathForProfileImage = { public_id, secure_url };
     }
   }
   console.log('Body:', req.body);
   console.log('Files:', req.files);
   console.log(pathsForCoverImages);
   console.log(pathForProfileImage);

   const hashPassword= await module.Hash({key:password,SALT_ROUND:process.env.SALT_ROUND})
   const encryptPhone= await module.Encrypt({key:phone,SECRET_KEY:process.env.SECRET_KEY_PHONE})
   module.emailEvent.emit('sendEmailConfirm',{name,email})
   const user= await userModel.create({name,email,password:hashPassword,phone:encryptPhone,gender,provider,profileImage:pathForProfileImage,coverImages:pathsForCoverImages})
   return res.status(201).json({message:"User Created Successfully...",user})
   

}

//------------------------------------------------confirmEmail
export const confirmEmail=async(req,res,next)=>{
   const {email,otp}=req.body
   const user =await userModel.findOne({email})
   if(!user){
      return next(new Error('Email Not Exist',{cause:404}))
   }
   if (user.confirmed) {
      return next(new Error('Email Already Confirmed', { cause: 400 }));
   }
   const isBanned =await  module.checkIfBanned(user);
   if (isBanned) {
      return next(new Error('You are temporarily banned for 5 minutes.. Please try again later.', { cause: 403 }));
   }
   const isOtpExpired = await module.checkOtpExpiration(user);
   if (isOtpExpired) {
      module.emailEvent.emit('sendEmailConfirm',{name:user.name,email})
      return next(new Error('OTP Expired,New OTP Send Using Email ', { cause: 400 }));
   }
   
   const compareOtp = await module.Compare({ key: otp, encryptedKey: user.otpEmail });

   if (!compareOtp) {
     const attemptsExceeded = await module.handleFailedAttempt(user); 
     if (attemptsExceeded.isBanned) {
       return next(
         new Error('Too many failed attempts. You are temporarily banned for 5 minutes.', { cause: 403 })
       );
     }
     
     return next(new Error(`Invalid OTP. You have ${attemptsExceeded.remainingAttempts} attempts remaining.`, { cause: 400 }));
   }

   await userModel.updateOne(
      { email: user.email },
      {
        confirmed: true ,$unset: { otpEmail: 0, otpCreatedAt: 0, failedAttempts: 0, banExpiry: 0 },
      }
    );
   return res.status(200).json({message:"Email Confirmed Successfully..."})
}

//------------------------------------------------signIn
export const signIn=async(req,res,next)=>{

   const { email, phone, password, idToken } = req.body;
   if (idToken) {
       return await signInWithGmail(req, res, next);
   }
   let user = null
   if(email) user=await userModel.findOne({ email });

   if(!user&&phone){
      const users = await userModel.find({}, { phone: 1 });
      for (const userInfo of users) {
          const decryptedPhone =await module.Decrypt({key:userInfo.phone,SECRET_KEY:process.env.SECRET_KEY_PHONE}); 
          if (decryptedPhone === phone) {
            user = await userModel.findById(userInfo._id); 
            break;
          }
      }
   }
   
   if (!user) {
       return next(new Error('Invalid Email/Phone or Password', { cause: 400 }));
   }
   if (user.provider!=providerOptions.application) {
      return next(new Error('please log in with google', { cause: 400 }));
   }
   if (!user.confirmed) {
      return next(new Error('Email not Confirmed yet', { cause: 400 }));
   }
   if(!await module.Compare({key:password,encryptedKey:user.password})){
      return next(new Error('invalid Email Or Password',{cause:400}))
   }
   if (user.twoStepVerification) {
     

      module.emailEvent.emit("2FA-OTP", { name: user.name, email: user.email });

      return res.status(200).json({ message: "2-step verification OTP sent to your email." });
    }
    const accessToken= await module.GenerateToken({payload:{email,id:user._id},JWT_SECRET:user.role==roleOptions.user?process.env.ACCESS_JWT_SECRET_USER:process.env.ACCESS_JWT_SECRET_ADMIN,option:{ expiresIn: '1h' }})
    const refreshToken= await module.GenerateToken({payload:{email,id:user._id},JWT_SECRET:user.role==roleOptions.user?process.env.REFRESH_JWT_SECRET_USER:process.env.REFRESH_JWT_SECRET_ADMIN,option:{ expiresIn: '1w' }})
   
   return res.status(200).json({message:"User loged In Successfully...",user, tokens:{accessToken,refreshToken}})
}

//------------------------------------------------refreshToken
export const refreshTokenCheck=async(req,res,next)=>{
   const {authorization}=req.body
   const user= await decodedToken({authorization,tokenType:tokenTypes.refresh,next})
   if (user.changedPasswordAt) {
      const tokenIssuedAt = payload.iat ; 
      const changedPasswordAt = parseInt(user.changedPasswordAt.getTime()/1000);
      console.log(tokenIssuedAt);
      console.log(changedPasswordAt);

   
      if (tokenIssuedAt <=changedPasswordAt) {
          return next(new Error('Password was updated after this token was issued. Please log in again.', { cause: 403 }));
      }
   }
   const accessToken= await module.GenerateToken({payload:{email:user.email,id:user._id},JWT_SECRET:user.role==roleOptions.user?process.env.ACCESS_JWT_SECRET_USER:process.env.ACCESS_JWT_SECRET_ADMIN,option:{ expiresIn: '1h' }})
   const refreshToken= await module.GenerateToken({payload:{email:user.email,id:user._id},JWT_SECRET:user.role==roleOptions.user?process.env.REFRESH_JWT_SECRET_USER:process.env.REFRESH_JWT_SECRET_ADMIN,option:{ expiresIn: '1w' }})
  
   return res.status(200).json({message:"Done",user, tokens:{accessToken,refreshToken}})
}


//------------------------------------------------forgetPassword
export const forgetPassword=async(req,res,next)=>{
   const {email}=req.body
   const user =await userModel.findOne({email})
   if(!user){
      return next(new Error('invalid Email',{cause:400}))
   }
   if(user.isDeleted){
      return next(new Error('Account has been deleted', { cause: 400 }));
   }
   module.emailEvent.emit('sendEmailForgetPassword',{name:user.name,email})
   return res.status(200).json({message:"OTP send Successfully..."})
}

//------------------------------------------------resetPassword
export const resetPassword=async(req,res,next)=>{
   const {email,otp,newPassword,cNewPassword}=req.body
   const user =await userModel.findOne({email})
   if(!user){
      return next(new Error('invalid Email',{cause:400}))
   }
   if(user.isDeleted){
      return next(new Error('Account has been deleted', { cause: 400 }));
   }
   const hashPassword= await module.Hash({key:newPassword,SALT_ROUND:process.env.SALT_ROUND})
   const isOtpExpired =await module.checkOtpExpiration(user);


   const isBanned =await module.checkIfBanned(user);
   if (isBanned) {
      return next(new Error('You are temporarily banned for 5 minutes.. Please try again later.', { cause: 403 }));
   }
   if (isOtpExpired) {
      module.emailEvent.emit('sendEmailForgetPassword',{name:user.name,email})
      return next(new Error('OTP Expired,New OTP Send Using Email ', { cause: 400 }));
      
   }

   const compareOtp = await module.Compare({ key: otp, encryptedKey: user.otpPassword });
   if (!compareOtp) {
     const attemptsExceeded = await module.handleFailedAttempt(user); 
     if (attemptsExceeded.isBanned) {
       return next(
         new Error('Too many failed attempts. You are temporarily banned for 5 minutes.', { cause: 403 })
       );
     }
     return next(new Error(`Invalid OTP. You have ${attemptsExceeded.remainingAttempts} attempts remaining.`, { cause: 400 }));
   }
   await userModel.updateOne(
      { email: user.email },
      {
       password: hashPassword ,
       $unset: { otpPassword: 0, otpCreatedAt: 0, failedAttempts: 0, banExpiry: 0 },
      }
    );
   return res.status(200).json({message:"Password reset successfully"})
}




//------------------------------------------------blockUser
export const blockUser = async (req, res, next) => {
   const blockerId = req.user._id; 
   const blockedEmail = req.body.email; 

     const blockedUser = await userModel.findOne({ email: blockedEmail });
     if (req.user.email === blockedEmail) {
      return next(new Error( 'You cannot block yourself',{cause:409}))
     }

     if (!blockedUser) {
      return next(new Error( 'User not found',{cause:404}))
     }
 
    
     const blocker = await userModel.findById(blockerId);
     
     if (blocker.blockedUsers.includes(blockedUser._id)) {
      return next(new Error( 'User is already blocked',{cause:409}))
     }
 

     blocker.blockedUsers.push(blockedUser._id);
 
     await blocker.save();
 
     res.status(200).json({ message: 'User successfully blocked' });
  
};



//------------------------------------------------enableTwoStepVerification
export const enableTwoStepVerification =  async (req, res, next) => {
   const userId = req.user._id; 
   const user = await userModel.findById(userId);
 
   if (!user) return next(new Error("User not found", { cause: 404 }));
   if(user.isDeleted){
     return next(new Error('Account has been deleted', { cause: 400 }));
   }
 
   if(user.twoStepVerification){
      return next(new Error("Two-step verification is already enabled for this account", { cause: 400 }));
   }
 
   module.emailEvent.emit('2FA-OTP', { name: user.name, email: user.email });
 
   return res.status(200).json({ message: "OTP sent to your email. Please verify to enable 2FA." });
};



//------------------------------------------------verifyTwoStepVerification
export const verifyTwoStepVerification = async (req, res, next) => {

     const { otp } = req.body;
     const userId = req.user._id; 
     const user = await userModel.findById(userId);
 
     if (!user) return next(new Error("User not found", { cause: 404 }));
     if (!user.twoStepOTP) return next(new Error("No OTP generated for this user", { cause: 400 }));
 
     if (await module.checkOtpExpiration(user)) {
       return next(new Error("OTP expired. Please generate a new one.", { cause: 400 }));
     }
 
     const isOtpValid = await module.Compare({ key: otp, encryptedKey: user.twoStepOTP });
     if (!isOtpValid) return next(new Error("Invalid OTP", { cause: 400 }));
     await userModel.updateOne(
      { email: user.email },
      {
         twoStepVerification: true ,
         $unset: { twoStepOTP: 0,otpCreatedAt:0},
      }
    );

 
     res.status(200).json({ message: "2-step verification enabled successfully." });
  
 };

//------------------------------------------------loginConfirmation
export const loginConfirmation = async (req, res, next) => {
   const { email, otp } = req.body; 
 
  
   const user = await userModel.findOne({ email });
 
   if (!user) return next(new Error("User not found", { cause: 404 }));
   if (!user.twoStepOTP) return next(new Error("No OTP generated for this user", { cause: 400 }));
 
 
   if (await module.checkOtpExpiration(user)) {
     return next(new Error("OTP expired. Please log in again.", { cause: 400 }));
   }
 
   const isOtpValid = await module.Compare({ key: otp, encryptedKey: user.twoStepOTP });
   if (!isOtpValid) return next(new Error("Invalid OTP", { cause: 400 }));
 
   
   await userModel.updateOne(
     { email: user.email },
     {
       $unset: { twoStepOTP: 0, otpCreatedAt: 0 },
     }
   );
 
  
   const accessToken= await module.GenerateToken({payload:{email,id:user._id},JWT_SECRET:user.role==roleOptions.user?process.env.ACCESS_JWT_SECRET_USER:process.env.ACCESS_JWT_SECRET_ADMIN,option:{ expiresIn: '1h' }})
   const refreshToken= await module.GenerateToken({payload:{email,id:user._id},JWT_SECRET:user.role==roleOptions.user?process.env.REFRESH_JWT_SECRET_USER:process.env.REFRESH_JWT_SECRET_ADMIN,option:{ expiresIn: '1w' }})

   res.status(200).json({
     message: "2-step verification successful. Logged in successfully.",
     tokens: { accessToken, refreshToken },
   });
};


//------------------------------------------------updateProfile
export const updateProfile=async(req,res,next)=>{
   const { name, gender, phone } = req.body;
   const userId = req.user._id;

 
   const user = await userModel.findById(userId);
   if (!user) {
     return next(new Error('User Not Found', { cause: 404 }));
   }
   if (user.isDeleted) {
     return next(new Error('Account has been deleted', { cause: 400 }));
   }

   let encryptedPhone = null;
   if (phone) {
    
     const users = await userModel.find({}, { phone: 1 });
     for (const user of users) {
       const decryptedPhone = await module.Decrypt({ key: user.phone, SECRET_KEY: process.env.SECRET_KEY_PHONE });
       if (decryptedPhone === phone) {
         return next(new Error('Phone Already Exists', { cause: 409 }));
       }
     }
     encryptedPhone = await module.Encrypt({ key: phone, SECRET_KEY: process.env.SECRET_KEY_PHONE });
   }


       let pathsForCoverImages = user.coverImages || [];
       let pathForProfileImage = user.profileImage || {};

       if (req.files?.coverImages) {
           for (const file of user.coverImages) {
               if (file.public_id) await cloudinary.uploader.destroy(file.public_id);
           }
           pathsForCoverImages = [];
           for (const file of req.files.coverImages) {
               const { public_id, secure_url } = await cloudinary.uploader.upload(file.path, {
                   folder: 'socialApp/users',
               });
               pathsForCoverImages.push({ public_id, secure_url });
           }
       }

       if (req.files?.profileImage) {
           if (user.profileImage?.public_id) await cloudinary.uploader.destroy(user.profileImage.public_id);
           const { public_id, secure_url } = await cloudinary.uploader.upload(req.files.profileImage[0].path, {
               folder: 'socialApp/users',
           });
           pathForProfileImage = { public_id, secure_url };
       }
 
   const updatedUser = await userModel.findByIdAndUpdate(
     userId,
     {
       name,
       gender,
       phone: encryptedPhone,
       coverImages: pathsForCoverImages,
       profileImage: pathForProfileImage,
     },
     { new: true }
   );

   return res.status(200).json({ message: 'Profile Updated Successfully', user: updatedUser });
}
//------------------------------------------------updatePassword
export const updatePassword=async(req,res,next)=>{
   const {oldPassword,newPassword}=req.body
   const user =await userModel.findById({_id:req.user._id})
   if(!user){
      return next(new Error('User Not Found',{cause:404}))
   }
   if(user.isDeleted){
      return next(new Error('Account has been deleted', { cause: 400 }));
   }
   
   if(! await module.Compare({key:oldPassword,encryptedKey:user.password})){
      return next(new Error('Invalid Old Password', { cause: 400 }));
        
   }
 
   const hashPassword= await module.Hash({key:newPassword,SALT_ROUND:process.env.SALT_ROUND})
   const updatedUser = await userModel.findByIdAndUpdate(
      user._id,
      {
       password:hashPassword,
       changedPasswordAt:Date.now()
      },
      { new: true }
    );
 
   return res.status(200).json({message:"Password Updated successfully",user:updatedUser})
}

//------------------------------------------------shareProfile
export const shareProfile = async (req, res, next) => {
  const viewerId = req.user._id;
  const profileId = req.params.profileId;

  const profileUser = await userModel.findById(profileId);
  if (!profileUser) {
    return res.status(404).json({ message: "User not found" });
  }
  if (profileUser.isDeleted) {
    return next(new Error("Account has been deleted", { cause: 400 }));
  }
  if (profileUser.blockedUsers.includes(viewerId)) {
    return res
      .status(403)
      .json({ message: "You are blocked from viewing this profile" });
  }

  if (viewerId.toString() === profileId) {
    const user = await userModel
      .findById(viewerId)
      .select("name email phone gender profileImage");
    const decryptedPhone = await module.Decrypt({
      key: user.phone,
      SECRET_KEY: process.env.SECRET_KEY_PHONE,
    });
    user.phone = decryptedPhone;
    return res.status(200).json({ message: "Done", user });
  }

  const viewerExist = profileUser.profileViews.find(
    (viewer) => viewer.viewerId.toString() === viewerId.toString()
  );
  // console.log(viewerExist);

  if (viewerExist) {
    viewerExist.viewedAt.push(Date.now());
    if (viewerExist.viewedAt.length > 5) { 
      viewerExist.viewedAt = viewerExist.viewedAt.slice(-5);
      if (viewerExist.viewedAt.length === 5) {
        const formattedViewTimes = viewerExist.viewedAt
        .map((date) => date.toLocaleString())
        
       console.log(formattedViewTimes);
       
       module.emailEvent.emit('sendEmailForViews',{name:profileUser.name,email:profileUser.email,viewerId,viewTimes:formattedViewTimes})
      }
    }
  } else {
    profileUser.profileViews.push({ viewerId, viewedAt: [Date.now()] });
  }

  await profileUser.save();
  
  res.status(200).json({ message: "Profile viewed successfully", user:profileUser });
};

//------------------------------------------------updateEmail
export const updateEmail=async(req,res,next)=>{
  const { email} = req.body;
 

  const user = await userModel.findOne({email});
  if (user) {
    return next(new Error('Email  Already Exist', { cause: 409 }));
  }
  await userModel.updateOne({_id:req.user._id},{tempEmail:email})
  module.emailEvent.emit('sendEmailConfirm',{name:req.user.name,email:req.user.email})
  module.emailEvent.emit('sendEmailConfirmForNewEmail',{name:req.user.name,email,id:req.user._id})
  
  
  
  return res.status(200).json({ message: 'OTPs Sent Successfully' });
}
//------------------------------------------------replaceEmail
export const replaceEmail=async(req,res,next)=>{

  const { oldCode,newCode} = req.body;
  const user = await userModel.findById({_id:req.user._id});
  if (!user) {
    return next(new Error('User Not Found', { cause: 404 }));
  }
  if(user.isDeleted){
    return next(new Error('Account has been deleted', { cause: 400 }));
  }
 
 if(!await module.Compare({ key: oldCode, encryptedKey: user.otpEmail })){
  return next(new Error('Invalid Old Code', { cause: 400 }));
 }
 if(!await module.Compare({ key: newCode, encryptedKey: user.otpNewEmail })){
  return next(new Error('Invalid New Code', { cause: 400 }));
 }
 await userModel.updateOne({_id:user._id},{email:user.tempEmail,changedPasswordAt:Date.now(),$unset:{otpNewEmail:0,otpEmail:0,tempEmail:0}})

  return res.status(200).json({ message: 'Email Replaced Successfully' });
}




//-------------------------------------------------sendFriendRequest

export const sendFriendRequest = async (req, res,next) => {

  const { friendId } = req.params;
  const userId = req.user._id;

  const friend = await userModel.findById(friendId);
  if (!friend) return next(new Error('User not found',{cause:404}))

  if (friend.friendRequests.includes(userId)) {
      return next(new Error("Friend request already sent",{cause:400}))
  }
  if (friend.friends.includes(userId)) {
      return next(new Error("User is already a friend",{cause:400}))
  }
  friend.friendRequests.push(userId);
  await friend.save();
  module.emailEvent.emit("sendEmailFriendRequest",{email:friend.email,friendName:req.user.name,name:friend.name})
  return res.status(200).json({ message: "Friend request sent successfully" });

};
//-------------------------------------------------acceptFriendRequest

export const acceptFriendRequest = async (req, res,next) => {

const { requesterId } = req.params;
const userId = req.user._id;

const user = await userModel.findById(userId);
const requester = await userModel.findById(requesterId);

if (!user || !requester) return next(new Error('User not found',{cause:404}))


if (!user.friendRequests.includes(requesterId)) {
  return next(new Error('No friend request from this user',{cause:400}))
}

user.friendRequests = user.friendRequests.filter(id => id.toString() !== requesterId);
user.friends.push(requesterId);
requester.friends.push(userId);

await user.save();
await requester.save();

return res.status(200).json({ message: "Friend request accepted successfully" });

};

//-------------------------------------------------rejectFriendRequest

export const rejectFriendRequest = async (req, res, next) => {
  const { requesterId } = req.params;
  const userId = req.user._id;
  const user = await userModel.findById(userId);
  const requester = await userModel.findById(requesterId);
  if (!user || !requester) {
      return next(new Error('User or requester not found', { cause: 404 }));
  }
  if (!user.friendRequests.includes(requesterId)) {
      return next(new Error('No friend request from this user', { cause: 400 }));
  }
  user.friendRequests = user.friendRequests.filter(id => id.toString() !== requesterId);
 
  await user.save();

  return res.status(200).json({ message: 'Friend request rejected successfully' });
};


//------------------------------------------------dashboard
export const dashboard=async(req,res,next)=>{
  const data=await Promise.all([ 
    userModel.find(),
    postModel.find()
 ])
 return res.status(200).json({message:"Done",data})
}



//------------------------------------------------updateRole
export const updateRole=async(req,res,next)=>{
  const {userId}= req.params
  const {role}=req.body
  const data=req.user.role==='superAdmin'?{role:{$nin:[roleOptions.superAdmin]}}:
  {role:{$nin:[roleOptions.superAdmin,roleOptions.admin]}}
  const user= await userModel.findByIdAndUpdate({_id:userId,isDeleted:false,...data},{
     role,
     updatedBy:req.user._id
  },{new:1})

  if(!user){
    
    return next(new Error("Account has been deleted Or User Not Found", { cause: 400 }));
  }
 return res.status(200).json({message:"Role Updated Successfully",user})
}



