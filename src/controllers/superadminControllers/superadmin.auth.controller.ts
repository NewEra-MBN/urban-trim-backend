import catchAsync from "../../utils/catchAsync.js";

const login = catchAsync(async (req, res) => {
    const {email, password} = req.body;
})