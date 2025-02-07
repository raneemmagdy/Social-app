import mongoose from "mongoose";


const commentSchema= new mongoose.Schema({
       content: {
            type: String,
            required: [true, 'Content is required'],
            minLength: [3, 'Content must be at least 3 characters long'],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User is required']
        },
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            required: [true, 'Post Id is required']
        },
        commentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        },
        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        media:[ {
            public_id:String,
            secure_url:String
        }],
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref:'User'
        }],
       
        isDeleted: {
            type: Boolean
        }
},{timestamps:true,
    toJSON:{virtuals:true},toObject:{virtuals:true},

    virtuals:{
     reply:{
        options:{
            ref:'Comment',
            localField:'_id',
            foreignField:'commentId'
        }
     }
}
})

export const commentModel= mongoose.models.Comment||mongoose.model('Comment',commentSchema)