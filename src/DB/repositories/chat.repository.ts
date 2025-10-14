import { Model } from "mongoose";
import { IChat } from "../../utils/interfaces";
import { DbRepository } from "./db.repository";

export class ChatRepository extends DbRepository<IChat> {
  constructor(protected readonly model: Model<IChat>) {
    super(model);
  }
}
