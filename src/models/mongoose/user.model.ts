import { Schema, model } from "mongoose";
import MongooseDelete from "mongoose-delete";

const myTunesUserSchema = new Schema(
	{
		firstName: { type: Schema.Types.String, required: true },
		lastName: { type: Schema.Types.String, required: true },
		email: { type: Schema.Types.String, required: true, unique: true },
		phoneNumber: { type: Schema.Types.String, required: false },
		password: { type: Schema.Types.String, required: true },
		picture: { type: Schema.Types.String, required: false },
	},
	{
		timestamps: true,
		virtuals: {
			fullName: {
				get() {
					return this.firstName + " " + this.lastName;
				},
			},
		},
		toJSON: { virtuals: true },
	}
);

myTunesUserSchema.plugin(MongooseDelete, { deletedAt: true, deletedBy: true });

const MyTunesUser = model("MyTunes-User", myTunesUserSchema);

export default MyTunesUser;
