import { Schema, model } from "mongoose";
import MongooseDelete from "mongoose-delete";

const muzikSongSchema = new Schema(
	{
		type: {
			type: Schema.Types.String,
			enum: ["SINGLE", "ALBUM"],
			required: true,
		},
		parentalAdvisory: { type: Schema.Types.Boolean, default: false },
		favorite: { type: Schema.Types.Boolean, default: false },
		title: { type: Schema.Types.String, required: true },
		artist: { type: Schema.Types.String, required: true },
		coArtists: { type: [Schema.Types.String] },
		album: { type: Schema.Types.String },
		image: { type: Schema.Types.String, required: true },
		file: { type: Schema.Types.String, required: true, unique: true },
	},
	{ timestamps: true }
);

muzikSongSchema.plugin(MongooseDelete, { deletedAt: true, deletedBy: true });

const MuzikSong = model("MuzikSong", muzikSongSchema);

export default MuzikSong;
