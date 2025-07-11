import bcrypt from "bcrypt";
import { RequestHandler } from "express";
import { Effect } from "effect";
import UserModel from "../models/user.model";
import { generateToken } from "../utils/generateToken";
import { RedisService } from "../utils/redis";

// Custom error types for better error handling
class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserError";
  }
}

class UserExistsError extends UserError {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
    this.name = "UserExistsError";
  }
}

class UserNotFoundError extends UserError {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`);
    this.name = "UserNotFoundError";
  }
}

class InvalidCredentialsError extends UserError {
  constructor() {
    super("Invalid login credentials");
    this.name = "InvalidCredentialsError";
  }
}

// Types for user responses
interface UserResponse {
  _id: string | any; // Allow both string and ObjectId
  username: string;
  email: string;
  token?: string;
  avatarUrl?: string;
}

/**
 * Register a new user
 */
export const registerUser: RequestHandler = async (req, res) => {
  const { username, email, password } = req.body;

  // Validate required fields
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Username, email, and password are required"
    });
  }

  // Create Effect program for user registration
  const program = Effect.gen(function* (_) {
    // Check if user exists
    const existingUser = yield* _(
      Effect.tryPromise({
        try: () => UserModel.findOne({ email }),
        catch: (error) => new UserError(`Error checking existing user: ${error}`)
      })
    );

    if (existingUser) {
      throw new UserExistsError(email);
    }

    // Hash password
    const salt = yield* _(
      Effect.tryPromise({
        try: () => bcrypt.genSalt(10),
        catch: (error) => new UserError(`Error generating salt: ${error}`)
      })
    );

    const hashedPassword = yield* _(
      Effect.tryPromise({
        try: () => bcrypt.hash(password, salt),
        catch: (error) => new UserError(`Error hashing password: ${error}`)
      })
    );

    // Create and save user
    const user = new UserModel({
      username,
      email,
      password: hashedPassword,
    });

    const savedUser = yield* _(
      Effect.tryPromise({
        try: () => user.save(),
        catch: (error) => new UserError(`Error saving user: ${error}`)
      })
    );

    // Generate token and return user data
    const token = generateToken(savedUser._id);

    return {
      _id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      token
    } as UserResponse;
  });

  // Run the Effect program
  type RegisterResult = 
    | { success: true; user: UserResponse }
    | { success: false; error: string; statusCode: number };

  try {
    const result = await Effect.runPromise(
      Effect.match(program, {
        onSuccess: (user): RegisterResult => ({ success: true, user }),
        onFailure: (error): RegisterResult => {
          console.error('Registration error:', error);
          
          if (error instanceof UserExistsError) {
            return { 
              success: false, 
              error: error.message,
              statusCode: 409 // Conflict
            };
          }
          
          return { 
            success: false, 
            error: error.message,
            statusCode: 500 
          };
        }
      })
    );

    if (!result.success) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.error
      });
    }

    res.status(201).json({
      success: true,
      ...result.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to register user'
    });
  }
};

/**
 * Login user
 */
export const loginUser: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required"
    });
  }

  // Create Effect program for user login
  const program = Effect.gen(function* (_) {
    // Find user by email
    const user = yield* _(
      Effect.tryPromise({
        try: async () => {
          const user = await UserModel.findOne({ email });
          if (!user) {
            throw new UserNotFoundError(email);
          }
          return user;
        },
        catch: (error) => {
          if (error instanceof UserNotFoundError) {
            return error;
          }
          return new UserError(`Error finding user: ${error}`);
        }
      })
    );

    // Compare password
    yield* _(
      Effect.tryPromise({
        try: async () => {
          const match = await bcrypt.compare(password, user.password);
          if (!match) {
            throw new InvalidCredentialsError();
          }
          return true;
        },
        catch: (error) => {
          if (error instanceof InvalidCredentialsError) {
            return error;
          }
          return new UserError(`Error comparing password: ${error}`);
        }
      })
    );

    // Generate token
    const token = generateToken(user._id);

    // Cache user data
    yield* _(
      Effect.tryPromise({
        try: () => RedisService.setWithTTL(`user:${user._id}`, JSON.stringify(user)),
        catch: (error) => new UserError(`Error caching user data: ${error}`)
      })
    );

    // Return user data
    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      token
    } as UserResponse;
  });

  // Run the Effect program
  type LoginResult = 
    | { success: true; user: UserResponse }
    | { success: false; error: string; statusCode: number };

  try {
    const result = await Effect.runPromise(
      Effect.match(program, {
        onSuccess: (user): LoginResult => ({ success: true, user }),
        onFailure: (error): LoginResult => {
          console.error('Login error:', error);
          
          if (error instanceof UserNotFoundError) {
            return { 
              success: false, 
              error: "No registered user with this email",
              statusCode: 404
            };
          }
          
          if (error instanceof InvalidCredentialsError) {
            return { 
              success: false, 
              error: "Incorrect login or password",
              statusCode: 401
            };
          }
          
          return { 
            success: false, 
            error: error.message,
            statusCode: 500 
          };
        }
      })
    );

    if (!result.success) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      ...result.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to login user'
    });
  }
};

/**
 * Edit user
 */
export const editUser: RequestHandler = async (req, res) => {
  const userId = req.userId;
  
  // Create Effect program for user update
  const program = Effect.gen(function* (_) {
    // Update user
    const updatedUser = yield* _(
      Effect.tryPromise({
        try: async () => {
          const user = await UserModel.findByIdAndUpdate(
            userId,
            { $set: req.body },
            { new: true }
          );
          
          if (!user) {
            throw new UserNotFoundError(userId);
          }
          
          return user;
        },
        catch: (error) => {
          if (error instanceof UserNotFoundError) {
            return error;
          }
          return new UserError(`Error updating user: ${error}`);
        }
      })
    );

    // Update cache
    yield* _(
      Effect.tryPromise({
        try: () => RedisService.setWithTTL(`user:${userId}`, JSON.stringify(updatedUser)),
        catch: (error) => new UserError(`Error updating user cache: ${error}`)
      })
    );

    // Return user data
    return {
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      avatarUrl: updatedUser.avatarUrl
    } as UserResponse;
  });

  // Run the Effect program
  type EditResult = 
    | { success: true; user: UserResponse }
    | { success: false; error: string; statusCode: number };

  try {
    const result = await Effect.runPromise(
      Effect.match(program, {
        onSuccess: (user): EditResult => ({ success: true, user }),
        onFailure: (error): EditResult => {
          console.error('User update error:', error);
          
          if (error instanceof UserNotFoundError) {
            return { 
              success: false, 
              error: error.message,
              statusCode: 404
            };
          }
          
          return { 
            success: false, 
            error: error.message,
            statusCode: 500 
          };
        }
      })
    );

    if (!result.success) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      ...result.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update user'
    });
  }
};

/**
 * Get user details
 */
export const getUser: RequestHandler = async (req, res) => {
  const userId = req.userId;
  
  // Create Effect program for getting user
  const program = Effect.gen(function* (_) {
    // Try to get user from cache
    const cachedUserData = yield* _(
      Effect.tryPromise({
        try: () => RedisService.get(`user:${userId}`),
        catch: (error) => new UserError(`Error getting user from cache: ${error}`)
      })
    );

    // If user is in cache, return it
    if (cachedUserData) {
      const user = JSON.parse(cachedUserData);
      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl
      } as UserResponse;
    }

    // Otherwise get from database
    const user = yield* _(
      Effect.tryPromise({
        try: async () => {
          const user = await UserModel.findById(userId);
          if (!user) {
            throw new UserNotFoundError(userId);
          }
          return user;
        },
        catch: (error) => {
          if (error instanceof UserNotFoundError) {
            return error;
          }
          return new UserError(`Error finding user: ${error}`);
        }
      })
    );

    // Cache user data
    yield* _(
      Effect.tryPromise({
        try: () => RedisService.setWithTTL(`user:${userId}`, JSON.stringify(user)),
        catch: (error) => new UserError(`Error caching user data: ${error}`)
      })
    );

    // Return user data
    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl
    } as UserResponse;
  });

  // Run the Effect program
  type GetUserResult = 
    | { success: true; user: UserResponse }
    | { success: false; error: string; statusCode: number };

  try {
    const result = await Effect.runPromise(
      Effect.match(program, {
        onSuccess: (user): GetUserResult => ({ success: true, user }),
        onFailure: (error): GetUserResult => {
          console.error('Get user error:', error);
          
          if (error instanceof UserNotFoundError) {
            return { 
              success: false, 
              error: error.message,
              statusCode: 404
            };
          }
          
          return { 
            success: false, 
            error: error.message,
            statusCode: 500 
          };
        }
      })
    );

    if (!result.success) {
      return res.status(result.statusCode).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      ...result.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get user'
    });
  }
};
