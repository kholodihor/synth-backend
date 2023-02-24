import bcrypt from 'bcrypt';
import { RequestHandler } from 'express';
import UserModel from '../models/UserModel';
import { generateToken } from '../utils/generateToken';

export const registerUser:RequestHandler = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await UserModel.findOne({ email });
    if (existingUser)
      return res
        .status(401)
        .json({ error: 'User with this email already exists' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new UserModel({
      username,
      email,
      password: hashedPassword,
    });
    await user.save();
    if (user) {
      res.status(201).json({
        _id: user.id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ error: 'Can`t register user' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Fail to register a user"
    });
  }
};

export const loginUser:RequestHandler = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ error: 'No registered user with the email' });
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user._id);
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token,
      });
    } else {
      res.status(401).json({ error: 'Incorrect Login or Pasword' });
    }
  } catch (error) {
    res.status(500).json({
      message: "Fail to login a user"
    });
  }
};

export const editUser:RequestHandler = async (req, res, next) => {
  try {
    const { username, avatarUrl } = req.body;
    await UserModel.findOneAndUpdate(
      { _id: req.userId },
      {
        username,
        avatarUrl,
      }
    );
    res.status(200).json({ message: `User ${username} Updated` });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Fail to edit a user"
    });
  }
};

export const getUser:RequestHandler = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Fail to get a user"
    });
  }
};
