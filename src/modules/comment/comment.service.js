import { commentModel, postModel } from "../../DB/models/index.js";
import { roleOptions } from "../../middleware/authorization.js";
import cloudinary from "../../utils/Cloudinary/index.js";


//-------------------------------------------------createComment
export const createComment = async (req, res, next) => {
  
  const {postId,commentId}=req.params
  const post = await postModel.findById(postId)
  if(commentId){
    const comment= await commentModel.findById(commentId)
    if(!comment){
      return next(new Error('Comment Not Found',{cause:404}))
    }
    if(comment.isDeleted){
      return next(new Error('Comment already Deleted',{cause:400}))
    }
    if(comment.postId!=postId){
      return next(new Error('Comment does not belong to the specified post', { cause: 400 }));
    }
  }

  if(!post){
    return next(new Error('Post Not Found',{cause:404}))
  }
  if(post.isDeleted){
    return next(new Error('Post already Deleted',{cause:400}))
  }
  if(req.files.length){
    const mediaPaths=[]
    
    for (const file of req.files) {
       const {public_id,secure_url}= await cloudinary.uploader.upload(file.path,{
        folder:'socialApp/comments',
        resource_type:'auto'
       })
        mediaPaths.push({public_id,secure_url})
        
    }
    req.body.media= mediaPaths
  }

  const comment = await commentModel.create({...req.body,postId,commentId,createdBy:req.user._id})
  return res.status(200).json({
      message: 'Comment Created Successfully',
      comment
  });
};

//-------------------------------------------------updateComment
export const updateComment = async (req, res, next) => {
  const {postId,commentId}=req.params
  const comment = await commentModel.findById(commentId).populate([
    {path:'postId'}
  ])

  if (!comment) {
    return next(new Error('Comment not found', { cause: 404 }));
  }
  if (comment.isDeleted) {
    return next(new Error('Comment has already been deleted', { cause: 400 }));
  }
  if(comment.postId.isDeleted){
    return next(new Error('Post Not Found',{cause:404}))
  }
  if (comment.postId._id.toString() !== postId.toString()) {
    return next(new Error('Comment does not belong to the specified post', { cause: 400 }));
  }

  if (
    comment.createdBy.toString() !== req.user._id.toString() &&
    req.user.role !== roleOptions.admin
  ) {
    return next(new Error('Unauthorized to update this comment', { cause: 403 }));
  }

 
  if(req.files.length){
    
    const mediaPaths=[]
    for (const file of comment.media) {
        await cloudinary.uploader.destroy(file.public_id)
    }
    for (const file of req.files) {
       const {public_id,secure_url}= await cloudinary.uploader.upload(file.path,{
        folder:'socialApp/comments',
        resource_type:'auto'
       })
        mediaPaths.push({public_id,secure_url})
        
    }
    req.body.media= mediaPaths
  }
  const newComment= await commentModel.findByIdAndUpdate({_id:commentId},{...req.body},{new:1})
 
  return res.status(200).json({
      message: 'Comment Updated Successfully',
      comment:newComment
  });
};
//-------------------------------------------------freezeComment
export const freezeComment = async (req, res, next) => {
    const { postId, commentId } = req.params;
    const comment = await commentModel.findById(commentId).populate('postId');

    if (!comment) {
        return next(new Error('Comment not found', { cause: 404 }));
    }
    if (comment.isDeleted) {
        return next(new Error('Comment has already been deleted', { cause: 400 }));
    }
    if (comment.postId.isDeleted) {
        return next(new Error('Post not found', { cause: 404 }));
    }
    if (comment.postId._id.toString() !== postId.toString()) {
        return next(new Error('Comment does not belong to the specified post', { cause: 400 }));
    }

    if (
        comment.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== roleOptions.admin &&
        comment.postId.createdBy.toString() !== req.user._id.toString()
    ) {
        return next(new Error('Unauthorized to freeze this comment', { cause: 403 }));
    }


    const frozenComment = await commentModel.findByIdAndUpdate(
        commentId, 
        { isDeleted: true,deletedBy:req.user._id }, 
        { new: true }
    );

    return res.status(200).json({
        message: 'Comment frozen successfully',
        comment: frozenComment
    });
};
