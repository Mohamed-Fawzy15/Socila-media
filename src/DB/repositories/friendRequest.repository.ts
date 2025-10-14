import { Model } from "mongoose";
import { IFriendRequest } from "../../utils/interfaces";
import { DbRepository } from "./db.repository";

export class FriendRequestRepository extends DbRepository<IFriendRequest> {
  constructor(protected readonly model: Model<IFriendRequest>) {
    super(model);
  }
}
