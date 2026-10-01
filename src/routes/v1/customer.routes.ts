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

/**
 * @openapi
 * /v1/tenants/{tenantId}/customers/bookings:
 *   post:
 *     summary: Request a booking (sends a 6-digit code to the customer's email)
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, email, serviceId, date]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Tanaka
 *               phone:
 *                 type: string
 *                 description: Digits only
 *                 example: "09012345678"
 *               email:
 *                 type: string
 *                 example: tanaka@example.com
 *               serviceId:
 *                 type: integer
 *                 example: 1
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-10-15T10:00:00.000Z
 *     responses:
 *       201:
 *         description: Booking is pending and a verification code was emailed
 *         content:
 *           application/json:
 *             example:
 *               bookingId: 12
 *       400:
 *         description: Validation error
 *       404:
 *         description: Service not found in this shop
 *   get:
 *     summary: List the logged-in customer's bookings
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of bookings (empty if there are none)
 *       401:
 *         description: Please authenticate
 */

/**
 * @openapi
 * /v1/tenants/{tenantId}/customers/bookings/{bookingId}/confirm:
 *   post:
 *     summary: Confirm a booking with the emailed code (also logs the customer in)
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email:
 *                 type: string
 *                 example: tanaka@example.com
 *               code:
 *                 type: string
 *                 description: 6 digits
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Returns the confirmed booking and the customer's tokens (booking, authTokens)
 *       400:
 *         description: Validation error
 *       401:
 *         description: Customer not found, or the code is invalid or expired
 *       404:
 *         description: Booking not found
 */

/**
 * @openapi
 * /v1/tenants/{tenantId}/customers/me:
 *   get:
 *     summary: Get the logged-in customer's profile
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns the customer
 *       401:
 *         description: Please authenticate
 *   patch:
 *     summary: Update the logged-in customer's profile
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Send at least one field
 *             properties:
 *               name:
 *                 type: string
 *                 example: Tanaka Taro
 *               email:
 *                 type: string
 *                 example: tanaka.new@example.com
 *     responses:
 *       200:
 *         description: Returns the updated customer
 *       400:
 *         description: Validation error, empty body, or email already used in this shop
 *       401:
 *         description: Please authenticate
 */

/**
 * @openapi
 * /v1/tenants/{tenantId}/customers/bookings/{bookingId}/cancel:
 *   patch:
 *     summary: Cancel one of the logged-in customer's bookings
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Returns the booking with status CANCELLED
 *       400:
 *         description: Validation error
 *       401:
 *         description: Please authenticate
 *       404:
 *         description: Booking not found (or it belongs to another customer)
 */

/**
 * @openapi
 * /v1/tenants/{tenantId}/customers/bookings/{bookingId}/reschedule:
 *   patch:
 *     summary: Change the date of one of the logged-in customer's bookings
 *     tags: [Customer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-10-20T14:00:00.000Z
 *     responses:
 *       200:
 *         description: Returns the booking with the new date
 *       400:
 *         description: Validation error
 *       401:
 *         description: Please authenticate
 *       404:
 *         description: Booking not found (or it belongs to another customer)
 */