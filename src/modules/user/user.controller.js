import { Router } from "express";
import validation from "../../middleware/validation.js";
import { asyncHandler } from "../../utils/index.js";
import * as userValidation from './user.validation.js'
import * as userServices from './user.service.js'
import { formatOptions, multerHost } from "../../middleware/multer.js";
import authentication from "../../middleware/authentication.js";
import authorization, { roleOptions } from "../../middleware/authorization.js";

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
userRouter.post('/friends/request/:friendId', authentication, asyncHandler(userServices.sendFriendRequest)); 
userRouter.post('/friends/accept/:requesterId', authentication,asyncHandler(userServices.acceptFriendRequest) ); 
userRouter.post('/friends/reject/:requesterId', authentication,asyncHandler(userServices.rejectFriendRequest) ); 
userRouter.get('/dashboard', authentication,authorization([roleOptions.admin,roleOptions.superAdmin]),asyncHandler(userServices.dashboard) ); 
userRouter.patch('/updateRole/:userId', validation(userValidation.updateRoleSchema),authentication,authorization([roleOptions.admin,roleOptions.superAdmin]),asyncHandler(userServices.updateRole) ); 

export default userRouter