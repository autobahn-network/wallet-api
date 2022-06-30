import { model, Schema } from "mongoose";

export interface LastBlock {
  no: number;
}

const lastBlockSchema = new Schema<LastBlock>({
  no: { type: Number, required: true },
});

export const LastBlockModel = model<LastBlock>("LastBlock", lastBlockSchema);
