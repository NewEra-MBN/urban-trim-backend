import { describe, it, expect, vi, beforeEach } from "vitest";
import httpStatus from "http-status";
import { ApiError } from "../utils/ApiError.js";
import { TokenType, OwnerType } from "../../generated/prisma/client.js";

vi.mock("../client.js", () => ({
    default: {
        token: {
            findFirst: vi.fn(),
            delete: vi.fn(),
            deleteMany: vi.fn()
        },
        superAdmin: {
            update: vi.fn()
        }
    }
}));

vi.mock("../services/superAdmin.services.js", () => ({
    default: {
        getSuperAdminByEmail: vi.fn(),
        getSuperAdminById: vi.fn()
    }
}));

vi.mock("../utils/encryption.js", () => ({
    encryptPassword: vi.fn(),
    isPasswordMatch: vi.fn()
}));

vi.mock("../services/token.service.js", () => ({
    default: {
        verifyToken: vi.fn(),
        generateAuthTokens: vi.fn()
    }
}));

const prisma = (await import("../client.js")).default;
const superAdminServices = (await import("../services/super-admin-services/superAdmin.services.js")).default;
const tokenService = (await import("../services/token.service.js")).default;
const { encryptPassword, isPasswordMatch } = await import("../utils/encryption.js");
const {
    loginSuperAdminWithEmailandPassword,
    logout,
    refreshAuth,
    resetPassword
} = (await import("../services/super-admin-services/superAdmin.auth.services.js")).default;

const superAdmin = {
    id: "admin-1",
    name: "Admin",
    email: "admin@example.com",
    password: "hashed-password",
    createdAt: new Date(),
    updatedAt: new Date()
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("loginSuperAdminWithEmailandPassword", () => {
    it("returns the superAdmin when credentials are valid", async () => {
        vi.mocked(superAdminServices.getSuperAdminByEmail).mockResolvedValue(superAdmin as any);
        vi.mocked(isPasswordMatch).mockResolvedValue(true);

        const result = await loginSuperAdminWithEmailandPassword(superAdmin.email, "plain-password");

        expect(superAdminServices.getSuperAdminByEmail).toHaveBeenCalledWith(superAdmin.email);
        expect(result).toEqual(superAdmin);
    });

    it("throws when superAdmin is not found", async () => {
        vi.mocked(superAdminServices.getSuperAdminByEmail).mockResolvedValue(null);

        await expect(
            loginSuperAdminWithEmailandPassword(superAdmin.email, "plain-password")
        ).rejects.toMatchObject(new ApiError(httpStatus.UNAUTHORIZED, "incorrect email or password"));
    });

    it("throws when the password does not match", async () => {
        vi.mocked(superAdminServices.getSuperAdminByEmail).mockResolvedValue(superAdmin as any);
        vi.mocked(isPasswordMatch).mockResolvedValue(false);

        await expect(
            loginSuperAdminWithEmailandPassword(superAdmin.email, "wrong-password")
        ).rejects.toMatchObject(new ApiError(httpStatus.UNAUTHORIZED, "incorrect email or password"));
    });
});

describe("logout", () => {
    it("deletes the refresh token when found", async () => {
        const tokenData = { id: "token-1" };
        vi.mocked(prisma.token.findFirst).mockResolvedValue(tokenData as any);

        await logout("refresh-token");

        expect(prisma.token.findFirst).toHaveBeenCalledWith({
            where: { token: "refresh-token", type: TokenType.REFRESH, blacklisted: false }
        });
        expect(prisma.token.delete).toHaveBeenCalledWith({ where: { id: "token-1" } });
    });

    it("throws when the token is not found", async () => {
        vi.mocked(prisma.token.findFirst).mockResolvedValue(null);

        await expect(logout("refresh-token")).rejects.toMatchObject(
            new ApiError(httpStatus.NOT_FOUND, "Token not found")
        );
        expect(prisma.token.delete).not.toHaveBeenCalled();
    });
});

describe("refreshAuth", () => {
    it("rotates the refresh token and returns new auth tokens", async () => {
        const refreshTokenData = { id: "token-1", ownerId: "admin-1" };
        const authTokens = { access: {}, refresh: {} } as any;
        vi.mocked(tokenService.verifyToken).mockResolvedValue(refreshTokenData as any);
        vi.mocked(tokenService.generateAuthTokens).mockResolvedValue(authTokens);

        const result = await refreshAuth("refresh-token");

        expect(prisma.token.delete).toHaveBeenCalledWith({ where: { id: "token-1" } });
        expect(tokenService.generateAuthTokens).toHaveBeenCalledWith(OwnerType.SUPERADMIN, "admin-1");
        expect(result).toBe(authTokens);
    });

    it("throws ApiError when token verification fails", async () => {
        vi.mocked(tokenService.verifyToken).mockRejectedValue(new Error("invalid"));

        await expect(refreshAuth("bad-token")).rejects.toMatchObject(
            new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate")
        );
    });
});

describe("resetPassword", () => {
    it("updates the password and clears reset tokens", async () => {
        const resetTokenData = { id: "reset-1", ownerId: "admin-1" };
        vi.mocked(tokenService.verifyToken).mockResolvedValue(resetTokenData as any);
        vi.mocked(superAdminServices.getSuperAdminById).mockResolvedValue(superAdmin as any);
        vi.mocked(encryptPassword).mockResolvedValue("new-hashed-password");

        await resetPassword("reset-token", "new-password");

        expect(prisma.superAdmin.update).toHaveBeenCalledWith({
            where: { id: superAdmin.id },
            data: { password: "new-hashed-password" }
        });
        expect(prisma.token.deleteMany).toHaveBeenCalledWith({
            where: { ownerId: resetTokenData.ownerId, type: TokenType.RESET_PASSWORD }
        });
    });

    it("throws ApiError when the superAdmin no longer exists", async () => {
        const resetTokenData = { id: "reset-1", ownerId: "admin-1" };
        vi.mocked(tokenService.verifyToken).mockResolvedValue(resetTokenData as any);
        vi.mocked(superAdminServices.getSuperAdminById).mockResolvedValue(null);

        await expect(resetPassword("reset-token", "new-password")).rejects.toMatchObject(
            new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate")
        );
        expect(prisma.superAdmin.update).not.toHaveBeenCalled();
    });
});
