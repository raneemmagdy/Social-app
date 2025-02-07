import Joi from "joi";
import { generalRules } from "../../utils/index.js";

//-------------------------------------------------createCommentSchema
export const createCommentSchema = Joi.object({
    content: Joi.string()
        .min(3)
        .required()
        .messages({
            'string.base': 'Content should be a type of text',
            'string.empty': 'Content cannot be an empty field',
            'string.min': 'Content should have a minimum length of 3 characters',
            'any.required': 'Content is required'
        }),
    postId:generalRules.ObjectId.required(),
    commentId:generalRules.ObjectId,
    media: Joi.array()
            .items(
              Joi.object({
                public_id: Joi.string().required(),
                secure_url: Joi.string().uri().required(),
              })
            )
            .optional().default([]),
});
//-------------------------------------------------updateCommentSchema
export const updateCommentSchema = Joi.object({
    content: Joi.string()
        .min(3)
        .messages({
            'string.min': 'Content should have a minimum length of 3 characters',
        }),
    postId:generalRules.ObjectId.required(),
    commentId:generalRules.ObjectId.required(),
    media: Joi.array()
            .items(
              Joi.object({
                public_id: Joi.string().required(),
                secure_url: Joi.string().uri().required(),
              })
            )
            .optional().default([]),
});
//-------------------------------------------------freezeCommentSchema
export const freezeCommentSchema = Joi.object({

    postId:generalRules.ObjectId.required(),
    commentId:generalRules.ObjectId.required(),
  
});
