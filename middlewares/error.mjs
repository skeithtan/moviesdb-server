import {StatusCodes} from "http-status-codes";

export const catchValidationErrors = async (ctx, next) => {
    try {
        await next();
    } catch (error) {
        if (error.name === "ValidationError") {
            ctx.status = StatusCodes.BAD_REQUEST;
            ctx.body = error.errors;
        } else {
            throw error;
        }
    }
};

export const catchUnknownErrors = async (ctx, next) => {
    try {
        await next();
    } catch (error) {
        console.log("Unknown error occurred", error.message);
        ctx.status = StatusCodes.INTERNAL_SERVER_ERROR;
        ctx.body = {
            error: "An unknown error has occurred"
        };
    }
};