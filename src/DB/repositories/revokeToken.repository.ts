import { HydratedDocument, Model } from "mongoose";
import { IRevokeToken, IUser } from "../../utils/interfaces";
import { DbRepository } from "./db.repository";
import { AppError } from "../../utils/classError";

export class RevokeTokenRepository extends DbRepository<IRevokeToken> {
  constructor(protected readonly model: Model<IRevokeToken>) {
    super(model);
  }
}
