export type SeededUser = {
  email: string;
  password: string;
  role: 'admin' | 'member';
};

export const adminUser: SeededUser = {
  email: 'admin@taskflow.local',
  password: 'Admin123!', // scan-secrets-ignore - documented seed credential (matches auth.config.ts)
  role: 'admin',
};

export const memberUser: SeededUser = {
  email: 'alice@taskflow.local',
  password: 'Member123!', // scan-secrets-ignore - documented seed credential (matches auth.config.ts)
  role: 'member',
};

export const seededUsers = [adminUser, memberUser] as const;
