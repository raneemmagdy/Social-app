import { Router } from "express";
import validation from "../../middleware/validation.js";
import { asyncHandler } from "../../utils/index.js";
import * as userValidation from './user.validation.js'
import * as userServices from './user.service.js'
import { formatOptions, multerHost, multerLocal } from "../../middleware/multer.js";
import authentication from "../../middleware/authentication.js";

const userRouter=Router()
userRouter.post('/signInWithGmail',validation(userValidation.signInWithGmailSchema),asyncHandler(userServices.signInWithGmail))
userRouter.post('/signup',multerHost(...formatOptions.image).fields([{name:"profileImage",maxCount:1},{name:"coverImages",maxCount:3}]),validation(userValidation.signUpSchema),asyncHandler(userServices.signUp))
userRouter.patch('/confirmEmail',validation(userValidation.confirmSchema),asyncHandler(userServices.confirmEmail))
userRouter.post('/signin',validation(userValidation.signInSchema),asyncHandler(userServices.signIn))
userRouter.get('/refreshToken',validation(userValidation.refreshTokenSchema),asyncHandler(userServices.refreshTokenCheck))
userRouter.patch('/forgetPassword',validation(userValidation.emailSchema),asyncHandler(userServices.forgetPassword))
userRouter.patch('/resetPassword',validation(userValidation.resetPasswordSchema),asyncHandler(userServices.resetPassword))
userRouter.patch('/updatePassword',validation(userValidation.updatePasswordSchema),authentication,asyncHandler(userServices.updatePassword))
userRouter.patch('/updateEmail',validation(userValidation.emailSchema),authentication,asyncHandler(userServices.updateEmail))
userRouter.patch('/replaceEmail',validation(userValidation.replaceEmailSchema),authentication,asyncHandler(userServices.replaceEmail))
userRouter.patch('/updateProfile',multerHost(...formatOptions.image).fields([{name:"profileImage",maxCount:1},{name:"coverImages",maxCount:3}]),validation(userValidation.updateProfileSchema),authentication,asyncHandler(userServices.updateProfile))
userRouter.get('/profile/:profileId/view', validation(userValidation.shareProfilesSchema),authentication, asyncHandler(userServices.shareProfile))
userRouter.post('/blockUser', validation(userValidation.emailSchema),authentication,asyncHandler(userServices.blockUser));
userRouter.post('/enableTwoStepVerification',authentication,asyncHandler(userServices.enableTwoStepVerification));
userRouter.patch('/verifyTwoStepVerification',validation(userValidation.verifyTwoStepVerificationSchema),authentication,asyncHandler(userServices.verifyTwoStepVerification));
userRouter.post('/loginConfirmation',validation(userValidation.confirmSchema),asyncHandler(userServices.loginConfirmation));



export default userRouter