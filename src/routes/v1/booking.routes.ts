import { Router } from "express";
import auth from "../../middlewares/authUser.js"
import bookingControllers from "../../controllers/booking.controller.js";
import bookingValidation from "../../validations/booking.validation.js";
import validate from "../../middlewares/validate.js";

const router = Router();

router.get('/', auth("view_all_appointments"), validate(bookingValidation.getBookings),  bookingControllers.getAllBookings);



export default router;