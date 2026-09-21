import catchAsync from "../utils/catchAsync.js";
import httpStatus from 'http-status'
import customerServices from "../services/customer.service.ts/customer.services.js";

const createBooking = catchAsync(async (req, res) => {
   const tenantId = req.params.tenantId as string;
   const result = await customerServices.createBookingRequest(tenantId, req.body);
   res.status(httpStatus.CREATED).send(result)
});

const confirmBooking = catchAsync(async (req, res) => {
   const {tenantId, bookingId} = req.params as unknown as {tenantId: string, bookingId: number};
   const {email, code} = req.body;

   const result = await customerServices.confirmBooking(tenantId, bookingId, email, code);
   res.send(result)
});


const getMe = catchAsync(async (req, res) => {
   const result = await customerServices.getMe(req.customer!.id);
   res.send(result)
});


const updateMe = catchAsync(async (req, res) => {
   const result = await customerServices.updateMe(req.customer!.id, req.body)
   res.send(result)
});



const getBooking = catchAsync(async(req, res) => {
   const result = await customerServices.getBookings(req.customer!.id);
   res.send(result)
});

const cancelBooking = catchAsync(async (req, res) => {
   const {bookingId} = req.params as unknown as { bookingId: number }
   const result =await customerServices.cancelBooking(bookingId, req.customer!.id)
   res.send(result)
});


const rescheduleBooking = catchAsync(async (req, res) => {
   const {bookingId} = req.params as unknown as  {bookingId: number};
   const result = await customerServices.rescheduleBooking(bookingId, req.customer!.id, req.body)
   res.send(result)
});


export default {
   createBooking,
   confirmBooking,
   getMe,
   updateMe,
   getBooking,
   cancelBooking,
   rescheduleBooking
};