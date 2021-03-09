import Router from "@koa/router";
import {requireSignIn} from "../middlewares/auth.mjs";
import {StatusCodes} from "http-status-codes";

export const authRouter = new Router().prefix("/users");

authRouter.get("/profile", requireSignIn, async ctx => {
    const profile = ctx.body = ctx.state.user;
    ctx.status = Boolean(profile) ? StatusCodes.OK : StatusCodes.FORBIDDEN;
});