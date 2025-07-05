import { Types } from 'mongoose';

export interface Band {
  _id: Types.ObjectId;
  title: string;
  description: string;
  location: string;
  image: string;
  user: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface BandInput {
  title: string;
  description: string;
  location: string;
  image: string;
}

export interface PaginatedBands {
  bands: Band[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}
