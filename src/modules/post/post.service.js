import { postModel } from "../../DB/models/index.js";
import { roleOptions } from "../../middleware/authorization.js";
import cloudinary from "../../utils/Cloudinary/index.js";
//-------------------------------------------------CreatePost
export const createPost= async (req, res,next) => {
        const { content } = req.body;
        const uploadedFiles = req.files;
        const fullPaths = [];
        
        if (uploadedFiles.length) {
          for (const file of uploadedFiles) {
            const { public_id, secure_url } = await cloudinary.uploader.upload(file.path,{
                folder:'socialApp/posts',
                resource_type:'auto'
               });
            fullPaths.push({ public_id, secure_url });
          }
        }

        const newPost = await postModel.create({
            content,
            createdBy: req.user._id, 
            media:fullPaths
        });
        return res.status(201).json({
            message: 'Post created successfully',
            post: newPost
        });

    
}
//-------------------------------------------------updatePost
export const updatePost = async (req, res, next) => {
  const { postId } = req.params;
  const post = await postModel.findById(postId);

  if (!post) {
      return next(new Error('Post Not Found', { cause: 404 }));
  }

  if (post.createdBy.toString() !== req.user._id.toString()) {
      return next(new Error('You are not authorized to update this post', { cause: 403 }));
  }

  if (post.isDeleted) {
      return next(new Error('Post is deleted and cannot be updated', { cause: 400 }));
  }

  const mediaPaths = [];
 
  if (req.files.length) {
     
      for (const file of post.media) {
          await cloudinary.uploader.destroy(file.public_id);
      }

    
      for (const file of req.files) {
          const { public_id, secure_url } = await cloudinary.uploader.upload(file.path, {
              folder: 'socialApp/posts',
              resource_type: 'auto'
          });
          mediaPaths.push({ public_id, secure_url });
      }
  }

 
  const updatedPost = await postModel.findByIdAndUpdate(
      { _id: postId },
      {
          $set: {
              content: req.body.content || post.content, 
              media: mediaPaths.length ? mediaPaths : post.media, 
          }
      },{new:true}
  );


  return res.status(200).json({
      message: 'Post updated successfully',
      post: updatedPost
  });
};
//-------------------------------------------------freezePost
export const freezePost = async (req, res, next) => {
  const { postId } = req.params;

  const post = await postModel.findById({_id:postId});
  
  if (!post) {
      return next(new Error('Post Not Found', { cause: 404 }));
  }
  console.log(req.user.role);
  
  if (post.createdBy.toString() !== req.user._id.toString() && req.user.role !==roleOptions.admin ) {
      return next(new Error('You are not authorized to freeze this post', { cause: 403 }));
  }

  if (post.isDeleted) {
      return next(new Error('Post is already deleted', { cause: 400 }));
  }


  const freezePost= await postModel.findByIdAndUpdate({_id:postId},{isDeleted:true,deletedBy:req.user._id},{new:1})

 

  return res.status(200).json({
      message: 'Post freezed successfully',
      post:freezePost
  });
};
//-------------------------------------------------unfreezePost
export const unfreezePost = async (req, res, next) => {
  const { postId } = req.params;

  const post = await postModel.findById({_id:postId});
  
  if (!post) {
      return next(new Error('Post Not Found', { cause: 404 }));
  }
  if (post.deletedBy.toString()!=req.user._id.toString() ) {
      return next(new Error('You are not authorized to freeze this post', { cause: 403 }));
  }
  if (!post.isDeleted) {
      return next(new Error('Post not deleted', { cause: 400 }));
  }
  const unfreezePost= await postModel.findByIdAndUpdate({_id:postId},{$unset:{deletedBy:0,isDeleted:0}},{new:1})
  return res.status(200).json({
      message: 'Post unfreezed successfully',
      post:unfreezePost
  });
};
//-------------------------------------------------likeOrUnlikePost
export const likeOrUnlikePost = async (req, res, next) => {
  const { postId } = req.params;

  const post = await postModel.findById({_id:postId});
  
  if (!post) {
      return next(new Error('Post Not Found', { cause: 404 }));
  }
  if (post.isDeleted) {
      return next(new Error('Post is already deleted', { cause: 400 }));
  }
  let updatedPost=undefined;
  let action=undefined;

  console.log(post.likes);
  
  if(post.likes.includes(req.user._id)){
      updatedPost= await postModel.findByIdAndUpdate({_id:postId},{$pull:{likes:req.user._id}},{new:1})
      action='Unlike'
  }else{
     updatedPost= await postModel.findByIdAndUpdate({_id:postId},{$addToSet:{likes:req.user._id}},{new:1})
     action='Like'

  }
  
  return res.status(200).json({
      message: action,
      post:updatedPost
  });
};


