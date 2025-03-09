import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user: {
      id: string,
      username: string,
      avatarUrl: string,
      githubId: number | null,
      role: "Admin" | "User"
    };
    userId: string
  }
}