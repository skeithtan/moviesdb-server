import mongoose from "mongoose";
import { RatingSchema } from "./rating.mjs";

const { model, Schema, Types } = mongoose;

export const MovieSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    dateAdded: {
        type: Date,
        required: true,
        default: Date.now
    },
    releaseDate: {
        type: Date,
        required: true
    },
    categories: [{ type: String }],
    director: {
        type: String,
        required: true
    },
    ratings: [RatingSchema],
    photoUrl: {
        type: String,
        required: true
    }
});

export const Movie = model('Movie', MovieSchema);