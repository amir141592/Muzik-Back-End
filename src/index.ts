import { Elysia, getSchemaValidator, t } from "elysia";
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
			.onError(({ error }) => console.error(new Error("Ops! backend blew up", { cause: error })))
			.onStart(() => console.info(`🦊 Elysia is running at http://localhost:3000`))
			// .onRequest((context) => console.info("context", context))
			.get("/", () => "Hello, I am Elysia")
			.get("/folder-paths", async () => await MyTunesDirectoryModel.find({}))
			.get("/songs", async () => await MyTunesSongModel.find({}))
			.get("/image/:name", ({ params: { name } }) => Bun.file(import.meta.dir + `/content/image/${name}`), {
				params: t.Object({
					name: t.String({
						pattern: "/\bw+.(jpg|jpeg|png|webp)\b/gm",
						error: "Only files with jpg, jpeg, png and webp extentions are allowed",
					}),
				}),
			})
			.get(
				"/song/:name",
				({ params: { name } }) => Bun.file(import.meta.dir + `/content/music/${name.split("_")[0]}/${name.split("_")[1]}`),
				{ params: t.Object({ name: t.String({ pattern: "/\bw+.(mp3)\b/gm", error: "Only files with mp3 extentions are allowed" }) }) }
			)
			.get(
				"/video/:name",
				({ params: { name } }) => Bun.file(import.meta.dir + `/content/video/${name.split("_")[0]}/${name.split("_")[1]}`),
				{ params: t.Object({ name: t.String({ pattern: "/\bw+.(mp4)\b/gm", error: "Only files with mp4 extentions are allowed" }) }) }
			)
			.get("/events", async () => await MyTunesEventModel.find({ status: ["COMING", "ACTIVE", "LIVE"] }))
			.get(
				"/check-token",
				async ({ bearer, jwt }) => {
					const tokenData = await jwt.verify(bearer);

					if (tokenData) {
						const { id, firstName, lastName, email } = tokenData;

						return {
							user: { firstName, lastName, email },
							token: await jwt.sign({ id, firstName, lastName, email }),
						};
					} else return { user: null, token: "" };
				},
				{
					headers: t.Object({
						authorization: t.String({ pattern: "\bBearer\b", error: "Authorization header doesn't have required pattern" }),
					}),
				}
			)
			.post(
				"/create-user",
				async ({ body: { firstName, lastName, email, password } }) =>
					(await MyTunesUserModel.create({ firstName, lastName, email, password: await Bun.password.hash(password) })).toJSON(),
				{
					body: t.Object({
						firstName: t.String({ minLength: 2, maxLength: 24, error: "First name must be between 2 to 24 characters" }),
						lastName: t.String({ minLength: 2, maxLength: 32, error: "Last name must be between 2 to 32 characters" }),
						email: t.String({ format: "email", error: "email doesn't have a correct format" }), // {minLength: 5, maxLength: 64,pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"}
						password: t.String({
							minLength: 8,
							maxLength: 64,
							pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*d)[a-zA-Zd!@#$%^&*()_+{}[]:;<>,.?~\\/-]{8,64}$",
							error: "Password doesn't have correct format",
						}), // ? at least one lowercase letter, one uppercase letter, one digit, and allows for special characters (signs) with a minimum length of 8 characters and a maximum length of 64 characters
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

							return { limiterResultConsecutive, limiterResultDaily };
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
								user: { firstName, lastName, email, phoneNumber, picture },
								token: await jwt.sign({
									id,
									firstName,
									lastName,
									email,
								}),
							};
						} else
							return {
								user: null,
								token: "",
							};
					} else if (!user)
						return {
							user: null,
							token: "",
						};
				},
				{
					body: t.Object({
						email: t.String({ format: "email", error: "email doesn't have a correct format" }),
						password: t.String({
							minLength: 8,
							maxLength: 64,
							pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*d)[a-zA-Zd!@#$%^&*()_+{}[]:;<>,.?~\\/-]{8,64}$",
							error: "Password doesn't have correct format",
						}), // ? at least one lowercase letter, one uppercase letter, one digit, and allows for special characters (signs) with a minimum length of 8 characters and a maximum length of 64 characters
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
							return { limiterResultConsecutive, limiterResultDaily };
						}
					},
				}
			)
			.post(
				"/local-songs",
				async ({ body }) => {
					const savedMuziks = await MyTunesSongModel.create(body);

					if (savedMuziks) return savedMuziks;
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
			.post(
				"/local-directory",
				async ({ body }) => {
					const savedDirectory = (await MyTunesDirectoryModel.create({ path: body })).toJSON();

					if (savedDirectory) return savedDirectory;
				},
				{
					body: t.String({ error: "Directory path must be a string" }),
				}
			)
			.patch("/favorite", async ({ body }) => await MyTunesSongModel.findByIdAndUpdate(body, { favorite: true }, { new: true }), {
				body: t.String(),
			})
			.patch("/unfavorite", async ({ body }) => await MyTunesSongModel.findByIdAndUpdate(body, { favorite: false }, { new: true }), {
				body: t.String(),
			})
			.listen(3000);
	}
} catch (error) {
	throw new Error("could not run backend", { cause: error });
}
