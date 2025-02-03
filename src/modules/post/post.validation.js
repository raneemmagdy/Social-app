import Joi from "joi";
import { generalRules } from "../../utils/index.js";
//-------------------------------------------------CreatePostschema
export const postValidationSchema = Joi.object({
    content: Joi.string()
        .min(3)
        .required()
        .messages({
            'string.base': 'Content should be a type of text',
            'string.empty': 'Content cannot be an empty field',
            'string.min': 'Content should have a minimum length of 3 characters',
            'any.required': 'Content is required'
        }),
    media: Joi.array()
            .items(
              Joi.object({
                public_id: Joi.string().required(),
                secure_url: Joi.string().uri().required(),
              })
            )
            .optional().default([]),
});

//-------------------------------------------------updatePostSchema
export const updatePostSchema = Joi.object({
    content: Joi.string()
        .min(3)
        .messages({
            'string.base': 'Content should be a type of text',
            'string.empty': 'Content cannot be an empty field',
            'string.min': 'Content should have a minimum length of 3 characters',
            'any.required': 'Content is required'
        }),
     postId: generalRules.ObjectId.required().messages({
            'any.required': 'postId is required'
        }),
    media: Joi.array()
            .items(
              Joi.object({
                public_id: Joi.string().required(),
                secure_url: Joi.string().uri().required(),
              })
            )
            .optional(),
});


//-------------------------------------------------freezePostSchema
export const idSchema = Joi.object({
    postId: generalRules.ObjectId.required().messages({
            'any.required': 'postId is required'
    }),
});
