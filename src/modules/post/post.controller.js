import { Router } from "express";
import authentication from "../../middleware/authentication.js";
import { asyncHandler } from "../../utils/index.js";
import validation from "../../middleware/validation.js";
import  * as postValidation from "./post.validation.js";
import * as postServices  from "./post.service.js";
import { formatOptions, multerHost, multerLocal } from "../../middleware/multer.js";

const postRouter=Router()
postRouter.post('/createPost',multerHost([...formatOptions.image,...formatOptions.video,...formatOptions.audio]).array('media',20),validation(postValidation.postValidationSchema),authentication,asyncHandler(postServices.createPost))
postRouter.patch('/updatePost/:postId',multerHost([...formatOptions.image,...formatOptions.video,...formatOptions.audio]).array('media',20),validation(postValidation.updatePostSchema),authentication,asyncHandler(postServices.updatePost))
postRouter.delete('/freezePost/:postId',validation(postValidation.idSchema),authentication,asyncHandler(postServices.freezePost))
postRouter.delete('/unfreezePost/:postId',validation(postValidation.idSchema),authentication,asyncHandler(postServices.unfreezePost))
postRouter.patch('/:postId',validation(postValidation.idSchema),authentication,asyncHandler(postServices.likeOrUnlikePost))

export default postRouter