import mongoose from 'mongoose';

interface ITopSong {
  title: string;
  artist: string;
  song: string;
  user: string;
}

const TopSongSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    artist: {
      type: String,
      required: true,
    },
    song: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ITopSong>('TopSongs', TopSongSchema);
