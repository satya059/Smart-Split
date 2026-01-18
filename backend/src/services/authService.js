import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

const SALT_ROUNDS = 10;

export async function register(email, password, name) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        throw new AppError('Email already registered', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            name
        },
        select: {
            id: true,
            email: true,
            name: true,
            createdAt: true
        }
    });

    // Generate token
    const token = generateToken(user);

    return { user, token };
}

export async function login(email, password) {
    // Find user
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
        throw new AppError('Invalid email or password', 401);
    }

    // Generate token
    const token = generateToken(user);

    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt
        },
        token
    };
}

export async function getCurrentUser(userId) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            createdAt: true
        }
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    return user;
}

function generateToken(user) {
    return jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}
