import { Request, Response, NextFunction } from 'express';

export const requireHouse = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.houseId) {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied: You must belong to a house to perform this action.' 
    });
  }
  next();
};


