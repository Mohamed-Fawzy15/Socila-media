import { NextFunction, Request, Response } from "express";
import commentModel from "../../DB/model/comment.model";
import { CommentRepository } from "../../DB/repositories/comment.repository";
import { PostRepository } from "../../DB/repositories/post.repository";
import { UserRepository } from "../../DB/repositories/user.repository";
import postModel from "../../DB/model/post.model";
import userModel from "../../DB/model/user.model";
import { AllowCommentEnum } from "../../utils/interfaces";
import { deleteFiles, uploadFiles } from "../../utils/s3.config";
import { AppError } from "../../utils/classError";
import { Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";

class CommentService {
  private _commentModel = new CommentRepository(commentModel);
  private _postModel = new PostRepository(postModel);
  private _userModel = new UserRepository(userModel);

  constructor() {}

createComment = async (req: Request, res: Response, next: NextFunction) => {
    const {postId} = req.params;
    let{content, tags, attachments} = req.body;

    const post = await this._postModel.findOne({
      _id:postId,
      allowComment: AllowCommentEnum.allow
      $or: AvailabilityPost(req)
    })

    if(!post){
      return next(new AppError("post not found or you are not authorized", 403))
    }

    if(tags?.length && (await this._userModel.find({filter: {_id: {$in:tags} } })).length !== tags.length){
      return next(new AppError("some tags are not valid", 400))
    }

    const assetFolderId = uuidv4();

    if (attachments?.length) {
      attachments = await uploadFiles({
        files: req?.files as unknown as Express.Multer.File[],
        path: `users/${post?.createdBy}/posts/${post?.assetFolderId}/comments/${assetFolderId}`,
      });
    }

    const comment = await this._commentModel.create({
      content,
      tags,
      attachments,
      assetFolderId,
      postId: postId as unknown as Types.ObjectId,
      createdBy: req?.user?._id as unknown as Types.ObjectId,
    });

    if (!comment) {
      await deleteFiles({ urls: comment?.attachments || [], Quiet: false });
      throw new AppError("faild to create post", 500);
    }


    return res.status(201).json({ message: "created", comment });
  };
}
