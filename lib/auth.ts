import jwt from "jsonwebtoken";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

export interface UserPayload {
  id: string;
  email: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    algorithm: "HS256" // Ensure compatibility with jose
  });
}

// For Node.js runtime (API routes)
export function verifyToken(token: string): UserPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error instanceof Error ? error.message : String(error));
    console.error("JWT_SECRET length:", JWT_SECRET?.length || 0);
    return null;
  }
}

  // For Edge runtime (middleware) - uses Web Crypto API
  export async function verifyTokenForEdge(token: string): Promise<UserPayload | null> {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      // Validate payload structure before casting
      if (payload && typeof payload === 'object' && 'id' in payload && 'email' in payload && 'name' in payload) {
        return payload as unknown as UserPayload;
      }
      return null;
    } catch (error) {
      console.error("Edge token verification failed:", error instanceof Error ? error.message : String(error));
      return null;
    }
  }

export async function getCurrentUser(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}

export async function setAuthToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAuthToken() {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
}

