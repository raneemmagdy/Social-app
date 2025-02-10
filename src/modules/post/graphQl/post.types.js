import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLID,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";
import { getOneUserType } from "../../user/graphQl/user.types.js";

const mediaObj= new GraphQLObjectType({
    name: "media",
    fields: {
      secure_url: { type: GraphQLString },
      public_id: { type: GraphQLString },
    }
})
export const getOnePostType = new GraphQLObjectType({
  name: "getOnePostById",
  fields: {
    content: { type: GraphQLString },
    isDeleted: { type: GraphQLBoolean },
    isArchived: { type: GraphQLBoolean },
    likes: { type: new GraphQLList(GraphQLID) },
    deletedBy: { type: GraphQLID },
    createdBy: { type: getOneUserType },

    status: {
      type: new GraphQLEnumType({
        name: "status",
        values: {
          public: { type: GraphQLString },
          private: { type: GraphQLString },
        },
      }),
    },
    media: {
      type: new GraphQLList(mediaObj)
    },
  },
});
export const getAllPostsType=new GraphQLList(getOnePostType)