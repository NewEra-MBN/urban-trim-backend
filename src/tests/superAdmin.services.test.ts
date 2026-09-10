import { describe, it, expect, vi, beforeEach } from "vitest";
import httpStatus from "http-status";
import { ApiError } from "../utils/ApiError.js";

vi.mock("../client.js", () => ({
    default: {
        superAdmin: {
            findUnique: vi.fn(),
            update: vi.fn()
        }
    }
}));

const prisma = (await import("../client.js")).default;
const {
    getSuperAdminById,
    getSuperAdminByEmail,
    updateSuperAdminById
} = (await import("../services/superAdmin.services.js")).default;

const superAdmin = {
    id: "admin-1",
    name: "Admin",
    email: "admin@example.com",
    createdAt: new Date(),
    updatedAt: new Date()
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("getSuperAdminById", () => {
    it("selects the default fields when no keys are given", async () => {
        vi.mocked(prisma.superAdmin.findUnique).mockResolvedValue(superAdmin as any);

        const result = await getSuperAdminById(superAdmin.id);

        expect(prisma.superAdmin.findUnique).toHaveBeenCalledWith({
            where: { id: superAdmin.id },
            select: { id: true, email: true, createdAt: true, updatedAt: true }
        });
        expect(result).toEqual(superAdmin);
    });

    it("selects only the requested fields", async () => {
        vi.mocked(prisma.superAdmin.findUnique).mockResolvedValue({ id: superAdmin.id } as any);

        await getSuperAdminById(superAdmin.id, ["id"]);

        expect(prisma.superAdmin.findUnique).toHaveBeenCalledWith({
            where: { id: superAdmin.id },
            select: { id: true }
        });
    });

    it("returns null when no superAdmin is found", async () => {
        vi.mocked(prisma.superAdmin.findUnique).mockResolvedValue(null);

        const result = await getSuperAdminById("missing-id");

        expect(result).toBeNull();
    });
});

describe("getSuperAdminByEmail", () => {
    it("selects the default fields when no keys are given", async () => {
        vi.mocked(prisma.superAdmin.findUnique).mockResolvedValue(superAdmin as any);

        const result = await getSuperAdminByEmail(superAdmin.email);

        expect(prisma.superAdmin.findUnique).toHaveBeenCalledWith({
            where: { email: superAdmin.email },
            select: { id: true, email: true, createdAt: true, updatedAt: true }
        });
        expect(result).toEqual(superAdmin);
    });

    it("returns null when no superAdmin is found", async () => {
        vi.mocked(prisma.superAdmin.findUnique).mockResolvedValue(null);

        const result = await getSuperAdminByEmail("missing@example.com");

        expect(result).toBeNull();
    });
});

describe("updateSuperAdminById", () => {
    it("throws NOT_FOUND when the superAdmin does not exist", async () => {
        vi.mocked(prisma.superAdmin.findUnique).mockResolvedValue(null);

        await expect(
            updateSuperAdminById(superAdmin.id, { name: "New Name" })
        ).rejects.toMatchObject(new ApiError(httpStatus.NOT_FOUND, "superAdmin not found"));
        expect(prisma.superAdmin.update).not.toHaveBeenCalled();
    });

    it("throws BAD_REQUEST when the new email is already taken", async () => {
        vi.mocked(prisma.superAdmin.findUnique)
            .mockResolvedValueOnce(superAdmin as any) // getSuperAdminById check
            .mockResolvedValueOnce({ id: "other-admin" } as any); // getSuperAdminByEmail check

        await expect(
            updateSuperAdminById(superAdmin.id, { email: "taken@example.com" })
        ).rejects.toMatchObject(new ApiError(httpStatus.BAD_REQUEST, "Email already taken"));
        expect(prisma.superAdmin.update).not.toHaveBeenCalled();
    });

    it("updates the superAdmin when the email is free", async () => {
        vi.mocked(prisma.superAdmin.findUnique)
            .mockResolvedValueOnce(superAdmin as any) // getSuperAdminById check
            .mockResolvedValueOnce(null); // getSuperAdminByEmail check
        vi.mocked(prisma.superAdmin.update).mockResolvedValue({ id: superAdmin.id, email: "new@example.com" } as any);

        const result = await updateSuperAdminById(superAdmin.id, { email: "new@example.com" });

        expect(prisma.superAdmin.update).toHaveBeenCalledWith({
            where: { id: superAdmin.id },
            data: { email: "new@example.com" },
            select: { id: true, email: true }
        });
        expect(result).toEqual({ id: superAdmin.id, email: "new@example.com" });
    });

    it("updates without an email check when the email is unchanged", async () => {
        vi.mocked(prisma.superAdmin.findUnique).mockResolvedValueOnce(superAdmin as any);
        vi.mocked(prisma.superAdmin.update).mockResolvedValue(superAdmin as any);

        await updateSuperAdminById(superAdmin.id, { name: "New Name" });

        expect(prisma.superAdmin.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.superAdmin.update).toHaveBeenCalledWith({
            where: { id: superAdmin.id },
            data: { name: "New Name" },
            select: { id: true, email: true }
        });
    });
});
