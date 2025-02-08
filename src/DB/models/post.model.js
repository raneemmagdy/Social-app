import mongoose from "mongoose";
export const statusOptions={
    public:'public',
    private:'private'
}
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
        ref:'User'
    }],
    media:[ {
        public_id:String,
        secure_url:String
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    }],
    userSharedPost: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    }],
    isDeleted: {
        type: Boolean
    },
    isArchived: {
        type: Boolean
    },
    status:{
        type:String,
        enum:Object.values(statusOptions),
        default:statusOptions.public
    }
}, { timestamps: true ,toJSON:{virtuals:true},toObject:{virtuals:true}
});

postSchema.virtual('comments',{
    ref:'Comment',
    foreignField:'postId',
    localField:'_id'
})

postSchema.pre('findOneAndUpdate', async function (next) {
    const update = this.getUpdate();

    
    if (update.isDeleted) {
     
        await mongoose.model('Comment').updateMany(
            { postId: this.getQuery()._id }, 
            { $set: { isDeleted: true } }    
        );
    }
   
    next();
});

export const postModel = mongoose.models.Post || mongoose.model('Post', postSchema);
