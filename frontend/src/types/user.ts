export enum UserRole {
  ADMIN = "ADMIN",
  NUTRITIONIST = "NUTRITIONIST",
  NUTRITIONIST_DEVELOPER = "NUTRITIONIST_DEVELOPER",
  WORKER = "WORKER",
  PATIENT = "PATIENT",
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface Session {
  user: User;
  expires: string;
}
