import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { jwt } from "@elysiajs/jwt";
import { RateLimiterMongo } from "rate-limiter-flexible";
import { ip } from "elysia-ip";

import { mongooseConnection } from "./databases/mongodb.database";

import MuzikSongModel from "./models/mongoose/muzik-song.model";
import FolderPathModel from "./models/mongoose/folder-path.model";
import UserModel from "./models/mongoose/user.model";

try {
	const { connection } = await mongooseConnection();

	if (connection) {
		console.info("connected to mongoDB");

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

		new Elysia()
			.use(cors({ methods: "*" }))
			.use(
				jwt({
					name: "jwt",
					secret: "/:r=a%fGu#y(7y]tLzgtnnH$/qTZTC4fJ)RH#r:YBM=vQMakHc]Tmi;&baw@zz3F",
				})
			)
			.use(ip())
			.onError(({ error }) => console.error(new Error("Ops! backend blew up", { cause: error })))
			.onStart(() => console.info(`🦊 Elysia is running at http://localhost:3000`))
			// .onRequest((context) => console.info(context))
			.get("/", () => "Hello Amir")
			.get("/user-info", () => {
				return {
					id: "1",
					firstName: "Amir",
					lastName: "Allahdadian",
					email: "amir.allahdadian@gmail.com",
				};
			})
			.get("/user-image", () => Bun.file("./server/content/image/amir-image.jpg"))
			.get("/folder-paths", async () => await FolderPathModel.find({}))
			.get("/songs", async () => await MuzikSongModel.find({}))
			.get("/image/:name", ({ params: { name } }) => Bun.file(import.meta.dir + `/content/image/${name}`))
			.get("/song/:name", ({ params: { name } }) =>
				Bun.file(import.meta.dir + `/content/music/${name.split("_")[0]}/${name.split("_")[1]}`)
			)
			.get("/video/:name", ({ params: { name } }) =>
				Bun.file(import.meta.dir + `/content/video/${name.split("_")[0]}/${name.split("_")[1]}`)
			)
			.get(
				"/check-token",
				async ({ jwt, cookie }) => {
					const tokenData = await jwt.verify(cookie.auth.value);

					if (tokenData) return true;
					else return false;
				},
				{ cookie: t.Object({ auth: t.String() }) }
			)
			.post(
				"/create-user",
				async ({ body: { firstName, lastName, email, password } }) =>
					(await UserModel.create({ firstName, lastName, email, password: await Bun.password.hash(password) })).toJSON(),
				{
					body: t.Object({
						firstName: t.String(),
						lastName: t.String(),
						email: t.String(),
						password: t.String(),
					}),
					async beforeHandle({ ip, set }) {
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
				async ({ body: { email, password }, jwt, cookie: { auth } }) => {
					const user = await UserModel.findOne({ email }).exec();

					if (user) {
						const correctPass = await Bun.password.verify(password, user.password);
						const { id, fullName, email, phoneNumber, picture } = user;

						if (correctPass) {
							auth.set({
								value: await jwt.sign({ id, email }),
								httpOnly: true,
								maxAge: 3600 * 24 * 7, // ? 7 days
								// secure: true,
							});

							return {
								user: {
									fullName,
									email,
									phoneNumber,
									picture,
								},
								success: true,
							};
						} else
							return {
								user: { fullName, email, phoneNumber },
								success: false,
							};
					} else if (!user) return { user: null, success: false };
				},
				{
					body: t.Object({ email: t.String(), password: t.String() }),
					async beforeHandle({ ip, set }) {
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
					const savedMuziks = await MuzikSongModel.create(body);

					if (savedMuziks) return savedMuziks;
				},
				{
					body: t.Array(
						t.Object({
							type: t.Union([t.Literal("SINGLE"), t.Literal("ALBUM")]),
							title: t.String(),
							artist: t.String(),
							file: t.String(),
						})
					),
				}
			)
			.post(
				"/local-directory",
				async ({ body }) => {
					const savedDirectory = (await FolderPathModel.create({ path: body })).toJSON();

					if (savedDirectory) return savedDirectory;
				},
				{
					body: t.String(),
				}
			)
			.patch("/favorite", async ({ body }) => await MuzikSongModel.findByIdAndUpdate(body, { favorite: true }, { new: true }), {
				body: t.String(),
			})
			.patch("/unfavorite", async ({ body }) => await MuzikSongModel.findByIdAndUpdate(body, { favorite: false }, { new: true }), {
				body: t.String(),
			})
			.listen(3000);
	}
} catch (error) {
	throw new Error("could not run backend", { cause: error });
}

// newReleases: [
//   {
//     id: '15',
//     title: 'shodi eshgham',
//     artist: 'meysam ebrahimi',
//   },
//   {
//     id: '16',
//     title: 'gole niloofar',
//     artist: 'ragheb',
//   },
//   {
//     id: '17',
//     title: 'hala hey',
//     artist: 'armin zareei',
//   },
//   {
//     id: '18',
//     title: '',
//     artist: '',
//   },
//   {
//     id: '19',
//     title: '',
//     artist: '',
//   },
//   {
//     id: '20',
//     title: '',
//     artist: '',
//   },
//   {
//     id: '21',
//     title: '',
//     artist: '',
//   },
// ],

// recommended: [
//   {
//     id: '1',
//     type: 'ALBUM',
//     parentalAdvisory: true,
//     title: 'manam oon ke maghroor',
//     artist: 'shayea',
//     coArtists: [],
//     album: 'injaneb',
//     image: 'http://localhost:3000/image/shayea_injaneb.webp',
//     file: 'http://localhost:3000/song/shayea_manam-oon-ke-maghroor.mp3',
//   },
//   {
//     id: '2',
//     type: 'SINGLE',
//     parentalAdvisory: true,
//     title: 'miri tu lak',
//     artist: 'reza pishro',
//     coArtists: ['ho3ein'],
//     album: '',
//     image: 'http://localhost:3000/image/reza-pishro_miri-tu-lak.webp',
//     file: 'http://localhost:3000/song/reza-pishro_miri-tu-lak.mp3',
//   },
//   {
//     id: '3',
//     type: 'SINGLE',
//     parentalAdvisory: true,
//     title: 'gangesh balas',
//     artist: 'sohrab MJ',
//     coArtists: [],
//     album: '',
//     image: 'http://localhost:3000/image/sohrab-mj_gangesh-balas.webp',
//     file: 'http://localhost:3000/song/sohrab-mj_gangesh-balas.mp3',
//   },
//   {
//     id: '4',
//     type: 'SINGLE',
//     parentalAdvisory: false,
//     title: 'paghadam',
//     artist: 'alireza talischi',
//     coArtists: [],
//     album: '',
//     image: 'http://localhost:3000/image/alireza-talischi_paghadam.webp',
//     file: 'http://localhost:3000/song/alireza-talischi_paghadam.mp3',
//   },
//   {
//     id: '5',
//     type: 'SINGLE',
//     parentalAdvisory: false,
//     title: 'bi ehsas (instrumental)',
//     artist: 'shadmehr aghili',
//     coArtists: [],
//     album: '',
//     image:
//       'http://localhost:3000/image/shadmehr-aghili_bi-ehsas-instrumental.webp',
//     file: 'http://localhost:3000/song/shadmehr-aghili_bi-ehsas-instrumental.mp3',
//   },
//   {
//     id: '6',
//     type: 'SINGLE',
//     parentalAdvisory: false,
//     title: 'ghabe akse khali',
//     artist: 'sirvan khosravi',
//     coArtists: [],
//     album: '',
//     image:
//       'http://localhost:3000/image/sirvan-khosravi_ghabe-akse-khali.webp',
//     file: 'http://localhost:3000/song/sirvan-khosravi_ghabe-akse-khali.mp3',
//   },
//   {
//     id: '7',
//     type: 'SINGLE',
//     parentalAdvisory: false,
//     title: 'nagi ke nagoftam',
//     artist: 'farzad farzin',
//     coArtists: [],
//     album: '',
//     image:
//       'http://localhost:3000/image/farzad-farzin_nagi-ke-nagoftam.webp',
//     file: 'http://localhost:3000/song/farzad-farzin_nagi-ke-nagoftam.mp3',
//   },
// ]

// topTracks: [
//   {
//     id: '8',
//     type: 'SINGLE',
//     parentalAdvisory: false,
//     title: 'ghermez',
//     artist: 'garsha rezaei',
//     coArtists: [],
//     album: '',
//     image: 'http://localhost:3000/image/garsha-rezaei_ghermez.webp',
//     file: 'http://localhost:3000/song/garsha-rezaei_ghermez.mp3',
//   },
//   {
//     id: '9',
//     type: 'SINGLE',
//     parentalAdvisory: false,
//     title: 'ba toam',
//     artist: 'naser zeynali',
//     coArtists: [],
//     album: '',
//     image: 'http://localhost:3000/image/naser-zeynali_ba-toam.webp',
//     file: 'http://localhost:3000/song/naser-zeynali_ba-toam.mp3',
//   },
//   {
//     id: '10',
//     type: 'SINGLE',
//     parentalAdvisory: false,
//     title: 'shookhi nadaram',
//     artist: 'sohrab pakzad',
//     coArtists: ['asef aria'],
//     album: '',
//     image:
//       'http://localhost:3000/image/sohrab-pakzad_shookhi-nadaram.webp',
//     file: 'http://localhost:3000/song/sohrab-pakzad_shookhi-nadaram.mp3',
//   },
//   {
//     id: '11',
//     type: 'SINGLE',
//     parentalAdvisory: false,
//     title: 'dastan',
//     artist: 'asef aria',
//     coArtists: [],
//     album: '',
//     image: 'http://localhost:3000/image/asef-aria_dastan.webp',
//     file: 'http://localhost:3000/song/asef-aria_dastan.mp3',
//   },
//   {
//     id: '12',
//     type: 'SINGLE',
//     parentalAdvisory: false,
//     title: 'vasalam',
//     artist: 'macan band',
//     coArtists: [],
//     album: '',
//     image: 'http://localhost:3000/image/macan-band_vasalam.webp',
//     file: 'http://localhost:3000/song/macan-band_vasalam.mp3',
//   },
//   {
//     id: '13',
//     type: 'ALBUM',
//     parentalAdvisory: true,
//     title: 'yelkhi',
//     artist: 'shayea',
//     coArtists: ['zaal'],
//     album: 'amadebash',
//     image: 'http://localhost:3000/image/shayea_amadebash.webp',
//     file: 'http://localhost:3000/song/shayea_yelkhi.mp3',
//   },
//   {
//     id: '14',
//     type: 'ALBUM',
//     parentalAdvisory: true,
//     title: 'vel kon',
//     artist: 'shayea',
//     coArtists: ['amir khalvat'],
//     album: 'amadebash',
//     image: 'http://localhost:3000/image/shayea_amadebash.webp',
//     file: 'http://localhost:3000/song/shayea_vel-kon.mp3',
//   },
// ]
