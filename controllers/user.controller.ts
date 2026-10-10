import bcrypt from "bcrypt";
import { RequestHandler } from "express";
import UserModel from "../models/user.model";
import { generateToken } from "../utils/generateToken";
import { RedisService } from "../utils/redis";

const userCacheKey = (id: string) => `user:${id}`;

const toUserResponse = (user: { _id: unknown; username: string; email: string; avatarUrl?: string }) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  avatarUrl: user.avatarUrl,
});

export const registerUser: RequestHandler = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await new UserModel({ username, email, password: hashedPassword }).save();

    res.status(201).json({
      success: true,
      ...toUserResponse(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Failed to register user" });
  }
};

export const loginUser: RequestHandler = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "No registered user with this email" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect login or password" });
    }

    await RedisService.setWithTTL(userCacheKey(user._id.toString()), user);

    res.json({
      success: true,
      ...toUserResponse(user),
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Failed to login user" });
  }
};

export const editUser: RequestHandler = async (req, res) => {
  try {
    // Whitelist editable fields — never $set req.body wholesale
    const { username, avatarUrl } = req.body;
    const user = await UserModel.findByIdAndUpdate(
      req.userId,
      { $set: { username, avatarUrl } },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await RedisService.setWithTTL(userCacheKey(req.userId), user);

    res.json({ success: true, ...toUserResponse(user) });
  } catch (error) {
    console.error("Edit user error:", error);
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
};

export const getUser: RequestHandler = async (req, res) => {
  try {
    const cachedUser = await RedisService.get<{ _id: string; username: string; email: string; avatarUrl?: string }>(
      userCacheKey(req.userId)
    );
    if (cachedUser) {
      return res.json({ success: true, ...toUserResponse(cachedUser) });
    }

    const user = await UserModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await RedisService.setWithTTL(userCacheKey(req.userId), user);

    res.json({ success: true, ...toUserResponse(user) });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ success: false, message: "Failed to get user" });
  }
};
