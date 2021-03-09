import Router from "@koa/router";
import {requireRoles, requireSignIn} from "../middlewares/auth.mjs";
import {Movie} from "../models/movie.mjs";
import {SeenMovie} from "../models/seenMovie.mjs";
import {StatusCodes} from "http-status-codes";
import {withMovie} from "../middlewares/movie.mjs";

export const movieRouter = new Router().prefix("/movies");
const MOVIE_QUERY_LIMIT = 12;
const RECOMMENDATION_LAST_SEEN_LIMIT = 5;

const PERMISSIONS = {
    CREATE_MOVIES: "CREATE_MOVIES",
    MODIFY_MOVIES: "MODIFY_MOVIES",
    VIEW_MOVIES: "VIEW_MOVIES",
    RATE_MOVIES: "RATE_MOVIES"
};

// ANCHOR: - Last seen movies
movieRouter.get("/last-seen", requireSignIn, requireRoles([PERMISSIONS.VIEW_MOVIES]), async ctx => {
    const {user: {username}} = ctx.state;

    const lastSeen = await SeenMovie.find({viewerUsername: username})
        .sort({dateSeen: "descending"})
        .limit(MOVIE_QUERY_LIMIT)
        .exec();

    const ids = lastSeen.map(({movieId}) => movieId);

    ctx.status = StatusCodes.OK;
    ctx.body = ids.length === 0 ? [] :
        await Movie.find()
            .where('_id')
            .in(ids)
            .exec();

});

// ANCHOR: - New movies
movieRouter.get("/new", requireSignIn, requireRoles([PERMISSIONS.VIEW_MOVIES]), async ctx => {
    ctx.body = await Movie.find()
        .sort({dateAdded: "descending"})
        .limit(MOVIE_QUERY_LIMIT)
        .exec();

    ctx.status = StatusCodes.OK;
});

// ANCHOR: - Recommended movies for the user
// NOTE: Works by checking last seen movie categories, then searching for new movies
movieRouter.get("/recommendations", requireSignIn, requireRoles([PERMISSIONS.VIEW_MOVIES]), async ctx => {
    const {user: {username}} = ctx.state;
    const lastSeen = await SeenMovie.find({viewerUsername: username})
        .sort({dateSeen: "descending"})
        .limit(RECOMMENDATION_LAST_SEEN_LIMIT)
        .exec();

    const ids = lastSeen.map(({movieId}) => movieId);

    const lastSeenMovies = await Movie.find()
        .where('_id')
        .in(ids)
        .exec();

    function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    const lastSeenGenres = lastSeenMovies
        .map(movie => movie.categories)
        .flat()
        .filter(onlyUnique);

    ctx.body = await Movie.aggregate([
        {
            $addFields: {
                categoryCount: {
                    $size: {
                        $setIntersection: [lastSeenGenres, "$categories"]
                    }
                }
            }
        },
        {
            $match: {
                categoryCount: {$gt: 0},
                _id: {$nin: ids}
            }
        },
        {$sort: {categoryCount: -1}},
        {$project: {categoryCount: 0}},
        {$limit: MOVIE_QUERY_LIMIT}
    ]);

    ctx.status = StatusCodes.OK;
});

// ANCHOR: - Most popular movies
// NOTE: Popular means viewed by the most amount of people, i.e., not counting re-watches
movieRouter.get("/most-popular", requireSignIn, requireRoles([PERMISSIONS.VIEW_MOVIES]), async ctx => {
    const MAX_DAYS = 15;
    const mostSeen = await SeenMovie
        .aggregate([
            {
                $match: {
                    dateSeen: {
                        $gte: new Date((new Date().getTime() - (MAX_DAYS * 24 * 60 * 60 * 1000)))
                    }
                }
            },
            {
                $group: {
                    _id: "$movieId",
                    count: {$sum: 1}
                }
            }
        ])
        .sort({count: "descending"})
        .exec();

    const ids = mostSeen.map(({_id}) => _id);

    ctx.body = await Movie.find()
        .where('_id')
        .in(ids)
        .exec();

    ctx.status = StatusCodes.OK;
});

// ANCHOR: - Create movies
movieRouter.post("/", requireSignIn, requireRoles([PERMISSIONS.CREATE_MOVIES]), async ctx => {
    const {request: {body}} = ctx;
    const movie = ctx.body = await Movie.create(body);
    ctx.status = movie ? StatusCodes.CREATED : StatusCodes.BAD_REQUEST;
});

// ANCHOR: - Get all movies
movieRouter.get("/", requireSignIn, requireRoles([PERMISSIONS.VIEW_MOVIES]), async ctx => {
    ctx.body = await Movie.find({});
    ctx.status = StatusCodes.OK;
});

// ANCHOR: - Get movie by ID
movieRouter.get(
    "/:movieId",
    requireSignIn,
    requireRoles([PERMISSIONS.VIEW_MOVIES]),
    withMovie("movieId"),
    async ctx => {
        ctx.body = ctx.state.movie;
        ctx.status = StatusCodes.OK;
    }
);

// ANCHOR: - Create movie rating
movieRouter.post(
    "/:movieId/ratings",
    requireSignIn,
    requireRoles([PERMISSIONS.RATE_MOVIES]),
    withMovie("movieId"),
    async ctx => {
        const {request: {body}, state: {movie, user: {username, name}}} = ctx;
        let ratings = Array.isArray(movie.ratings) ? movie.ratings : [];

        // Remove all old reviews by same user, to be replaced by new one
        ratings = ratings.filter(({reviewerUsername}) => reviewerUsername !== username);

        const rating = ctx.body = {
            ...body,
            reviewerUsername: username,
            reviewerName: name,
            postDate: Date.now()
        };

        ratings.push(rating);
        movie.ratings = ratings;
        await movie.save();
        ctx.status = StatusCodes.CREATED;
    }
);

movieRouter.post(
    "/:movieId/watch",
    requireSignIn,
    requireRoles([PERMISSIONS.VIEW_MOVIES]),
    withMovie("movieId"),
    async ctx => {
        const {state: {movie, user}} = ctx;
        ctx.body = await new SeenMovie({
            movieId: movie._id,
            viewerUsername: user.username
        }).save();
        ctx.status = StatusCodes.OK;
    }
);