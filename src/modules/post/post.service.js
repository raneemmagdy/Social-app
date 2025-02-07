import { postModel, statusOptions, userModel } from "../../DB/models/index.js";
import { roleOptions } from "../../middleware/authorization.js";
import cloudinary from "../../utils/Cloudinary/index.js";
import { pagination } from "../../utils/index.js";
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

//-------------------------------------------------getPosts
export const getPosts = async (req, res, next) => {
  const { data, pageNum, limitNum, skip, totalCount, totalPages } = await pagination({
    page: req.query.page,
    model: postModel,
    populate: [
      { path: 'createdBy', select: 'name email role gender' },
      { path: 'likes', select: 'name email' },
      { path: 'comments', match: { commentId: { $exists: false } }, populate: { path: 'reply' } }
    ]
  });

  return res.status(200).json({
    message: 'Done',
    paginationInfo: {
      page: pageNum,
      limit: limitNum,
      skip,
      totalPosts: totalCount,
      totalPages
    },
    posts: data
  });
};




//-------------------------------------------------undoPost
export const undoPost = async (req, res, next) => {
    const { postId } = req.params;
    const post = await postModel.findById(postId);
    if (!post) {
      return next(new Error('Post Not Found', { cause: 404 }));
    }
    if (post.createdBy.toString() !== req.user._id.toString()) {
      return next(new Error('You are not authorized to undo this post', { cause: 403 }));
    }
    if (post.isDeleted) {
      return next(new Error('Post is already deleted', { cause: 400 }));
    }
    const postCreationTime = post.createdAt.getTime();
    const currentTime = Date.now();

    // console.log(postCreationTime);
    // console.log(currentTime);

    
    const timeDifference = currentTime - postCreationTime;
  
    if (timeDifference > 2 * 60 * 1000) {
      return next(new Error('You can only undo posts created within the last 2 minutes', { cause: 400 }));
    }
    const deletedPost = await postModel.findByIdAndUpdate(
      { _id: postId },
      { isDeleted: true, deletedBy: req.user._id },
      { new: true }
    );
  
    return res.status(200).json({
      message: 'Post undone successfully',
      post: deletedPost
    });
};

//-------------------------------------------------archivePost
export const archivePost = async (req, res, next) => {
    const { postId } = req.params;
  
    const post = await postModel.findById(postId);
  
    if (!post) {
      return next(new Error('Post Not Found', { cause: 404 }));
    }
  
    
    if (post.createdBy.toString() !== req.user._id.toString()) {
      return next(new Error('You are not authorized to archive this post', { cause: 403 }));
    }
  
    
    if (post.isDeleted) {
      return next(new Error('Post is already deleted', { cause: 400 }));
    }
    if (post.isArchived) {
      return next(new Error('Post is already archived', { cause: 400 }));
    }
  
    const postCreationTime = post.createdAt.getTime();
    const currentTime = Date.now();
    const timeDifference = currentTime - postCreationTime;
  
    if (timeDifference < 24 * 60 * 60 * 1000) {
      return next(new Error('You can only archive posts created more than 24 hours ago', { cause: 400 }));
    }
  
   
    const archivedPost = await postModel.findByIdAndUpdate(
      { _id: postId },
      { isArchived: true },
      { new: true }
    );
  
    return res.status(200).json({
      message: 'Post archived successfully',
      post: archivedPost
    });
};
  

//-------------------------------------------------getPublicUserPosts
export const getPublicUserPosts = async (req, res, next) => {
   
    const publicPosts = await postModel.find({
        createdBy: req.user._id,
        status: statusOptions.public,
        isDeleted:{$exists:false},
        isArchived:{$exists:false}
    });
  
    return res.status(200).json({
      message: 'Public posts retrieved successfully',
      posts: publicPosts
    });
};
 
//-------------------------------------------------getFriendsPublicPosts
export const getFriendsPublicPosts = async (req, res, next) => {
   
  const userId = req.user._id;
  const user = await userModel.findById(userId)
  console.log(user);
  

  if (!user) {
      return next(new Error("User not found", { cause: 404 }));
  }
  const friendIds = user.friends.map(friend => friend._id);
  console.log(friendIds);
  
  const publicPosts = await postModel.find({
      createdBy: { $in: friendIds }, 
      status: statusOptions.public, 
      isDeleted: { $ne: true } 
  }).populate("createdBy", "name email profileImage"); 

  return res.status(200).json({ message: "Public posts retrieved successfully", posts: publicPosts });
};
 
//-------------------------------------------------getUserPublicPosts
export const getUserPublicPosts = async (req, res, next) => {
   
  const { userId } = req.params;
  const user = await userModel.findById(userId);

  if (!user) {
      return next(new Error("User not found", { cause: 404 }));
  }

  const publicPosts = await postModel.find({
      createdBy: userId, 
      status: statusOptions.public, 
      isDeleted: { $exists: false } 
  }).populate("createdBy", "name email profileImage");

  return res.status(200).json({ message: "Public posts retrieved successfully", posts: publicPosts });
};
//-------------------------------------------------softDeletePost

export const softDeletePost = async (req, res, next) => {
  const { postId } = req.params;

  const post = await postModel.findById(postId);

  if (!post) {
      return next(new Error('Post not found', { cause: 404 }));
  }
  if (post.createdBy.toString() !== req.user._id.toString() && req.user.role !==roleOptions.admin ) {
    return next(new Error('You are not authorized to freeze this post', { cause: 403 }));
  }

  if (post.isDeleted) {
    return next(new Error('Post is already deleted', { cause: 400 }));
  }
 
  const updatedPost= await postModel.findByIdAndUpdate({_id:postId},{isDeleted:true,deletedBy:req.user._id},{new:1})

 

  return res.status(200).json({
      message: 'Post soft deleted successfully',
      post: updatedPost
  });
};
