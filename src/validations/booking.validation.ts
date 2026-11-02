import Joi from "joi";

const getBookings = {
  query: Joi.object().keys({
    limit: Joi.number().integer().max(100).min(1).default(20),
    page: Joi.number().integer().min(1).default(1)
  })
};


export default {
    getBookings
}