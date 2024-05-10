import { Schema, model } from "mongoose";
import MongooseDelete from "mongoose-delete";

// TODO later implement Authorization
const folderPathSchema = new Schema(
	{
		path: { type: Schema.Types.String, required: true },
	},
	{ timestamps: true }
);

folderPathSchema.plugin(MongooseDelete, { deletedAt: true, deletedBy: true });

const FolderPath = model("FolderPath", folderPathSchema);

export default FolderPath;
