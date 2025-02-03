import { EventEmitter } from "events";
import sedEmailByNodeMailer from "../../services/sendEmail.js";
import { emailTemplate } from "../../services/emailTemplate.js";
import { customAlphabet } from "nanoid";
import { userModel } from "../../DB/models/index.js";
import { Hash } from "../Encryption/hash.js";
export const emailEvent = new EventEmitter();

emailEvent.on("sendEmailConfirm", async (data) => {
  let { name, email } = data;
  const otp = customAlphabet('0123456789',4)();
  const hashOtp= await Hash({key:otp,SALT_ROUND:process.env.SALT_ROUND})
  await userModel.updateOne({email},{otpEmail:hashOtp})
  const success=await sedEmailByNodeMailer(
    "Confime Email",
    emailTemplate("Confime Email",name,
     `<p>Thank you for joining <strong>Social Media</strong>! Use the code below to verify your email address:</p>
      <div class="otp-box">${otp}</div>
      <p>If you didn’t request this, please ignore this email or contact support if you have questions.</p>
      <p>Best,<br>The Social Media Team</p>`
    ),
    email
  );
  success? await userModel.updateOne({email},{otpCreatedAt:Date.now()}): next(new Error('Error in Sending Email...'))
  
});
emailEvent.on("sendEmailConfirmForNewEmail", async (data) => {
  let { name, email,id } = data;
  const otp = customAlphabet('0123456789',4)();
  const hashOtp= await Hash({key:otp,SALT_ROUND:process.env.SALT_ROUND})
  await userModel.updateOne({tempEmail:email,_id:id},{otpNewEmail:hashOtp})
  const success=await sedEmailByNodeMailer(
    "Confime Email",
    emailTemplate("Confime Email",name,
     `<p>Thank you for joining <strong>Social Media</strong>! Use the code below to verify your New email address:</p>
      <div class="otp-box">${otp}</div>
      <p>If you didn’t request this, please ignore this email or contact support if you have questions.</p>
      <p>Best,<br>The Social Media Team</p>`
    ),
    email
  );
  success? await userModel.updateOne({email},{otpCreatedAt:Date.now()}): next(new Error('Error in Sending Email...'))
  
});



emailEvent.on("sendEmailForgetPassword", async (data) => {
  let { name, email } = data;
  const otp = customAlphabet('0123456789',4)();
  const hashOtp= await Hash({key:otp,SALT_ROUND:process.env.SALT_ROUND})
  await userModel.updateOne({email},{otpPassword:hashOtp})
  const success=await sedEmailByNodeMailer(
    "Forget Password Email",
    emailTemplate("Forget Password",name,
      `<p>Hi ${name},</p>
         <p>We received a request to reset the password for your account. Use the code below to reset your password:</p>
         <div class="otp-box">${otp}</div>
         <p>If you didn’t request this, please ignore this email or contact support if you have any concerns.</p>
         <p>Best regards,<br>The Social Media Team</p>`
    ),
    email
  );
  success? await userModel.updateOne({email},{otpCreatedAt:Date.now()}): next(new Error('Error in Sending Email...'))
  
});

emailEvent.on("2FA-OTP", async (data) => {
  let { name, email } = data;
  const otp = customAlphabet('0123456789',4)();
  const hashOtp= await Hash({key:otp,SALT_ROUND:process.env.SALT_ROUND})
  await userModel.updateOne({email},{twoStepOTP:hashOtp})
  const success=await sedEmailByNodeMailer(
    "2FA OTP",
    emailTemplate("2FA OTP",name,
      `
      <p>Hi ${name},</p>
      <p>We received a request for 2-step verification on your account. Use the code below to verify your identity:</p>
      <div class="otp-box" style="font-size: 18px; font-weight: bold; margin: 10px 0;">${otp}</div>
      <p>If you didn’t request this, please ignore this email or contact support if you have any concerns.</p>
      <p>Best regards,<br>The Social Media Team</p>
    `
    ),
    email
  );
  success? await userModel.updateOne({email},{otpCreatedAt:Date.now()}): next(new Error('Error in Sending Email...'))
  
});




emailEvent.on("sendEmailForViews", async (data) => {
  let { name, email,viewTimes,viewerId } = data;
  const user = await userModel.findById({_id:viewerId})
  const success=await sedEmailByNodeMailer(
    'Profile Viewed 5 Times',
    emailTemplate("Profile Viewed 5 Times",name,
      `
        <h3> ${user.name} has viewed your account 5 times at these time periods: ${viewTimes}</h3>
      `
    ),
    email
  );
  if( !success) next(new Error('Error in Sending Email...'))
  
});