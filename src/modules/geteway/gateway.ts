import { Server } from "socket.io";
import { AppError } from "../../utils/classError";
import { SocketWithUser } from "../../utils/interfaces";
import { decodedTokenAndFetchUser, GetSignature } from "../../utils/token";
import { Server as HttpServer } from "http";
import { ChatGateway } from "../chat/chat.gateway";

export const connectionSockets = new Map<string, string[]>();

export const initilizationIo = (httpServer: HttpServer) => {
  // initilization
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  // middleware
  io.use(async (socket: SocketWithUser, next) => {
    try {
      const { authorization } = socket.handshake.auth;

      const [prefix, token] = authorization?.split(" ") || [];
      if (!prefix || !token) {
        return next(new AppError("token not found", 404));
      }

      const signature = await GetSignature(prefix);
      if (!signature) {
        return next(new AppError("invalid signature", 400));
      }

      const { user, decoded } = await decodedTokenAndFetchUser(
        token,
        signature
      );
      const socketId = connectionSockets.get(user?._id.toString()) || [];
      socketId.push(socket.id);
      connectionSockets.set(user?._id?.toString(), socketId);

      socket.user = user;
      socket.decoded = decoded;

      next();
    } catch (error: any) {
      next(error);
    }
  });

  const chatGateway: ChatGateway = new ChatGateway();

  // socket connection
  io.on("connection", (socket: SocketWithUser) => {
    chatGateway.register(socket);

    socket.on("disconnect", () => {
      let remainingTabs = connectionSockets
        ?.get(socket?.user?._id?.toString() || "")
        ?.filter((tab) => {
          return tab === socket.id;
        });
      if (remainingTabs?.length) {
        connectionSockets.set(socket?.user?._id?.toString()!, remainingTabs);
      } else {
        connectionSockets.delete(socket?.user?._id?.toString()!);
      }

      io.emit("userDisconnected", { userId: socket?.user?._id?.toString()! });
    });
  });
};
