import { GraphQLID, GraphQLNonNull } from "graphql";
import * as userType from "./user.types.js";
import * as userResolve from "./user.resolve.js";

export const userQuery={
    getOneUserById:{
        type:userType.getOneUserType,
        args:{
            id:{type:new GraphQLNonNull(GraphQLID)}
        },
        resolve:userResolve.getOneUserById
    },
    getAllUsers:{
        type:userType.getAllUserType,
       
        resolve:userResolve.getAllUsers
    }
}