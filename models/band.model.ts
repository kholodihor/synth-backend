import mongoose from 'mongoose';

interface IBand {
  title: string;
  description: string;
  location: string;
  image: string;
  user: string;
}

const BandSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    location: {
      type: String,
    },
    image: {
      type: String,
      default: '',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IBand>('Band', BandSchema);
