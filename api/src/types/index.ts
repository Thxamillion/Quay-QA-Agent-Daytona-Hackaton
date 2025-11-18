import { customAlphabet } from 'nanoid';

// ID type branding
export type Id<T extends string> = string & { __brand: T };

// ID generator
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16);

export function generateId<T extends string>(prefix: T): Id<T> {
  return `${prefix}_${nanoid()}` as Id<T>;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
