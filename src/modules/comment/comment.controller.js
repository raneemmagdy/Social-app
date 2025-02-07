import { Router } from "express";
import { formatOptions, multerHost } from "../../middleware/multer.js";
import validation from "../../middleware/validation.js";
import { asyncHandler } from "../../utils/index.js";
import authentication from "../../middleware/authentication.js";
import * as commentValidation from "./comment.validation.js"
import * as commentServices from "./comment.service.js"

const commentRouter=Router({mergeParams:true,caseSensitive:true})
commentRouter.post('/:commentId?',multerHost([...formatOptions.image,...formatOptions.video]).array('media',20),validation(commentValidation.createCommentSchema),authentication,asyncHandler(commentServices.createComment))
commentRouter.patch('/:commentId',multerHost([...formatOptions.image,...formatOptions.video]).array('media',20),validation(commentValidation.updateCommentSchema),authentication,asyncHandler(commentServices.updateComment))
commentRouter.delete('/:commentId',validation(commentValidation.freezeCommentSchema),authentication,asyncHandler(commentServices.freezeComment))


export default commentRouter