import { graphql, GraphQLBoolean, GraphQLEnumType, GraphQLID, GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";
const mediaObj= new GraphQLObjectType({
    name: "userMedia",
    fields: {
      secure_url: { type: GraphQLString },
      public_id: { type: GraphQLString },
    }
})
export const getOneUserType=new GraphQLObjectType({
    name:"getOneUserType",
    fields:{
        name:{type:GraphQLString},
        email:{type:GraphQLString},
        password:{type:GraphQLString},
        phone:{type:GraphQLString},
        gender:{type:new GraphQLEnumType({
            name:'gender',
            values:{
                female:{type:GraphQLString},
                male:{type:GraphQLString}
            }
        })},
        confirmed:{type:GraphQLBoolean},
        role:{type:new GraphQLEnumType({
            name:'role',
            values:{
                user:{type:GraphQLString},
                admin:{type:GraphQLString}
            }
        })},
        profileImage:{type:mediaObj},
        coverImages:{type:new GraphQLList(mediaObj)},
        friends:{type:new GraphQLList(GraphQLID)},
        friendRequests:{type:new GraphQLList(GraphQLID)},
        blockedUsers:{type:new GraphQLList(GraphQLID)},
        profileViews:{type:new GraphQLList(new GraphQLObjectType({
            name:'profileViews',
            fields:{
                viewedAt:{type:new GraphQLList(GraphQLString)},
                viewerId:{type:GraphQLID},
            }
        }))},
    }
})

export const getAllUserType=new GraphQLList(getOneUserType)