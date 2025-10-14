import { Server } from "socket.io";
import { SocketWithUser } from "../../utils/interfaces";
import { ChatEvent } from "./chat.event";

export class ChatGateway {
  private _chatEvent: ChatEvent = new ChatEvent();

  constructor() {}

  register = (socket: SocketWithUser, io: Server) => {
    this._chatEvent.sayHi(socket, io);
    this._chatEvent.sendMessage(socket, io);
    this._chatEvent.joinRoom(socket, io);
    this._chatEvent.sendGroupMessage(socket, io);
  };
}
