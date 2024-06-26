import { Schema, model } from "mongoose";
import MongooseDelete from "mongoose-delete";

const muTunesSongSchema = new Schema(
	{
		type: {
			type: Schema.Types.String,
			enum: ["SINGLE", "ALBUM"],
			required: true,
		},
		parentalAdvisory: { type: Schema.Types.Boolean, default: false },
		favorite: { type: Schema.Types.Boolean, default: false },
		mostPlayed: { type: Schema.Types.Boolean, default: false },
		new: { type: Schema.Types.Boolean, default: true },
		title: { type: Schema.Types.String, required: true },
		artist: { type: Schema.Types.String, required: true },
		coArtists: { type: [Schema.Types.String] },
		album: { type: Schema.Types.String },
		image: { type: Schema.Types.String },
		file: { type: Schema.Types.String, required: true, unique: true },
	},
	{ timestamps: true }
);

muTunesSongSchema.plugin(MongooseDelete, { deletedAt: true, deletedBy: true });

const MyTunesSong = model("MyTunes-Song", muTunesSongSchema);

export default MyTunesSong;
