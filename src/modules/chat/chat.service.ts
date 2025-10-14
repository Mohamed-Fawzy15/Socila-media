import { ChatRepository } from "./../../DB/repositories/chat.repository";
import { Socket, Server } from "socket.io";
import { Request, Response, NextFunction } from "express";
import chatModel from "../../DB/model/chat.model";
import { AppError } from "../../utils/classError";
import { UserRepository } from "../../DB/repositories/user.repository";
import userModel from "../../DB/model/user.model";
import { connectionSockets } from "../geteway/gateway";
import { Types } from "mongoose";
import { deleteFile, uploadFile } from "../../utils/s3.config";
import { uuidv4 } from "zod";

export class ChatService {
  constructor() {}
  private _chatModel = new ChatRepository(chatModel);
  private _userModel = new UserRepository(userModel);

  getChat = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    let { page, limit } = req.query as unknown as {
      page: number;
      limit: number;
    };
    if (page < 0 || !page) page = 1;
    page = page * 1 || 1;
    limit = limit * 1 || 5;

    const chat = await this._chatModel.find(
      {
        participants: { $all: [userId, req.user?._id] },
        group: { $exists: false },
      },
      {
        messages: {
          $slice: [-(page * limit), limit],
        },
      },
      {
        populate: [
          {
            path: "participants",
          },
        ],
      }
    );
    if (!chat) {
      throw new AppError("chat not found", 404);
    }
    return res.status(200).json({ message: "success", chat });
  };

  getGroupChat = async (req: Request, res: Response, next: NextFunction) => {
    const { groupId } = req.params;
    let { page, limit } = req.query as unknown as {
      page: number;
      limit: number;
    };
    if (page < 0 || !page) page = 1;
    page = page * 1 || 1;
    limit = limit * 1 || 5;

    const chat = await this._chatModel.find(
      {
        _id: groupId,
        participants: { $in: [req.user?._id] },
        group: { $exists: true },
      },
      {
        messages: {
          $slice: [-(page * limit), limit],
        },
      },
      {
        populate: [
          {
            path: "message.createdBy",
          },
        ],
      }
    );
    if (!chat) {
      throw new AppError("chat not found", 404);
    }
    return res.status(200).json({ message: "success", chat });
  };

  createGroupChat = async (req: Request, res: Response, next: NextFunction) => {
    let { group, groupImage, participants } = req.body;
    const createdBy = req.user?._id as Types.ObjectId;

    const dbParticipants = participants.map((participant: string) => {
      return Types.ObjectId.createFromHexString(participant);
    });
    const users = await this._userModel.find({
      filter: {
        _id: {
          $in: dbParticipants,
        },
        friends: {
          $in: [createdBy],
        },
      },
    });

    if (users.length !== participants.length) {
      throw new AppError("some users not found", 404);
    }

    const roomdId = group?.replaceAll(/\s+/g, "-") + "_" + uuidv4;
    if (req?.file) {
      groupImage = await uploadFile({
        path: `chat${roomdId}`,
        file: req.file as Express.Multer.File,
      });
    }
    dbParticipants.push(createdBy);
    const chat = await this._chatModel.create({
      group,
      groupImage,
      participants,
      createdBy,
      roomId: roomdId,
      messages: [],
    });

    if (!chat) {
      if (groupImage) {
        await deleteFile({ path: groupImage });
      }
    }
    return res.status(200).json({ message: "success", chat });
  };

  sayHi = async (data: any, socket: Socket, io: Server) => {
    socket.emit("sayHiBack", { message: "hi from be" });
  };

  joinRoom = async (data: any, socket: Socket, io: Server) => {
    const { roomId } = data;

    const chat = await this._chatModel.findOne({
      roomId,
      participants: { $in: [socket?.data?.user?._id] },
      group: { $exists: true },
    });

    if (!chat) {
      throw new AppError("chat not found", 404);
    }
    socket.join(chat?.roomId!);
  };

  sendMessage = async (data: any, socket: Socket, io: Server) => {
    const { content, sendTo } = data;
    const createdBy = socket?.data?.user?._id;

    const user = await this._userModel.findOne({
      _id: sendTo,
      friends: { $in: [createdBy] },
    });
    if (!user) {
      throw new AppError("user not found", 404);
    }

    const chat = await this._chatModel.findOneAndUpdate(
      {
        participants: { $all: [sendTo, createdBy] },
        group: { $exists: false },
      },
      {
        $push: {
          messages: { content, createdBy },
        },
      }
    );

    if (!chat) {
      const newChat = await this._chatModel.create({
        participants: [createdBy, sendTo],
        createdBy,
        messages: [{ content, createdBy }],
      });
      if (!newChat) {
        throw new AppError("chat not created", 400);
      }
    }

    io.to(connectionSockets.get(createdBy.toString())!).emit("successMessage", {
      content,
    });
    io.to(connectionSockets.get(sendTo.toString())!).emit("newMessage", {
      content,
      from: socket?.data?.user,
    });
  };

  sendGroupMessage = async (data: any, socket: Socket, io: Server) => {
    const { content, groupId } = data;
    const createdBy = socket?.data?.user?._id;

    const chat = await this._chatModel.findOneAndUpdate(
      {
        _id: groupId,
        participants: { $all: [createdBy] },
        group: { $exists: true },
      },
      {
        $push: {
          messages: { content, createdBy },
        },
      }
    );

    if (!chat) {
      throw new AppError("chat not found", 400);
    }

    io.to(connectionSockets.get(createdBy.toString())!).emit("successMessage", {
      content,
    });
    io.to(chat?.roomId!).emit("newGroupMessage", {
      content,
      from: socket?.data?.user,
      groupId,
    });
  };
}
