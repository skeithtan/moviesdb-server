import mongoose from "mongoose";

export const RatingSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    reviewerUsername: {
        type: String,
        required: true
    },
    reviewerName: {
        type: String,
        required: true
    },
    postDate: {
        type: Date,
        required: true,
        default: Date.now
    }
});

export const MovieRating = mongoose.model("MovieRating", RatingSchema);