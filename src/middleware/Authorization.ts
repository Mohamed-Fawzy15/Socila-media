import { NextFunction, Request, Response } from "express";
import { RoleType } from "./../utils/interfaces";
import { AppError } from "../utils/classError";

export const Authorization = ({
  accessRole = [],
}: {
  accessRole: RoleType[];
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!accessRole.includes(req.user?.role!)) {
      throw new AppError("unauthorized", 403);
    }
    next();
  };
};
