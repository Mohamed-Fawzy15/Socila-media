import { Model } from "mongoose";
import { IComment } from "../../utils/interfaces";
import { DbRepository } from "./db.repository";

export class CommentRepository extends DbRepository<IComment> {
  constructor(protected readonly model: Model<IComment>) {
    super(model);
  }
}
