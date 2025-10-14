import { Server, Socket } from "socket.io";
import { ChatService } from "./chat.service";
import * as CV from "./chat.validation";
import { z } from "zod";

export class ChatEvent {
  private _chatService = new ChatService();

  constructor() {}

  sayHi = (socket: Socket, io: Server) => {
    return socket.on("sayHi", (data, callback) => {
      this._chatService.sayHi(data, socket, io);
      callback({ message: "hello from server" });
    });
  };

  sendMessage = (socket: Socket, io: Server) => {
    return socket.on("sendMessage", (data, callback) => {
      try {
        const validatedData = CV.sendMessageSchema.body.parse(data);
        this._chatService.sendMessage(validatedData, socket, io);
      } catch (error) {
        if (error instanceof z.ZodError) {
          socket.emit("validationError", { errors: error.errors });
        }
      }
    });
  };

  joinRoom = (socket: Socket, io: Server) => {
    return socket.on("joinRoom", (data, callback) => {
      try {
        const validatedData = CV.joinRoomSchema.body.parse(data);
        this._chatService.joinRoom(validatedData, socket, io);
      } catch (error) {
        if (error instanceof z.ZodError) {
          socket.emit("validationError", { errors: error.errors });
        }
      }
    });
  };

  sendGroupMessage = (socket: Socket, io: Server) => {
    return socket.on("sendGroupMessage", (data, callback) => {
      try {
        const validatedData = CV.sendGroupMessageSchema.body.parse(data);
        this._chatService.sendGroupMessage(validatedData, socket, io);
      } catch (error) {
        if (error instanceof z.ZodError) {
          socket.emit("validationError", { errors: error.errors });
        }
      }
    });
  };
}
