import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        houseId: string | null;
      };
    }
  }
}

export {}; // Ensure this is treated as a module extension
