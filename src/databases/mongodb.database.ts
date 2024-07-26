import mongoose from "mongoose";

const URI = "mongodb+srv://node_server:BiePAENn1l3OgKoD@virtukala.k8lka.mongodb.net/mytunes?retryWrites=true&w=majority";

// ! for production set the first two options to false !
mongoose.set({ debug: true, autoIndex: true, strictQuery: false });

export const mongooseConnection = () => mongoose.connect(URI);
