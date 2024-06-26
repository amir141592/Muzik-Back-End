import { Schema, model } from "mongoose";
import MongooseDelete from "mongoose-delete";

// TODO later implement Authorization
const myTunesDirectory = new Schema(
	{
		path: { type: Schema.Types.String, required: true },
	},
	{ timestamps: true }
);

myTunesDirectory.plugin(MongooseDelete, { deletedAt: true, deletedBy: true });

const MyTunesDirectory = model("MyTunes-Directory", myTunesDirectory);

export default MyTunesDirectory;
