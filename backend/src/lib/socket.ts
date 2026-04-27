import { Server } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_change_me';

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Export io instance for other services
  (global as any).io = io;

  // Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as {
        id: string;
        email: string;
        houseId: string | null;
      };
      (socket as any).user = payload;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = (socket as any).user;
    console.log(`🔌 User connected: ${user.name || user.email} (${socket.id})`);

    // Join House Room
    if (user.houseId) {
      socket.join(user.houseId);
      console.log(`🏠 User joined room: ${user.houseId}`);
    }

    // Emergency Alert Handler
    socket.on('emergency_alert', async (data: { type: string }) => {
      if (!user.houseId) return;

      console.log(`🚨 Emergency Alert in house ${user.houseId}: ${data.type}`);

      try {
        // 1. Persist in DB
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 2); // 2 hours from now

        const alert = await prisma.activeAlert.create({
          data: {
            type: data.type,
            creatorId: user.id,
            houseId: user.houseId,
            expiresAt,
          },
          include: {
            creator: { select: { name: true } },
          },
        });

        // 2. Broadcast to house members (excluding sender)
        socket.to(user.houseId).emit('new_alert', {
          id: alert.id,
          type: alert.type,
          creatorName: alert.creator.name,
          expiresAt: alert.expiresAt,
        });
        
      } catch (error) {
        console.error('Error handling emergency alert:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 User disconnected');
    });
  });

  return io;
};

export const emitToHouse = (houseId: string, event: string, data: any) => {
  if (io) {
    io.to(houseId).emit(event, data);
  }
};
