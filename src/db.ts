import { connect as connectToMongo } from "mongoose";
import { config } from "./config";

// models

let connected;
export const connect = async () => {
  if (connected) {
    return;
  }
  connected = true;
  await connectToMongo(config.mongo);
};
