import {
  HydratedDocument,
  Model,
  RootFilterQuery,
  UpdateQuery,
  UpdateWriteOpResult,
  QueryOptions,
  DeleteResult,
} from "mongoose";
import { AppError } from "../../utils/classError";
import { ProjectionType } from "mongoose";

export abstract class DbRepository<TDocument> {
  constructor(protected readonly model: Model<TDocument>) {}

  async create(data: Partial<TDocument>): Promise<HydratedDocument<TDocument>> {
    return this.model.create(data);
  }

  async findOne(
    filter: RootFilterQuery<TDocument>,
    projection?: ProjectionType<TDocument>,
    options?: QueryOptions<TDocument>
  ): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findOne(filter, projection, options);
  }

  async find(
    filter: RootFilterQuery<TDocument>,
    select?: ProjectionType<TDocument>,
    options?: QueryOptions<TDocument>
  ): Promise<HydratedDocument<TDocument>[]> {
    return this.model.find(filter, select, options);
  }

  async updateOne(
    filter: RootFilterQuery<TDocument>,
    update: UpdateQuery<TDocument>
  ): Promise<UpdateWriteOpResult> {
    return await this.model.updateOne(filter, update);
  }

  async findOneAndUpdate(
    filter: RootFilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
    options: QueryOptions<TDocument> | null = { new: true }
  ): Promise<HydratedDocument<TDocument> | null> {
    return await this.model.findOneAndUpdate(filter, update, options);
  }

  async deleteOne(filter: RootFilterQuery<TDocument>): Promise<DeleteResult> {
    return await this.model.deleteOne(filter);
  }

  // async paginate({
  //   filter,
  //   projection,
  //   options,
  //   query,
  // }: {
  //   filter: RootFilterQuery<TDocument>;
  //   projection?: ProjectionType<TDocument>;
  //   options?: QueryOptions<TDocument>;
  //   query: { page: number; limit: number };
  // }): Promise<HydratedDocument<TDocument>[]> {
  //   let { page, limit } = query;
  //   if (page < 0) page = 1;
  //   page = page * 1 || 1;
  //   limit = limit * 1 || 5;

  //   const skip = (page - 1) * limit;

  //   const finalOptions = {
  //     ...(options || {}),
  //     skip,
  //     limit,
  //   };

  //   const countDoc = await this.model.countDocuments({deletedAt: {$exists: false}});
  //   const totalPages = Math.ceil(countDoc / limit);
  //   const result = await this.model.find(filter, projection, finalOptions);
  //   return { result, currentPage: page, countDoc, totalPages };
  // }
}
