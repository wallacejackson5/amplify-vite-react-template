// User role definitions used across auth, storage, and other backend resources
export const USER_ROLES: string[] = ['BASIC', 'ADMIN', 'MODERATOR', 'PREMIUM'];

// Individual role constants for type safety and easy reference
export const USER_ROLE = {
  BASIC: 'BASIC',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  PREMIUM: 'PREMIUM',
} as const;

// Default role for new users
export const DEFAULT_USER_ROLE = USER_ROLE.BASIC;
