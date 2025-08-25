"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUser = exports.editUser = exports.loginUser = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const effect_1 = require("effect");
const user_model_1 = __importDefault(require("../models/user.model"));
const generateToken_1 = require("../utils/generateToken");
const redis_1 = require("../utils/redis");
// Custom error types for better error handling
class UserError extends Error {
    constructor(message) {
        super(message);
        this.name = "UserError";
    }
}
class UserExistsError extends UserError {
    constructor(email) {
        super(`User with email ${email} already exists`);
        this.name = "UserExistsError";
    }
}
class UserNotFoundError extends UserError {
    constructor(identifier) {
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
/**
 * Register a new user
 */
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    // Validate required fields
    if (!username || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Username, email, and password are required"
        });
    }
    // Create Effect program for user registration
    const program = effect_1.Effect.gen(function* (_) {
        // Check if user exists
        const existingUser = yield* _(effect_1.Effect.tryPromise({
            try: () => user_model_1.default.findOne({ email }),
            catch: (error) => new UserError(`Error checking existing user: ${error}`)
        }));
        if (existingUser) {
            throw new UserExistsError(email);
        }
        // Hash password
        const salt = yield* _(effect_1.Effect.tryPromise({
            try: () => bcrypt_1.default.genSalt(10),
            catch: (error) => new UserError(`Error generating salt: ${error}`)
        }));
        const hashedPassword = yield* _(effect_1.Effect.tryPromise({
            try: () => bcrypt_1.default.hash(password, salt),
            catch: (error) => new UserError(`Error hashing password: ${error}`)
        }));
        // Create and save user
        const user = new user_model_1.default({
            username,
            email,
            password: hashedPassword,
        });
        const savedUser = yield* _(effect_1.Effect.tryPromise({
            try: () => user.save(),
            catch: (error) => new UserError(`Error saving user: ${error}`)
        }));
        // Generate token and return user data
        const token = (0, generateToken_1.generateToken)(savedUser._id);
        return {
            _id: savedUser._id,
            username: savedUser.username,
            email: savedUser.email,
            token
        };
    });
    try {
        const result = await effect_1.Effect.runPromise(effect_1.Effect.match(program, {
            onSuccess: (user) => ({ success: true, user }),
            onFailure: (error) => {
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
        }));
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to register user'
        });
    }
};
exports.registerUser = registerUser;
/**
 * Login user
 */
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    // Validate required fields
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required"
        });
    }
    // Create Effect program for user login
    const program = effect_1.Effect.gen(function* (_) {
        // Find user by email
        const user = yield* _(effect_1.Effect.tryPromise({
            try: async () => {
                const user = await user_model_1.default.findOne({ email });
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
        }));
        // Compare password
        yield* _(effect_1.Effect.tryPromise({
            try: async () => {
                const match = await bcrypt_1.default.compare(password, user.password);
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
        }));
        // Generate token
        const token = (0, generateToken_1.generateToken)(user._id);
        // Cache user data
        yield* _(effect_1.Effect.tryPromise({
            try: () => redis_1.RedisService.setWithTTL(`user:${user._id}`, JSON.stringify(user)),
            catch: (error) => new UserError(`Error caching user data: ${error}`)
        }));
        // Return user data
        return {
            _id: user._id,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl,
            token
        };
    });
    try {
        const result = await effect_1.Effect.runPromise(effect_1.Effect.match(program, {
            onSuccess: (user) => ({ success: true, user }),
            onFailure: (error) => {
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
        }));
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to login user'
        });
    }
};
exports.loginUser = loginUser;
/**
 * Edit user
 */
const editUser = async (req, res) => {
    const userId = req.userId;
    // Create Effect program for user update
    const program = effect_1.Effect.gen(function* (_) {
        // Update user
        const updatedUser = yield* _(effect_1.Effect.tryPromise({
            try: async () => {
                const user = await user_model_1.default.findByIdAndUpdate(userId, { $set: req.body }, { new: true });
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
        }));
        // Update cache
        yield* _(effect_1.Effect.tryPromise({
            try: () => redis_1.RedisService.setWithTTL(`user:${userId}`, JSON.stringify(updatedUser)),
            catch: (error) => new UserError(`Error updating user cache: ${error}`)
        }));
        // Return user data
        return {
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            avatarUrl: updatedUser.avatarUrl
        };
    });
    try {
        const result = await effect_1.Effect.runPromise(effect_1.Effect.match(program, {
            onSuccess: (user) => ({ success: true, user }),
            onFailure: (error) => {
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
        }));
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to update user'
        });
    }
};
exports.editUser = editUser;
/**
 * Get user details
 */
const getUser = async (req, res) => {
    const userId = req.userId;
    // Create Effect program for getting user
    const program = effect_1.Effect.gen(function* (_) {
        // Try to get user from cache
        const cachedUserData = yield* _(effect_1.Effect.tryPromise({
            try: () => redis_1.RedisService.get(`user:${userId}`),
            catch: (error) => new UserError(`Error getting user from cache: ${error}`)
        }));
        // If user is in cache, return it
        if (cachedUserData) {
            const user = JSON.parse(cachedUserData);
            return {
                _id: user._id,
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl
            };
        }
        // Otherwise get from database
        const user = yield* _(effect_1.Effect.tryPromise({
            try: async () => {
                const user = await user_model_1.default.findById(userId);
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
        }));
        // Cache user data
        yield* _(effect_1.Effect.tryPromise({
            try: () => redis_1.RedisService.setWithTTL(`user:${userId}`, JSON.stringify(user)),
            catch: (error) => new UserError(`Error caching user data: ${error}`)
        }));
        // Return user data
        return {
            _id: user._id,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl
        };
    });
    try {
        const result = await effect_1.Effect.runPromise(effect_1.Effect.match(program, {
            onSuccess: (user) => ({ success: true, user }),
            onFailure: (error) => {
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
        }));
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to get user'
        });
    }
};
exports.getUser = getUser;
