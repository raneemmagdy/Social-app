import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
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
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    tags: [{
        type: mongoose.Schema.Types.ObjectId,
    }],
    media:[ {
        public_id:String,
        secure_url:String
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
    }],
    userSharedPost: [{
        type: mongoose.Schema.Types.ObjectId,
    }],
    isDeleted: {
        type: Boolean
    }
}, { timestamps: true });

export const postModel = mongoose.models.Post || mongoose.model('Post', postSchema);
