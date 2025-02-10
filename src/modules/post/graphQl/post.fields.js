import { GraphQLID, GraphQLNonNull } from "graphql";
import * as postType from "./post.types.js";
import * as postResolve from "./post.resolve.js";

export const postQuery={
    getOnePostById:{
        type:postType.getOnePostType,
        args:{
            id:{type:new GraphQLNonNull(GraphQLID)}
        },
        resolve:postResolve.getOnePost
    },
    getAllPost:{
        type:postType.getAllPostsType,
        resolve:postResolve.getAllPosts
    }
}