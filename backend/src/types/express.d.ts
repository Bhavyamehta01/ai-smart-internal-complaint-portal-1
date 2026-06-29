import { UserPayload } from '../services/authService';

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
