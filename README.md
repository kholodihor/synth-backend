# Synth Backend API

A high-performance backend API for a music application, built with Node.js, Express, and TypeScript. This API provides the foundation for managing bands, songs, users, and media content.

## 🚀 Features

- **User Authentication** - JWT-based authentication system
- **File Uploads** - Support for media file uploads using Cloudinary
- **Caching** - Redis integration for improved performance
- **Database** - MongoDB with Mongoose for data persistence
- **Type Safety** - Built with TypeScript for better developer experience
- **Validation** - Request validation using Joi
- **Security** - Helmet and CORS for enhanced security

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis
- **File Storage**: Cloudinary
- **Authentication**: JWT
- **API Documentation**: (Add if you have Swagger/OpenAPI)

## 📦 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB instance
- Redis server
- Cloudinary account (for file storage)

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/synth-backend.git
   cd synth-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   REDIS_URL=your_redis_connection_string
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   PORT=4000
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

The server will start at `http://localhost:4000`

### Production Build
```bash
npm run build
npm start
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Bands
- `GET /api/bands` - Get all bands
- `POST /api/bands` - Create a new band
- `GET /api/bands/:id` - Get band by ID
- `PUT /api/bands/:id` - Update band
- `DELETE /api/bands/:id` - Delete band

### Songs
- `GET /api/songs` - Get all songs
- `POST /api/songs` - Create a new song
- `GET /api/songs/:id` - Get song by ID
- `PUT /api/songs/:id` - Update song
- `DELETE /api/songs/:id` - Delete song

### Media
- `POST /api/uploads` - Upload media files
- `GET /uploads/:filename` - Access uploaded files

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Redis](https://redis.io/)
- [Cloudinary](https://cloudinary.com/)

## 📧 Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter) - your.email@example.com

Project Link: [https://github.com/yourusername/synth-backend](https://github.com/yourusername/synth-backend)
