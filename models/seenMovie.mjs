import mongoose from "mongoose";

export const SeenMovieSchema = new mongoose.Schema({
    movieId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'Movie'
    },
    dateSeen: {
        type: Date,
        required: true,
        default: Date.now
    },
    viewerUsername: {
        type: String,
        required: true
    }
});

export const SeenMovie = mongoose.model("SeenMovie", SeenMovieSchema);