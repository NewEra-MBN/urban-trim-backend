import catchAsync from "../utils/catchAsync.js";
import bookingService from "../services/booking.service.js";

const getAllBookings = catchAsync(async (req, res)=> {
   const tenantId = req.user!.tenantId;
   const {page, limit} = req.query as unknown as {page: number, limit: number};
   const result = await bookingService.getBookings({tenantId, page, limit});
   res.status(200).send(result);
});

export default {
   getAllBookings
};