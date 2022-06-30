require("dotenv").config();

interface Config {
  mongo: string;
  rpc: string;
}

for (const variable of ["RPC"]) {
  if (typeof process.env[`WALLET_API__${variable}`] === "undefined") {
    throw new Error(`Missing env variable for ${variable}`);
  }
}

export const config: Config = {
  mongo:
    process.env.WALLET_API__MONGO || "mongodb://localhost:27017/wallet-api",
  rpc: process.env.WALLET_API__RPC,
};
