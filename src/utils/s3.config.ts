import {
  ObjectCannedACL,
  PutObjectAclCommand,
  PutObjectCommand,
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { StorageEnum } from "./interfaces";
import { createReadStream } from "fs";
import { AppError } from "./classError";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const s3client = () => {
  return new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECERT_ACCESS_KEY!,
    },
  });
};

export const uploadFile = async ({
  storeType = StorageEnum.cloud,
  Bucket = process.env.AWS_BUCKET_NAME!,
  path = "general",
  ACL = "private" as ObjectCannedACL,
  file,
}: {
  storeType?: StorageEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path: string;
  file: Express.Multer.File;
}): Promise<string> => {
  const command = new PutObjectAclCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    ACL,
    Key: `${process.env.APPLICATION_NAME}/${path}/${uuidv4()}_${
      file.originalname
    }`,
    Body:
      storeType === StorageEnum.cloud
        ? file.buffer
        : createReadStream(file.path),
    ContentType: file.mimetype,
  });

  await s3client().send(command);

  if (!command.input.Key) {
    throw new AppError("Failed to upload file", 500);
  }

  return command.input.Key;
};

export const uploadLarageFile = async ({
  storeType = StorageEnum.cloud,
  Bucket = process.env.AWS_BUCKET_NAME!,
  path = "general",
  ACL = "private" as ObjectCannedACL,
  file,
}: {
  storeType?: StorageEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path: string;
  file: Express.Multer.File;
}): Promise<string> => {
  const upload = new Upload({
    client: s3client(),
    params: {
      Bucket,
      ACL,
      Key: `${process.env.APPLICATION_NAME}/${path}/${uuidv4()}_${
        file.originalname
      }`,
      Body:
        storeType === StorageEnum.cloud
          ? file.buffer
          : createReadStream(file.path),
      ContentType: file.mimetype,
    },
  });

  upload.on("httpUploadProgress", (progress) => {
    console.log(progress);
  });

  const { Key } = await upload.done();

  if (!Key) {
    throw new AppError("Failed to upload file", 500);
  }

  return Key;
};

export const uploadFiles = async ({
  storeType = StorageEnum.cloud,
  Bucket = process.env.AWS_BUCKET_NAME!,
  path = "general",
  ACL = "private" as ObjectCannedACL,
  files,
  useLarge = false,
}: {
  storeType?: StorageEnum;
  Bucket?: string;
  ACL?: ObjectCannedACL;
  path: string;
  files: Express.Multer.File[];
  useLarge?: boolean;
}): Promise<string[]> => {
  let urls: string[] = [];
  // to upload one by one
  // for (const file of files) {
  //   const key = await uploadFile({
  //     path: `${process.env.APPLICATION_NAME}/${path}/coverImages/${uuidv4()}_${
  //       file.originalname
  //     }`,
  //     file,
  //   });
  //   urls.push(key);
  // }

  // to upload all files togther
  if (useLarge === true) {
    urls = await Promise.all(
      files.map((file) =>
        uploadLarageFile({ storeType, Bucket, ACL, path, file })
      )
    );
  } else {
    urls = await Promise.all(
      files.map((file) => uploadFile({ storeType, Bucket, ACL, path, file }))
    );
  }

  return urls;
};

export const createUploadFilePresignedUrl = async ({
  originalname,
  ContentType,
  path = "general",
  expiresIn = 60,
}: {
  originalname: string;
  ContentType: string;
  path: string;
  expiresIn?: number;
}) => {
  const Key = `${
    process.env.APPLICATION_NAME
  }/${path}/${uuidv4()}_${originalname}`;
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key,
    ContentType,
  });
  const url = await getSignedUrl(s3client(), command, { expiresIn });

  return { url, Key };
};

export const getFile = async ({
  Bucket = process.env.AWS_BUCKET_NAME!,
  Key,
}: {
  Bucket?: string;
  Key: string;
}) => {
  const command = new GetObjectCommand({
    Bucket,
    Key,
  });

  return await s3client().send(command);
};

export const createGetFilePresignedUrl = async ({
  Bucket = process.env.AWS_BUCKET_NAME!,
  Key,
  expiresIn = 60,
  downloadName,
}: {
  Bucket?: string;
  Key: string;
  expiresIn?: number;
  downloadName?: string | undefined;
}) => {
  const command = new GetObjectCommand({
    Bucket,
    Key,
    ResponseContentDisposition: downloadName
      ? `attachment; filename="${downloadName || Key.split("/").pop()}"`
      : undefined,
  });

  const url = await getSignedUrl(s3client(), command, { expiresIn });
  return url;
};

export const deleteFile = async ({
  Bucket = process.env.AWS_BUCKET_NAME!,
  Key,
}: {
  Bucket?: string;
  Key: string;
}) => {
  const command = new DeleteObjectCommand({
    Bucket,
    Key,
  });

  return await s3client().send(command);
};

export const deleteFiles = async ({
  Bucket = process.env.AWS_BUCKET_NAME!,
  urls,
  Quiet = false,
}: {
  Bucket?: string;
  urls: string[];
  Quiet: boolean;
}) => {
  const command = new DeleteObjectCommand({
    Bucket,
    Delete: {
      Objects: urls.map((url) => ({ Key: url })),
      Quiet,
    },
  });

  return await s3client().send(command);
};

export const listFiles = async ({
  Bucket = process.env.AWS_BUCKET_NAME!,
  path,
}: {
  Bucket?: string;
  path: string;
}) => {
  const command = new ListObjectsV2Command({
    Bucket,
    Prefix: `${process.env.APPLICATION_NAME}/${path}`,
  });

  return await s3client().send(command);
};
