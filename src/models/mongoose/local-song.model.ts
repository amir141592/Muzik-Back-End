import { Schema, model } from "mongoose";

const songSchema = new Schema(
	{
		mostPlayed: { type: Schema.Types.Boolean, default: false },
		new: { type: Schema.Types.Boolean, default: false },
		favorite: { type: Schema.Types.Boolean, default: false },
		file: { type: Schema.Types.String, required: true, unique: true },
	},
	{ timestamps: true }
);

const Song = model("Song", songSchema);

export default Song;
