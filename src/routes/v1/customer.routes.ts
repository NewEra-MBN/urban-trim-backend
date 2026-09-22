import { Router } from "express";
import validate from "../../middlewares/validate.js";
import customerValidation from "../../validations/customer.validation.js";
import customerController from "../../controllers/customer.controller.js";
import customerAuth from "../../middlewares/authCustomer.js";

const router = Router({mergeParams: true});

//--- public --//

router.post(
    "/bookings",
    validate(customerValidation.createBooking),
    customerController.createBooking
)


router.post(
    "/bookings/:bookingId/confirm",
    validate(customerValidation.confirmBooking),
    customerController.confirmBooking
)


//--privates --//

router
    .route("/me")
    .get(customerAuth, validate(customerValidation.getMe), customerController.getMe)
    .patch(customerAuth, validate(customerValidation.updateMe), customerController.updateMe)


router.get(
    "/bookings",
    customerAuth,
    validate(customerValidation.getBookings),
    customerController.getBooking
)

router.patch("/bookings/:bookingId/cancel", customerAuth, validate(customerValidation.cancelBooking), customerController.cancelBooking)


router.patch("/bookings/:bookingId/reschedule", customerAuth, validate(customerValidation.rescheduleBooking), customerController.rescheduleBooking)

export default router;