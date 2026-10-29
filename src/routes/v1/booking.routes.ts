import { Router } from "express";
import auth from "../../middlewares/authUser.js"
import bookingControllers from "../../controllers/booking.controller.js";

const router = Router();

router.get('/', auth("view_all_appointments"), bookingControllers.getAllBookings);



export default router;