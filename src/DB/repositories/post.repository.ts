import { HydratedDocument, Model } from "mongoose";
import { IPost } from "../../utils/interfaces";
import { DbRepository } from "./db.repository";
import { AppError } from "../../utils/classError";

export class PostRepository extends DbRepository<IPost> {

  constructor(protected readonly model: Model<IPost>) {
    super(model);
  }

 
}
