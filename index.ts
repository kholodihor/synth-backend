import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import userRoute from './routes/user';
import bandRoute from './routes/bands';
import songRoute from './routes/songs';
import videoRoute from './routes/video';
import uploadsRoute from './routes/uploads';

dotenv.config();

const app: Express = express();

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors({origin:"*"}));

app.use('/uploads', express.static('uploads'));

app.use('/api', userRoute);
app.use('/api', bandRoute);
app.use('/api', songRoute);
app.use('/api', videoRoute);
app.use('/api', uploadsRoute);

mongoose.set('strictQuery', false);
mongoose
  .connect(process.env.MONGODB_URI as string, {})
  .then(() =>
    app.listen(process.env.PORT || 5000, () => {
      console.log('Server and Database are OK');
    })
  )
  .catch((err) => console.log('DB error', err));
