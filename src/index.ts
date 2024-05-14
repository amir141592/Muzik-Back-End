import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";

import { mongooseConnection } from "./databases/mongodb.database";

import MuzikSongModel from "./models/mongoose/muzik-song.model";
import FolderPathModel from "./models/mongoose/folder-path.model";

try {
	if (await mongooseConnection) {
		console.info("connected to mongoDB");

		new Elysia()
			.use(cors({ methods: "*" }))
			.onError(({ error }) => console.error(new Error("Ops! backend blew up", { cause: error })))
			.onStart(() => console.info(`🦊 Elysia is running at http://localhost:3000`))
			.get("/", () => "Hello Amir")
			.get("/add-test-songs", () => {
				MuzikSongModel.insertMany([
					{
						type: "ALBUM",
						parentalAdvisory: true,
						favorite: false,
						title: "manam oon ke maghroor",
						artist: "shayea",
						coArtists: [],
						album: "injaneb",
						image: "http://localhost:3000/image/shayea_injaneb.webp",
						file: "http://localhost:3000/song/shayea_manam-oon-ke-maghroor.mp3",
					},
					{
						type: "SINGLE",
						parentalAdvisory: true,
						favorite: false,
						title: "miri tu lak",
						artist: "reza pishro",
						coArtists: ["ho3ein"],
						album: "",
						image: "http://localhost:3000/image/reza-pishro_miri-tu-lak.webp",
						file: "http://localhost:3000/song/reza-pishro_miri-tu-lak.mp3",
					},
					{
						type: "SINGLE",
						parentalAdvisory: true,
						favorite: false,
						title: "gangesh balas",
						artist: "sohrab MJ",
						coArtists: [],
						album: "",
						image: "http://localhost:3000/image/sohrab-mj_gangesh-balas.webp",
						file: "http://localhost:3000/song/sohrab-mj_gangesh-balas.mp3",
					},
					{
						type: "SINGLE",
						parentalAdvisory: false,
						favorite: false,
						title: "paghadam",
						artist: "alireza talischi",
						coArtists: [],
						album: "",
						image: "http://localhost:3000/image/alireza-talischi_paghadam.webp",
						file: "http://localhost:3000/song/alireza-talischi_paghadam.mp3",
					},
					{
						type: "SINGLE",
						parentalAdvisory: false,
						favorite: false,
						title: "bi ehsas (instrumental)",
						artist: "shadmehr aghili",
						coArtists: [],
						album: "",
						image: "http://localhost:3000/image/shadmehr-aghili_bi-ehsas-instrumental.webp",
						file: "http://localhost:3000/song/shadmehr-aghili_bi-ehsas-instrumental.mp3",
					},
					{
						type: "SINGLE",
						parentalAdvisory: false,
						favorite: false,
						title: "ghabe akse khali",
						artist: "sirvan khosravi",
						coArtists: [],
						album: "",
						image: "http://localhost:3000/image/sirvan-khosravi_ghabe-akse-khali.webp",
						file: "http://localhost:3000/song/sirvan-khosravi_ghabe-akse-khali.mp3",
					},
					{
						type: "SINGLE",
						parentalAdvisory: false,
						favorite: false,
						title: "nagi ke nagoftam",
						artist: "farzad farzin",
						coArtists: [],
						album: "",
						image: "http://localhost:3000/image/farzad-farzin_nagi-ke-nagoftam.webp",
						file: "http://localhost:3000/song/farzad-farzin_nagi-ke-nagoftam.mp3",
					},
					{
						type: "SINGLE",
						parentalAdvisory: false,
						favorite: false,
						title: "ghermez",
						artist: "garsha rezaei",
						coArtists: [],
						album: "",
						image: "http://localhost:3000/image/garsha-rezaei_ghermez.webp",
						file: "http://localhost:3000/song/garsha-rezaei_ghermez.mp3",
					},
					{
						type: "SINGLE",
						parentalAdvisory: false,
						favorite: false,
						title: "ba toam",
						artist: "naser zeynali",
						coArtists: [],
						album: "",
						image: "http://localhost:3000/image/naser-zeynali_ba-toam.webp",
						file: "http://localhost:3000/song/naser-zeynali_ba-toam.mp3",
					},
					{
						type: "SINGLE",
						parentalAdvisory: false,
						favorite: false,
						title: "shookhi nadaram",
						artist: "sohrab pakzad",
						coArtists: ["asef aria"],
						album: "",
						image: "http://localhost:3000/image/sohrab-pakzad_shookhi-nadaram.webp",
						file: "http://localhost:3000/song/sohrab-pakzad_shookhi-nadaram.mp3",
					},
					{
						type: "SINGLE",
						parentalAdvisory: false,
						favorite: false,
						title: "dastan",
						artist: "asef aria",
						coArtists: [],
						album: "",
						image: "http://localhost:3000/image/asef-aria_dastan.webp",
						file: "http://localhost:3000/song/asef-aria_dastan.mp3",
					},
					{
						type: "SINGLE",
						parentalAdvisory: false,
						favorite: false,
						title: "vasalam",
						artist: "macan band",
						coArtists: [],
						album: "",
						image: "http://localhost:3000/image/macan-band_vasalam.webp",
						file: "http://localhost:3000/song/macan-band_vasalam.mp3",
					},
					{
						type: "ALBUM",
						parentalAdvisory: true,
						favorite: false,
						title: "yelkhi",
						artist: "shayea",
						coArtists: ["zaal"],
						album: "amadebash",
						image: "http://localhost:3000/image/shayea_amadebash.webp",
						file: "http://localhost:3000/song/shayea_yelkhi.mp3",
					},
					{
						type: "ALBUM",
						parentalAdvisory: true,
						favorite: false,
						title: "vel kon",
						artist: "shayea",
						coArtists: ["amir khalvat"],
						album: "amadebash",
						image: "http://localhost:3000/image/shayea_amadebash.webp",
						file: "http://localhost:3000/song/shayea_vel-kon.mp3",
					},
				]);
			})
			.get("/user-info", () => {
				return {
					id: "1",
					firstName: "Amir",
					lastName: "Allahdadian",
					email: "amir.allahdadian@gmail.com",
				};
			})
			.get("/user-image", () => Bun.file("./server/content/image/amir-image.jpg"))
			.get(
				"/muziks/home/recentlyPlayed",
				async () =>
					await MuzikSongModel.find()
						.where("_id")
						.in([
							"6600fdf5e7fdafbe4ee7aab8",
							"6600fdf5e7fdafbe4ee7aab9",
							"6600fdf5e7fdafbe4ee7aaba",
							"6600fdf5e7fdafbe4ee7aabb",
							"6600fdf5e7fdafbe4ee7aabc",
							"6600fdf5e7fdafbe4ee7aabd",
							"6600fdf5e7fdafbe4ee7aabe",
						])
						.exec()
			)
			.get(
				"/muziks/home/top-tracks",
				async () =>
					await MuzikSongModel.find()
						.where("_id")
						.in([
							"6600fdf5e7fdafbe4ee7aabf",
							"6600fdf5e7fdafbe4ee7aac0",
							"6600fdf5e7fdafbe4ee7aac1",
							"6600fdf5e7fdafbe4ee7aac2",
							"6600fdf5e7fdafbe4ee7aac3",
							"6600fdf5e7fdafbe4ee7aac4",
							"6600fdf5e7fdafbe4ee7aac5",
						])
						.exec()
			)
			.get("/folder-paths", async () => await FolderPathModel.find({}))
			.get("/image/:name", ({ params: { name } }) => Bun.file(import.meta.dir + `/content/image/${name}`))
			.get("/song/:name", ({ params: { name } }) =>
				Bun.file(import.meta.dir + `/content/music/${name.split("_")[0]}/${name.split("_")[1]}`)
			)
			.get("/video/:name", ({ params: { name } }) =>
				Bun.file(import.meta.dir + `/content/video/${name.split("_")[0]}/${name.split("_")[1]}`)
			)
			.post(
				"/local-song-paths",
				async ({ body: { directory, songs } }) => {
					const savedMuziks = await MuzikSongModel.create(songs);
					const savedDirectory = (await FolderPathModel.create({ path: directory })).toJSON();

					if (savedMuziks && savedDirectory) return { savedMuziks, savedDirectory };
				},
				{
					body: t.Object({
						directory: t.String(),
						songs: t.Array(
							t.Object({
								type: t.Union([t.Literal("SINGLE"), t.Literal("ALBUM")]),
								title: t.String(),
								artist: t.String(),
								file: t.String(),
							})
						),
					}),
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
