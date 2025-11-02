/**
 * Login Controller
 * 
 * Handles user login requests, validates credentials, and generates JWT tokens.
 * Part of the authentication system for the React application.
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from 'config';

let UserModel: any;

/**
 * Type definition for login query parameters
 */
interface LoginQuery {
  username?: string;
  password?: string;
}

/**
 * Handles user login requests
 * 
 * Validates username/password, hashes the password, checks against database,
 * and generates a JWT token for authenticated users.
 * 
 * @param req - Express request with username and password in query
 * @param res - Express response
 * @returns JSON response with JWT token or error message
 */
const login = async (req: Request<{}, {}, {}, LoginQuery>, res: Response): Promise<Response> => {
  const { username, password } = req.query;

  // Check if username and password are provided
  if (!username || !password) {
    console.log('Missing username or password');
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Create hash of password
    const sha384 = crypto.createHash('sha384');
    const hashedPassword = sha384.update(password).digest('hex');

    // Find the user by username and hashed password
    const user = await UserModel.findOne({ username, password: hashedPassword }).exec();

    if (!user) {
      console.log('Invalid credentials');
      return res.status(401).send('The username or password is incorrect.');
    }

    // Generate a JWT token
    const token = jwt.sign(
      {
        username: user.username,
        role: user.role,
      },
      config.get('indexKey') as jwt.Secret | jwt.PrivateKey,
      { expiresIn: '1d' } as jwt.SignOptions
    );

    console.log(`User ${username} logged in successfully`);
    return res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export default {
  login,
};
