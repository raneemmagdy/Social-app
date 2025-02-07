import { Router } from "express";
import authentication from "../../middleware/authentication.js";
import { asyncHandler } from "../../utils/index.js";
import validation from "../../middleware/validation.js";
import  * as postValidation from "./post.validation.js";
import * as postServices  from "./post.service.js";
import { formatOptions, multerHost, multerLocal } from "../../middleware/multer.js";
import commentRouter from "../comment/comment.controller.js";

const postRouter=Router()

postRouter.use('/:postId/comments',commentRouter)
postRouter.post('/createPost',multerHost([...formatOptions.image,...formatOptions.video,...formatOptions.audio]).array('media',20),validation(postValidation.postValidationSchema),authentication,asyncHandler(postServices.createPost))
postRouter.patch('/updatePost/:postId',multerHost([...formatOptions.image,...formatOptions.video,...formatOptions.audio]).array('media',20),validation(postValidation.updatePostSchema),authentication,asyncHandler(postServices.updatePost))
postRouter.delete('/freezePost/:postId',validation(postValidation.idSchema),authentication,asyncHandler(postServices.freezePost))
postRouter.delete('/unfreezePost/:postId',validation(postValidation.idSchema),authentication,asyncHandler(postServices.unfreezePost))
postRouter.patch('/:postId',validation(postValidation.idSchema),authentication,asyncHandler(postServices.likeOrUnlikePost))
postRouter.get('/',authentication,asyncHandler(postServices.getPosts))
postRouter.get('/public',authentication,asyncHandler(postServices.getPublicUserPosts));
postRouter.get('/friends',authentication,asyncHandler(postServices.getFriendsPublicPosts));
postRouter.get('/user/:userId',asyncHandler(postServices.getUserPublicPosts));

postRouter.delete('/soft-delete/:postId',validation(postValidation.idSchema),authentication,asyncHandler(postServices.softDeletePost))
postRouter.delete('/:postId',validation(postValidation.idSchema),authentication,asyncHandler(postServices.undoPost))
postRouter.delete('/archived/:postId',validation(postValidation.idSchema),authentication,asyncHandler(postServices.archivePost))


export default postRouter