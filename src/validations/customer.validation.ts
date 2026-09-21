import Joi from "joi";

const createBooking = {
    params: Joi.object().keys({
        tenantId: Joi.string().required()
    }),
    body: Joi.object().keys({
        name: Joi.string().required(),
        phone: Joi.string().pattern(/^\d+$/).required(),
        email: Joi.string().email().required(),
        serviceId: Joi.number().required(),
        date: Joi.date().iso().required()
    })
};

const confirmBooking = {
    params: Joi.object().keys({
        tenantId: Joi.string().required(),
        bookingId: Joi.number().required()
    }),
    body: Joi.object().keys({
        email: Joi.string().email().required(),
        code: Joi.string().length(6).pattern(/^\d+$/).required()
    })
};

const getMe = {
    params: Joi.object().keys({
        tenantId: Joi.string().required()
    })
};

const updateMe = {
    params: Joi.object().keys({
        tenantId: Joi.string().required()
    }),
    body: Joi.object()
        .keys({
            name: Joi.string(),
            email: Joi.string().email()
        })
        .min(1)
};

const getBookings = {
    params: Joi.object().keys({
        tenantId: Joi.string().required()
    })
};

const cancelBooking = {
    params: Joi.object().keys({
        tenantId: Joi.string().required(),
        bookingId: Joi.number().required()
    })
};

const rescheduleBooking = {
    params: Joi.object().keys({
        tenantId: Joi.string().required(),
        bookingId: Joi.number().required()
    }),
    body: Joi.object().keys({
        date: Joi.date().iso().required()
    })
};

export default {
    createBooking,
    confirmBooking,
    getMe,
    updateMe,
    getBookings,
    cancelBooking,
    rescheduleBooking
};