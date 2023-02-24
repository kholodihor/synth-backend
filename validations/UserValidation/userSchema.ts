import Joi from 'joi'

export const userSchema = {
   registerUser:Joi.object({
    username:Joi.string().required(),
    email:Joi.string().email().required(),
    password:Joi.string().required()
   }),
   loginUser:Joi.object({
    email:Joi.string().email().required(),
    password:Joi.string().required()
   }),
  editUser:Joi.object({
    username:Joi.string(),
    avatarUrl:Joi.string()
   }),
}