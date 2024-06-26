import { Schema, model } from "mongoose";
import MongooseDelete from "mongoose-delete";

const myTunesEventSchema = new Schema(
	{
		type: {
			type: Schema.Types.String,
			enum: ["VIDEO", "IMAGE"],
			required: true,
		},
		title: { type: Schema.Types.String, required: true },
		description: { type: Schema.Types.String, required: false, default: "" },
		file: { type: Schema.Types.String, required: true },
		buttonTitle: { type: Schema.Types.String, required: false },
		buttonLink: { type: Schema.Types.String, required: false },
		status: { type: Schema.Types.String, enum: ["COMING", "ACTIVE", "PASSED", "LIVE", "CANCELED"], required: true },
		time: { type: Schema.Types.Number, required: false },
	},
	{ timestamps: true }
);

myTunesEventSchema.plugin(MongooseDelete, { deletedAt: true, deletedBy: true });

const MyTunesEvent = model("MyTunes-Event", myTunesEventSchema);

export default MyTunesEvent;
