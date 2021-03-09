import Koa from "koa";
import Logger from "koa-logger";
import jwt from "koa-jwt";
import cors from "@koa/cors";
import BodyParser from "koa-bodyparser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import {movieRouter} from "./routes/movie.mjs";
import {catchUnknownErrors, catchValidationErrors} from "./middlewares/error.mjs";
import {authRouter} from "./routes/auth.mjs";

dotenv.config();
const app = new Koa();
const {SERVER_PORT, JWT_SECRET, MONGODB_URL} = process.env;

app.use(Logger());
app.use(BodyParser());
app.use(cors({ "Access-Control-Allow-Origin": "*" }));
app.use(jwt({secret: JWT_SECRET, passthrough: true}));
app.use(catchUnknownErrors);
app.use(catchValidationErrors);

app.use(movieRouter.routes());
app.use(authRouter.routes());

console.log("Connecting to the database...");
mongoose.connect(MONGODB_URL, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => {
        console.log("Connected.");
        app.listen(SERVER_PORT).on("listening", () => {
            console.log(`Server listening at port ${SERVER_PORT}...`);
        });
    });

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));


