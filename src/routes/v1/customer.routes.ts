import { Router } from "express";
import validate from "../../middlewares/validate.js";
import customerValidation from "../../validations/customer.validation.js";
import bookingController from "../../controllers/booking.controller.js";

const router = Router({mergeParams: true});

//--- publid --//

router.post(
    "/bookings",
    validate(customerValidation.createBooking),
    bookingController.createBooking
)


router.post(
    "/bookings/:bookingId/confirm",
    validate(customerValidation.confirmBooking),
    bookingController.confirmBooking
)


export default router;