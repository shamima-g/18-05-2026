import bcrypt from 'bcryptjs';
import Credentials from 'next-auth/providers/credentials';

import { DEFAULT_ROLE, UserRole } from '@/types/roles';

import type { NextAuthConfig } from 'next-auth';

/**
 * Authentication Configuration
 *
 * Seed credentials (development + test):
 * | Email                    | Password    | Role   |
 * |--------------------------|-------------|--------|
 * | admin@taskflow.local     | Admin123!   | admin  |
 * | alice@taskflow.local     | Member123!  | member |
 * | bob@taskflow.local       | Member123!  | member |
 */

// NEXTAUTH_SECRET validation
if (!process.env.NEXTAUTH_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SECURITY ERROR: NEXTAUTH_SECRET is not set!\n\n' +
        'You MUST set NEXTAUTH_SECRET environment variable in production.\n' +
        'Generate one with: openssl rand -base64 32',
    );
  } else {
    console.warn(
      'WARNING: NEXTAUTH_SECRET is not set. Using a default for development only.',
    );
  }
}

if (
  process.env.NODE_ENV === 'production' &&
  process.env.NEXTAUTH_SECRET &&
  process.env.NEXTAUTH_SECRET.length < 32
) {
  throw new Error(
    'SECURITY ERROR: NEXTAUTH_SECRET is too short!\n\n' +
      'NEXTAUTH_SECRET must be at least 32 characters in production.\n' +
      'Generate one with: openssl rand -base64 32',
  );
}

/**
 * FRS-aligned seed users for the Task Management Tool.
 * These users are available in development and test environments.
 * Passwords are stored as bcrypt hashes.
 */
const seedUsers = [
  {
    id: 'user-admin-1',
    email: 'admin@taskflow.local',
    name: 'Admin User',
    // scan-secrets-ignore - documented seed credential hash (Admin123!)
    password: '$2b$10$SaOE9.wG9yR9YEJbtyns5OgmaP1ucy7OPhs9mqDY3nALSiISo7YBi',
    role: UserRole.ADMIN,
  },
  {
    id: 'user-member-1',
    email: 'alice@taskflow.local',
    name: 'Alice Member',
    // scan-secrets-ignore - documented seed credential hash (Member123!)
    password: '$2b$10$TyvcE6/oWxOLjIbnMdj20OLZRzDeIqNv921zvdIVKStI.Po8c6lTC',
    role: UserRole.MEMBER,
  },
  {
    id: 'user-member-2',
    email: 'bob@taskflow.local',
    name: 'Bob Member',
    // scan-secrets-ignore - documented seed credential hash (Member123!)
    password: '$2b$10$TyvcE6/oWxOLjIbnMdj20OLZRzDeIqNv921zvdIVKStI.Po8c6lTC',
    role: UserRole.MEMBER,
  },
];

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<{
        id: string;
        email: string;
        name: string;
        role: UserRole;
      } | null> {
        if (process.env.NODE_ENV === 'production') {
          console.error(
            'Seed credentials are disabled in production. ' +
              'Please configure a real authentication provider.',
          );
          return null;
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user by email
        const user = seedUsers.find((u) => u.email === credentials.email);

        if (!user) {
          return null;
        }

        // Verify password using bcrypt
        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        if (!passwordMatch) {
          return null;
        }

        // Return user object (without password)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || DEFAULT_ROLE,
        };
      },
    }),
  ],

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: UserRole }).role || DEFAULT_ROLE;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = (token.role as UserRole) || DEFAULT_ROLE;
      }
      return session;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.callback-url'
          : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Host-next-auth.csrf-token'
          : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
