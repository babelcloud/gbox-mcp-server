import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    organizationId: string;
    apiKey: string;
  };
}
