import { RequestHandler } from "express";
import { Effect } from "effect";
import bcrypt from "bcrypt";
import UserModel from "../models/user.model";
import { generateToken } from "../utils/generateToken";
import { RedisService } from "../utils/redis";

// Error classes for better error handling
class UserNotFoundError extends Error {
  readonly _tag = 'UserNotFoundError';
  constructor(message: string = 'User not found') {
    super(message);
  }
}

class AuthenticationError extends Error {
  readonly _tag = 'AuthenticationError';
  constructor(message: string = 'Authentication failed') {
    super(message);
  }
}

class UserExistsError extends Error {
  readonly _tag = 'UserExistsError';
  constructor(message: string = 'User already exists') {
    super(message);
  }
}

// Effect-based user registration
const registerUserEffect = (username: string, email: string, password: string) => {
  return Effect.tryPromise({
    try: async () => {
      // Check if user exists
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        throw new UserExistsError('User with this email already exists');
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create and save user
      const user = new UserModel({
        username,
        email,
        password: hashedPassword,
      });
      
      const savedUser = await user.save();
      
      // Return user data with token
      return {
        _id: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
        token: generateToken(savedUser._id),
      };
    },
    catch: (error) => {
      if (error instanceof UserExistsError) {
        return error;
      }
      return new Error(`Failed to register user: ${error}`);
    }
  });
};

// Effect-based user login
const loginUserEffect = (email: string, password: string) => {
  return Effect.tryPromise({
    try: async () => {
      // Find user
      const user = await UserModel.findOne({ email });
      if (!user) {
        throw new UserNotFoundError('No registered user with the email');
      }
      
      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new AuthenticationError('Incorrect Login or Password');
      }
      
      const token = generateToken(user._id);
      
      // Cache user data
      await RedisService.setWithTTL(`user:${user._id}`, {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl
      });
      
      // Return user data with token
      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        token,
      };
    },
    catch: (error) => {
      if (error instanceof UserNotFoundError || error instanceof AuthenticationError) {
        return error;
      }
      return new Error(`Failed to login user: ${error}`);
    }
  });
};

// Effect-based user update
const updateUserEffect = (userId: string, userData: any) => {
  return Effect.tryPromise({
    try: async () => {
      // Update user
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { $set: userData },
        { new: true }
      );
      
      if (!user) {
        throw new UserNotFoundError();
      }
      
      // Update cache with only the necessary fields
      await RedisService.setWithTTL(`user:${userId}`, {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl
      });
      
      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl
      };
    },
    catch: (error) => {
      if (error instanceof UserNotFoundError) {
        return error;
      }
      return new Error(`Failed to update user: ${error}`);
    }
  });
};

// Effect-based get user
const getUserEffect = (userId: string) => {
  return Effect.tryPromise({
    try: async () => {
      console.log(`Getting user with ID: ${userId}`);
      
      // Try to get from cache first
      const cachedUser = await RedisService.get(`user:${userId}`);
      
      if (cachedUser) {
        console.log(`Retrieved user from cache: ${userId}`, cachedUser);
        
        // Return user data from cache
        return {
          _id: cachedUser._id,
          username: cachedUser.username,
          email: cachedUser.email,
          avatarUrl: cachedUser.avatarUrl,
        };
      }
      
      // Get from database if not in cache
      const user = await UserModel.findById(userId);
      
      if (!user) {
        throw new UserNotFoundError();
      }
      
      console.log(`Retrieved user from database: ${userId}`);
      
      // Cache the user data with only the necessary fields
      const userData = {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl
      };
      
      await RedisService.setWithTTL(`user:${userId}`, userData);
      
      return userData;
    },
    catch: (error) => {
      console.error(`Error getting user: ${error}`);
      if (error instanceof UserNotFoundError) {
        return error;
      }
      return new Error(`Failed to get user: ${error}`);
    }
  });
};

// Express controller handlers
export const registerUser: RequestHandler = async (req, res) => {
  const { username, email, password } = req.body;
  
  Effect.runPromise(registerUserEffect(username, email, password))
    .then(user => {
      res.status(201).json(user);
    })
    .catch(error => {
      if (error._tag === 'UserExistsError') {
        // Use status 409 Conflict for resource already exists
        res.status(409).json({ 
          success: false,
          message: error.message,
          field: 'email' // Indicate which field caused the error
        });
      } else {
        console.error('Error in registerUser controller:', error);
        res.status(500).json({ 
          success: false,
          message: "Failed to register user",
          error: error.message || 'Unknown error'
        });
      }
    });
};

export const loginUser: RequestHandler = async (req, res) => {
  const { email, password } = req.body;
  
  Effect.runPromise(loginUserEffect(email, password))
    .then(user => {
      res.json({
        success: true,
        ...user
      });
    })
    .catch(error => {
      if (error._tag === 'UserNotFoundError') {
        res.status(404).json({ 
          success: false,
          message: error.message,
          field: 'email'
        });
      } else if (error._tag === 'AuthenticationError') {
        res.status(401).json({ 
          success: false,
          message: error.message,
          field: 'password'
        });
      } else {
        console.error('Error in loginUser controller:', error);
        res.status(500).json({ 
          success: false,
          message: "Failed to login user",
          error: error.message || 'Unknown error'
        });
      }
    });
};

export const editUser: RequestHandler = async (req, res) => {
  const userId = req.userId as string;
  console.log('Edit user request for userId:', userId);
  
  Effect.runPromise(updateUserEffect(userId, req.body))
    .then(user => {
      res.json({
        success: true,
        ...user
      });
    })
    .catch(error => {
      if (error._tag === 'UserNotFoundError') {
        res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      } else if (error._tag === 'UserExistsError') {
        res.status(409).json({ 
          success: false,
          message: error.message,
          field: 'email'
        });
      } else {
        console.error('Error in editUser controller:', error);
        res.status(500).json({ 
          success: false,
          message: "Failed to update user",
          error: error.message || 'Unknown error'
        });
      }
    });
};

export const getUser: RequestHandler = async (req, res) => {
  const userId = req.userId as string;
  console.log('Get user request for userId:', userId);
  
  if (!userId) {
    return res.status(403).json({ 
      success: false,
      message: "User ID not provided" 
    });
  }
  
  Effect.runPromise(getUserEffect(userId))
    .then(user => {
      console.log('Sending user response:', user);
      res.json({
        success: true,
        ...user
      });
    })
    .catch(error => {
      if (error._tag === 'UserNotFoundError') {
        res.status(404).json({ 
          success: false,
          message: "User not found" 
        });
      } else {
        console.error('Error in getUser controller:', error);
        res.status(500).json({ 
          success: false,
          message: "Failed to get user",
          error: error.message || 'Unknown error'
        });
      }
    });
};