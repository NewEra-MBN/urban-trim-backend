import Joi from "joi";
import { password } from "./custom.validation.js";

const createTenant = {
    body: {
        tenantName:Joi.string().required(),
        name: Joi.string().required(),
        email:Joi.string().required(),
        password:Joi.string().required().custom(password)
    }
}



const updateTenant = {
    params: Joi.object().keys({
        tenantId: Joi.string().required()
    }),
    body: Joi.object()
        .keys({
            name: Joi.string(),
            email:Joi.string().email()
        })
}



export default {
    createTenant,
    updateTenant
}