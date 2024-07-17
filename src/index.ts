import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { RateLimiterMongo } from "rate-limiter-flexible";
import { ip } from "elysia-ip";
import { bearer } from "@elysiajs/bearer";

import { mongooseConnection } from "./databases/mongodb.database";

import MyTunesSongModel from "./models/mongoose/song.model";
import MyTunesDirectoryModel from "./models/mongoose/directory.model";
import MyTunesUserModel from "./models/mongoose/user.model";
import MyTunesEventModel from "./models/mongoose/event.model";

try {
	const { connection } = await mongooseConnection();

	if (connection) {
		console.info("connected to mongoDB");

		new Elysia()
			.use(
				cors({
					methods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
					credentials: true,
					maxAge: 3600 * 24 * 3,
				})
			)
			.use(
				jwt({
					name: "jwt",
					secret: "/:r=a%fGu#y(7y]tLzgtnnH$/qTZTC4fJ)RH#r:YBM=vQMakHc]Tmi;&baw@zz3F",
					exp: "3d",
				})
			)
			.use(ip())
			.use(bearer())
			.onError(({ code, error }) => {
				console.error(error);

				switch (code) {
					case "PARSE":
						return {
							code: "4201x011",
							message: "Request body type is not valid and could not be parsed",
							data: error.body,
						};

					case "VALIDATION":
						return {
							code: "4201x012",
							message: "Request body properties are not valid and could not be proccessed",
							data: error.all,
						};

					default:
						return {
							code,
							message: "An unknown error happened",
							error,
						};
				}
			})
			.onStart(() => console.info(`🦊 Elysia is running at http://localhost:3000`))
			.onRequest((context) => console.info(context.request.url, context))
			.get("/", () => "Hello, How do you do?")
			.group("/file", (app) =>
				app
					.guard({
						response: t.File(),
					})
					.get("/image/:name", ({ params: { name } }) => Bun.file(import.meta.dir + `/content/image/${name}`), {
						params: t.Object({ name: t.String() }), // { pattern: "/\bw+.(jpg|jpeg|png|webp)\b/gm", error: "Only files with jpg, jpeg, png and webp extentions are allowed",}
					})
					.get(
						"/song/:name",
						({ params: { name } }) => Bun.file(import.meta.dir + `/content/music/${name.split("_")[0]}/${name.split("_")[1]}`),
						{ params: t.Object({ name: t.String() }) } // { pattern: "/\bw+.(mp3)\b/gm", error: "Only files with mp3 extentions are allowed" }
					)
					.get(
						"/video/:name",
						({ params: { name } }) => Bun.file(import.meta.dir + `/content/video/${name.split("_")[0]}/${name.split("_")[1]}`),
						{ params: t.Object({ name: t.String() }) } // { pattern: "/\bw+.(mp4)\b/gm", error: "Only files with mp4 extentions are allowed" }
					)
			)
			.group("/public", (app) =>
				app
					.guard({
						// TODO make returning a response optional
						response: t.MaybeEmpty(
							t.Object({
								code: t.String(), // { pattern: "^([01234])([0123])d{2}(x)d{3}$" }
								message: t.String(),
								data: t.Optional(t.Unknown()),
								errors: t.Optional(
									t.Array(
										t.Object({
											location: t.String(),
											param: t.String(),
											value: t.Unknown(),
											message: t.String(),
										})
									)
								),
							})
						),
					})
					.get("/events", async () => {
						return {
							code: "2201x001",
							message: "Fetched all upcoming, active and live events",
							data: await MyTunesEventModel.find({ status: ["COMING", "ACTIVE", "LIVE"] }),
						};
					})
					.post(
						"/create-user",
						async ({ body: { firstName, lastName, email, password } }) => {
							const user = await MyTunesUserModel.create({ firstName, lastName, email, password: await Bun.password.hash(password) });
							if (user)
								return {
									code: "2201x002",
									message: "Created user",
									data: user,
								};
							else
								return {
									code: "4201x003",
									message: "Could not create user",
								};
						},
						{
							body: t.Object({
								firstName: t.String({ minLength: 2, maxLength: 24, error: "First name must be between 2 to 24 characters" }),
								lastName: t.String({ minLength: 2, maxLength: 32, error: "Last name must be between 2 to 32 characters" }),
								email: t.String({ format: "email", error: "email does not have a correct format" }), // {minLength: 5, maxLength: 64,pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"}
								password: t.String({
									minLength: 8,
									maxLength: 64,
									// pattern: "(?=.*d)(?=.*[a-z])([^s]){8,64}",
									error: "Password does not have correct format",
								}), // ? at least one letter, one digit and with a minimum length of 8 characters and a maximum length of 64 characters
							}),
							async beforeHandle({ ip, set }) {
								const limiterConsecutiveCreateUser = new RateLimiterMongo({
									storeClient: connection,
									points: 3,
									duration: 600, // ? 10 mins in seconds
									blockDuration: 3600, // ? an hour in seconds
									tableName: "create-user-consecutive-limiter",
								});

								const limiterDailyCreateUser = new RateLimiterMongo({
									storeClient: connection,
									points: 5,
									duration: (new Date().setHours(23, 59, 59, 999) - Date.now()) / 1000, // ? remaining time for today in seconds
									blockDuration: (new Date().setHours(23, 59, 59, 999) - Date.now()) / 1000, // ? block ip for today
									tableName: "create-user-daily-limiter",
								});

								const limiterResultConsecutive = await limiterConsecutiveCreateUser.consume(ip, 1);
								const limiterResultDaily = await limiterDailyCreateUser.consume(ip, 1);

								if (limiterResultConsecutive.remainingPoints == 0 || limiterResultDaily.remainingPoints == 0) {
									set.status = "Too Many Requests";

									if (limiterResultConsecutive.remainingPoints == 0)
										return {
											code: "4201x004",
											message: "Too many consecutive create user requests",
											errors: [
												{
													location: "/create-user",
													message: "Too many consecutive create user requests",
													param: "limiterConsecutiveCreateUser",
													value: limiterResultConsecutive,
												},
											],
										};
									else if (limiterResultDaily.remainingPoints == 0)
										return {
											code: "4201x005",
											message: "Too many daily create user requests",
											errors: [
												{
													location: "/create-user",
													message: "Too many daily create user requests",
													param: "limiterDailyCreateUser",
													value: limiterResultDaily,
												},
											],
										};
								}
							},
						}
					)
					.post(
						"/user-log-in",
						async ({ body: { email, password }, jwt }) => {
							const user = await MyTunesUserModel.findOne({ email }).exec();

							if (user) {
								const correctPass = await Bun.password.verify(password, user.password);
								const { id, firstName, lastName, email, phoneNumber, picture } = user;

								if (correctPass) {
									return {
										code: "2201x006",
										message: "User logged in",
										data: {
											user: { id, firstName, lastName, email, phoneNumber, picture },
											token: await jwt.sign({
												id,
												firstName,
												lastName,
												email,
											}),
										},
									};
								} else
									return {
										code: "4201x007",
										message: "User password was incorrect",
									};
							} else if (!user)
								return {
									code: "4301x008",
									message: "User with this email does not exist",
								};
						},
						{
							body: t.Object({
								email: t.String({ format: "email", error: "Email does not have a correct format" }),
								password: t.String({
									minLength: 8,
									maxLength: 64,
									// pattern: "/(?=.*d)(?=.*[a-z])([^s]){8,64}/g",
									error: "Password does not have correct format",
								}), // ? at least one letter, one digit and with a minimum length of 8 characters and a maximum length of 64 characters
							}),
							async beforeHandle({ ip, set }) {
								const limiterConsecutiveLogIn = new RateLimiterMongo({
									storeClient: connection,
									points: 5,
									duration: 300, // ? 5 mins in seconds
									blockDuration: 300, // ? 5 mins in seconds
									tableName: "log-in-consecutive-limiter",
								});

								const limiterDailyLogIn = new RateLimiterMongo({
									storeClient: connection,
									points: 15,
									duration: (new Date().setHours(23, 59, 59, 999) - Date.now()) / 1000, // ? remaining time for today in seconds
									blockDuration: (new Date().setHours(23, 59, 59, 999) - Date.now()) / 1000, // ? block ip for today
									tableName: "log-in-daily-limiter",
								});

								const limiterResultConsecutive = await limiterConsecutiveLogIn.consume(ip, 1);
								const limiterResultDaily = await limiterDailyLogIn.consume(ip, 1);

								if (limiterResultConsecutive.remainingPoints == 0 || limiterResultDaily.remainingPoints == 0) {
									set.status = "Too Many Requests";

									if (limiterResultConsecutive.remainingPoints == 0)
										return {
											code: "4201x009",
											message: "Too many consecutive log in requests",
											errors: [
												{
													location: "/create-user",
													message: "Too many consecutive log in requests",
													param: "limiterConsecutiveLogIn",
													value: limiterResultConsecutive,
												},
											],
										};
									else if (limiterResultDaily.remainingPoints == 0)
										return {
											code: "4201x010",
											message: "Too many daily log in requests",
											errors: [
												{
													location: "/create-user",
													message: "Too many daily log in requests",
													param: "limiterDailyLogIn",
													value: limiterResultDaily,
												},
											],
										};
								}
							},
						}
					)
			)
			.group("/user", (app) =>
				app
					.guard({
						headers: t.Object({
							authorization: t.String({ pattern: "\bBearer\b", error: "Authorization header doesn't have required pattern" }),
						}),
					})
					.derive(async ({ bearer, jwt }) => {
						const tokenData = await jwt.verify(bearer);

						if (!tokenData) throw new Error("Authorization failed. log in again!");
						else return { tokenData };
					})
					.get("/check-token", async ({ bearer, jwt }) => {
						const tokenData = await jwt.verify(bearer);

						if (tokenData) {
							const { id, firstName, lastName, email } = tokenData;

							return {
								code: "2202x005",
								message: "User token was valid and new token is sent",
								data: {
									user: { firstName, lastName, email },
									token: await jwt.sign({ id, firstName, lastName, email }),
								},
							};
						} else
							return {
								code: "4202x006",
								message: "User token was not valid or expired",
								data: { user: null, token: "" },
							};
					})
			)
			.group("/song", (app) =>
				app
					.guard({
						headers: t.Object({
							authorization: t.String({ pattern: "\bBearer\b", error: "Authorization header doesn't have required pattern" }),
						}),
					})
					.derive(async ({ bearer, jwt }) => {
						const tokenData = await jwt.verify(bearer);

						if (!tokenData) throw new Error("Authorization failed. log in again!");
						else return { tokenData };
					})
					.get("/local-songs", async () => {
						const songs = await MyTunesSongModel.find({});

						if (songs)
							return {
								code: "2202x001",
								message: "Found all user local songs",
								data: songs,
							};
						else
							return {
								code: "2202x002",
								message: "Found no local songs for this user",
								data: [],
							};
					})
					.post(
						"/local-songs",
						async ({ body, tokenData }) => {
							const savedMuziks = await MyTunesSongModel.create(
								body.map((song) => {
									Object.assign(song, {
										user: tokenData.id,
									});

									return song;
								})
							);

							if (savedMuziks)
								return {
									code: "2202x007",
									message: "Saved sent local songs for this user",
									data: savedMuziks,
								};
							else
								return {
									code: "4302x008",
									message: "Could not save local songs for this user",
								};
						},
						{
							body: t.Array(
								t.Object({
									type: t.Union([t.Literal("SINGLE"), t.Literal("ALBUM")], { error: "Song type must be either SINGLE or ALBUM" }),
									title: t.String({ error: "Title must be a string" }),
									artist: t.String({ error: "Artist must be a string" }),
									file: t.String({ error: "File path must be a string" }),
								})
							),
						}
					)
					.patch(
						"/favorite",
						async ({ body }) => {
							const favoritedSong = await MyTunesSongModel.findByIdAndUpdate(body, { favorite: true }, { new: true });

							if (favoritedSong)
								return {
									code: "2202x011",
									message: "Changed sent song to favorite for this user",
									data: favoritedSong,
								};
							else
								return {
									code: "4302x012",
									message: "Could not favorite sent song for this user",
								};
						},
						{
							body: t.String({ error: "Song id must be a string" }),
						}
					)
					.patch(
						"/unfavorite",
						async ({ body }) => {
							const unfavoritedSong = await MyTunesSongModel.findByIdAndUpdate(body, { favorite: false }, { new: true });

							if (unfavoritedSong)
								return {
									code: "2202x013",
									message: "Changed sent song to unfavorite for this user",
									data: unfavoritedSong,
								};
							else
								return {
									code: "4302x014",
									message: "Could not unfavorite sent song for this user",
								};
						},
						{
							body: t.String({ error: "Song id must be a string" }),
						}
					)
			)
			.group("/directory", (app) =>
				app
					.guard({
						headers: t.Object({
							authorization: t.String({ pattern: "\bBearer\b", error: "Authorization header doesn't have required pattern" }),
						}),
					})
					.derive(async ({ bearer, jwt }) => {
						const tokenData = await jwt.verify(bearer);

						if (!tokenData) throw new Error("Authorization failed. log in again!");
						else return { tokenData };
					})
					.get("/local-directories", async () => {
						const directories = await MyTunesDirectoryModel.find({});

						if (directories)
							return {
								code: "2202x003",
								message: "Found all user directories",
								data: directories,
							};
						else
							return {
								code: "2202x004",
								message: "Found no directory for this user",
								data: [],
							};
					})
					.post(
						"/local-directory",
						async ({ body, tokenData }) => {
							const savedDirectory = (await MyTunesDirectoryModel.create({ user: tokenData.id, path: body })).toJSON();

							if (savedDirectory)
								return {
									code: "2202x009",
									message: "Saved sent local directory for this user",
									data: savedDirectory,
								};
							else
								return {
									code: "4302x010",
									message: "Could not save local directory for this user",
								};
						},
						{
							body: t.String({ error: "Directory path must be a string" }),
						}
					)
			)
			.listen(3000);
	}
} catch (error) {
	throw new Error("could not run backend", { cause: error });
}
