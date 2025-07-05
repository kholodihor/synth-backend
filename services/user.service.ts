import { Effect, Context, Layer, Console } from 'effect';
import bcrypt from 'bcrypt';
import UserModel from '../models/user.model';
import { generateToken } from '../utils/generateToken';
import * as RedisService from './redis.service';

// Define error types for better error handling
export class UserNotFoundError extends Error {
  readonly _tag = 'UserNotFoundError';
  constructor(message: string = 'User not found') {
    super(message);
  }
}

export class AuthenticationError extends Error {
  readonly _tag = 'AuthenticationError';
  constructor(message: string = 'Authentication failed') {
    super(message);
  }
}

export class UserExistsError extends Error {
  readonly _tag = 'UserExistsError';
  constructor(message: string = 'User already exists') {
    super(message);
  }
}

// Define the interface for our User service
export interface UserService {
  register(username: string, email: string, password: string): Effect.Effect<never, Error | UserExistsError, any>;
  login(email: string, password: string): Effect.Effect<never, Error | UserNotFoundError | AuthenticationError, any>;
  update(userId: string, userData: any): Effect.Effect<never, Error | UserNotFoundError, any>;
  getById(userId: string): Effect.Effect<never, Error | UserNotFoundError, any>;
}

// Create a Context for the User service
export class UserServiceLive extends Context.Tag('UserService')<
  UserServiceLive,
  UserService
>() {}

// Implementation of the User service
class UserServiceImpl implements UserService {
  register(username: string, email: string, password: string): Effect.Effect<never, Error | UserExistsError, any> {
    return Effect.gen(function* (_) {
      // Check if user exists
      const existingUser = yield* _(
        Effect.tryPromise(() => UserModel.findOne({ email }))
          .pipe(Effect.mapError(error => new Error(`Failed to check existing user: ${error}`)))
      );
      
      if (existingUser) {
        return yield* _(Effect.fail(new UserExistsError('User with this email already exists')));
      }
      
      // Hash password
      const salt = yield* _(
        Effect.tryPromise(() => bcrypt.genSalt(10))
          .pipe(Effect.mapError(error => new Error(`Failed to generate salt: ${error}`)))
      );
      
      const hashedPassword = yield* _(
        Effect.tryPromise(() => bcrypt.hash(password, salt))
          .pipe(Effect.mapError(error => new Error(`Failed to hash password: ${error}`)))
      );
      
      // Create and save user
      const user = new UserModel({
        username,
        email,
        password: hashedPassword,
      });
      
      const savedUser = yield* _(
        Effect.tryPromise(() => user.save())
          .pipe(Effect.mapError(error => new Error(`Failed to save user: ${error}`)))
      );
      
      // Return user data with token
      return {
        _id: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
        token: generateToken(savedUser._id),
      };
    }).pipe(
      Effect.tap(() => Console.log(`User registered: ${email}`))
    );
  }
  
  login(email: string, password: string): Effect.Effect<never, Error | UserNotFoundError | AuthenticationError, any> {
    return Effect.gen(function* (_) {
      // Find user
      const user = yield* _(
        Effect.tryPromise(() => UserModel.findOne({ email }))
          .pipe(Effect.mapError(error => new Error(`Failed to find user: ${error}`)))
      );
      
      if (!user) {
        return yield* _(Effect.fail(new UserNotFoundError('No registered user with the email')));
      }
      
      // Compare password
      const isMatch = yield* _(
        Effect.tryPromise(() => bcrypt.compare(password, user.password))
          .pipe(Effect.mapError(error => new Error(`Failed to compare password: ${error}`)))
      );
      
      if (!isMatch) {
        return yield* _(Effect.fail(new AuthenticationError('Incorrect Login or Password')));
      }
      
      const token = generateToken(user._id);
      
      // Cache user data
      yield* _(RedisService.setWithTTL(`user:${user._id}`, user));
      
      // Return user data with token
      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        token,
      };
    }).pipe(
      Effect.tap(() => Console.log(`User logged in: ${email}`))
    );
  }
  
  update(userId: string, userData: any): Effect.Effect<never, Error | UserNotFoundError, any> {
    return Effect.gen(function* (_) {
      // Update user
      const user = yield* _(
        Effect.tryPromise(() => UserModel.findByIdAndUpdate(
          userId,
          { $set: userData },
          { new: true }
        ))
        .pipe(Effect.mapError(error => new Error(`Failed to update user: ${error}`)))
      );
      
      if (!user) {
        return yield* _(Effect.fail(new UserNotFoundError()));
      }
      
      // Update cache
      yield* _(RedisService.setWithTTL(`user:${userId}`, user));
      
      return user;
    }).pipe(
      Effect.tap(() => Console.log(`User updated: ${userId}`))
    );
  }
  
  getById(userId: string): Effect.Effect<never, Error | UserNotFoundError, any> {
    return Effect.gen(function* (_) {
      // Try to get from cache first
      const cachedUser = yield* _(RedisService.get(`user:${userId}`));
      
      if (cachedUser) {
        yield* _(Console.log(`Retrieved user from cache: ${userId}`));
        return {
          _id: cachedUser._id,
          username: cachedUser.username,
          email: cachedUser.email,
          avatarUrl: cachedUser.avatarUrl,
        };
      }
      
      // Get from database if not in cache
      const user = yield* _(
        Effect.tryPromise(() => UserModel.findById(userId))
          .pipe(Effect.mapError(error => new Error(`Failed to find user: ${error}`)))
      );
      
      if (!user) {
        return yield* _(Effect.fail(new UserNotFoundError()));
      }
      
      // Cache the user data
      yield* _(RedisService.setWithTTL(`user:${userId}`, user));
      
      return {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
      };
    }).pipe(
      Effect.tap(() => Console.log(`Retrieved user: ${userId}`))
    );
  }
}

// Create a Layer that provides the User service
export const UserLayer = Layer.succeed(
  UserServiceLive,
  new UserServiceImpl()
);

// Helper functions to use the User service without having to provide it explicitly
export const register = (username: string, email: string, password: string) =>
  Effect.flatMap(UserServiceLive, (service) => service.register(username, email, password));

export const login = (email: string, password: string) =>
  Effect.flatMap(UserServiceLive, (service) => service.login(email, password));

export const update = (userId: string, userData: any) =>
  Effect.flatMap(UserServiceLive, (service) => service.update(userId, userData));

export const getById = (userId: string) =>
  Effect.flatMap(UserServiceLive, (service) => service.getById(userId));