import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';
import { AppError } from '../utils/AppError';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_me';

export const register = async (data: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      karma: true,
      activeHouseId: true,
      createdAt: true,
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    karma: user.karma,
    houseId: user.activeHouseId,
    createdAt: user.createdAt,
  };
};

export const generateToken = (user: { id: string; email: string; activeHouseId: string | null }) => {
  return jwt.sign(
    { id: user.id, email: user.email, houseId: user.activeHouseId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export const login = async (data: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = generateToken(user);


  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      karma: user.karma,
      houseId: user.activeHouseId,
    },
    token,
  };
};
