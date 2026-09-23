import { describe, it, expect, vi, beforeEach } from "vitest";
import httpStatus from "http-status";
import { ApiError } from "../utils/ApiError.js";

// fake the database
vi.mock("../client.js", () => ({
    default: {
        service:  { findFirst: vi.fn() },
        customer: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
        booking:  { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() }
    }
}));

// fake the OTP email step
vi.mock("../services/customer.service.ts/customer.auth.services.js", () => ({
    default: { requestOtp: vi.fn() }
}));

const prisma = (await import("../client.js")).default;
const { createBookingRequest } =
    (await import("../services/customer.service.ts/customer.services.js")).default;

beforeEach(() => {
    vi.clearAllMocks();
});

const body = {
    name: "Test Customer",
    phone: "09012345678",
    email: "test@example.com",
    serviceId: 2,                                  // this service belongs to salon B
    date: new Date("2026-10-01T10:00:00.000Z")
};

describe("createBookingRequest — tenant isolation", () => {
    it("refuses a service that belongs to another tenant", async () => {
        // salon A has no service with id 2, so the lookup finds nothing
        vi.mocked(prisma.service.findFirst as any).mockResolvedValue(null);

        await expect(createBookingRequest("salon-A", body)).rejects.toMatchObject(
            new ApiError(httpStatus.NOT_FOUND, "Service not found")
        );

        expect(prisma.service.findFirst).toHaveBeenCalledWith({
            where: { id: 2, tenantId: "salon-A" }
        });
        expect(prisma.booking.create).not.toHaveBeenCalled();
        expect(prisma.customer.create).not.toHaveBeenCalled();
    });
});