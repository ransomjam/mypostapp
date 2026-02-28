import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        planType: string;
        role: string;
        createdAt: Date;
    };
}

export async function register(email: string, password: string): Promise<AuthResponse> {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new AppError('Email already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
        data: { email, passwordHash },
    });

    const token = generateToken(user.id, user.email);
    logger.info(`User registered: ${user.email}`);

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            planType: user.planType,
            role: user.role,
            createdAt: user.createdAt,
        },
    };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
        throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken(user.id, user.email);
    logger.info(`User logged in: ${user.email}`);

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            planType: user.planType,
            role: user.role,
            createdAt: user.createdAt,
        },
    };
}

export async function getProfile(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            planType: true,
            role: true,
            createdAt: true,
            _count: { select: { posts: true } },
        },
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    return user;
}

function generateToken(userId: string, email: string): string {
    return jwt.sign(
        { userId, email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );
}
