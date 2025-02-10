import {GraphQLObjectType, GraphQLSchema } from "graphql";
import { postQuery } from "./post/graphQl/post.fields.js";
import { userQuery } from "./user/graphQl/user.fields.js";



export const schema=new GraphQLSchema({
    query:new GraphQLObjectType({
        name:'Query',
        fields:{
            ...postQuery,
            ...userQuery
        }
    })
})