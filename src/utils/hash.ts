import { compare, hash, genSalt } from "bcrypt";

export const Hash = async (
  plainText: string,
  saltRound: number = Number(process.env.SALT_ROUNDS)
) => {
  // genSalt(5)
  return hash(plainText, saltRound);
};

export const Compare = async (plainText: string, cipherText: string) => {
  return compare(plainText, cipherText);
};
