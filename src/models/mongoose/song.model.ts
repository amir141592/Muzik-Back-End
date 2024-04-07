import { Schema, model } from 'mongoose';
import MongooseDelete from 'mongoose-delete';

const songSchema = new Schema(
  {
    type: {
      type: Schema.Types.String,
      enum: ['SINGLE', 'ALBUM'],
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

songSchema.plugin(MongooseDelete, { deletedAt: true, deletedBy: true });

const Song = model('Song', songSchema);

export default Song;
