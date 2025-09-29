import mongoose from "mongoose";

const connectionDB = async () => {
  mongoose
    .connect(process.env.DB_URL as unknown as string)
    .then(() => {
      console.log(`success to connect to DB${process.env.DB_URL}`);
    })
    .catch((err) => {
      console.log("fail to connect o db", err);
    });
};

export default connectionDB;
