import { Movie } from "../models/movie.mjs";  
import { StatusCodes } from "http-status-codes";


export const withMovie = movieParamName => async (ctx, next) => {
    const movieId = ctx.params[movieParamName];
    const movie = ctx.state.movie = await Movie.findById(movieId);
    
    if (!movie) {
        ctx.body = {
            error: `Could not find movie with ID ${movieId}`
        };
        ctx.status = StatusCodes.NOT_FOUND;
    } else {
        await next();
    }
}