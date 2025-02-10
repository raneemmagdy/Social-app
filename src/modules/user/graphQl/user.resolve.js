import { userModel } from "../../../DB/models/index.js"

export const getOneUserById=async(parent,args)=>{
    const {id}=args
    const user =await userModel.findById(id)
    return user
 }
export const getAllUsers=async(parent,args)=>{
    
    const users =await userModel.find()
    return users
 }