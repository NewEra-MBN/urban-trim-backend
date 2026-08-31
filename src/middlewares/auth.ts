import passport from "passport";
import httpStatus from 'http-status'
import { User } from "../../generated/prisma/client.js";
import { ApiError } from "../utils/ApiError.js";
import { Request, Response, NextFunction } from "express";
import { Permissions } from "../config/role.js";
import rolePermissions from "../config/role.js";

const verifyCallback = (
  req: any,
  resolve: (value?: unknown) => void,
  reject: (value?: unknown) => void,
  requiredRights: Permission[]
) =>
  async (err: unknown, user: User | false, info: unknown) => {
    if (err || info || !user) {
      return reject(new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate"));
    }

    req.user = user;

    const userPermissions = rolePermissions[user.role as Role] ?? [];

    const hasRequiredRights =
      requiredRights.length === 0 ||
      requiredRights.every((right) => (userPermissions as readonly Permission[]).includes(right));

    if (!hasRequiredRights) {
      return reject(new ApiError(httpStatus.FORBIDDEN, "Forbidden"));
    }

    resolve();
  };






const auth =
  (...requiredRights: Permissions[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    return new Promise((resolve, reject) => {
      passport.authenticate(
        'jwt',
        { session: false },
        verifyCallback(req, resolve, reject, requiredRights)
      )(req, res, next);
    })
      .then(() => next())
      .catch((err) => next(err));
  };

export default auth;
