import type { Autenticado } from './domain.js';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: Autenticado;
    }
  }
}

export {};
