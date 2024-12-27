// src/types/express.d.ts
import { UserDocument } from '../users/schemas/user.schema';

declare module 'express' {
  export interface Request {
    user?: UserDocument;
  }
}
