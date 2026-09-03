import { Tenant } from "../../generated/prisma/client.js";
import Joi from "joi";
import { password } from "./custom.validation.js";

const getTenant = {
    params: Joi.object().keys({
        tenantId: Joi.string()
    })
}
const updateTenant = {
    params: Joi.object().keys({
        tenantId: Joi.string()
    }),
    body: Joi.object()
        .keys({
            email: Joi.string().email(),
            name:Joi.string()
        })
            .min(1)
}


const deleteTenant = {
    params: Joi.object({
        tenantId: Joi.string()
    })
}


export default{
    getTenant,
    updateTenant,
    deleteTenant
}