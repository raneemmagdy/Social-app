import { postModel } from "../../../DB/models/index.js"

export const getOnePost=async(parent,args)=>{
    const {id}=args
    const post =await postModel.findById(id).populate([{path:'createdBy'}])
    return post
  }
export const getAllPosts=async()=>{
    const posts =await postModel.find().populate([{path:'createdBy'}])
    return posts
}