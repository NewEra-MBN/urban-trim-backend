import { Param } from "@prisma/client/runtime/client";
import Joi from "joi";


const getAllUserByTenant = {
  params: Joi.object().keys({
    tenantId : Joi.string().required()
  }),
};


const getUserById = {
  prams: Joi.object().keys({
    userId: Joi.string().required()
  })
}


const updateUserbyId  = {
   params: Joi.object().keys({
    userId: Joi.string().required()
   }),
   body: Joi.object().keys({
      name: Joi.string(),
      email: Joi.string().email(),
      role: Joi.string(),
      isEmailVerified: Joi.boolean()
   })
   .min(1)
}

const deleteUserbyId = {
  params: Joi.object().keys({
    userId: Joi.string().required()
  })
}



export default {
  getAllUserByTenant,
  getUserById,
  updateUserbyId,
  deleteUserbyId
}