import { sql } from "@vercel/postgres";
import { hashPassword, verifyPassword } from "./auth";

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export async function createUser(
  email: string,
  password: string,
  name: string
): Promise<User> {
  const passwordHash = await hashPassword(password);
  
  const { rows } = await sql`
    INSERT INTO users (email, password_hash, name)
    VALUES (${email}, ${passwordHash}, ${name})
    RETURNING id, email, name, created_at, updated_at
  `;
  
  return rows[0] as User;
}

export async function getUserByEmail(email: string): Promise<User & { password_hash: string } | null> {
  const { rows } = await sql`
    SELECT id, email, password_hash, name, created_at, updated_at
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;
  
  if (rows.length === 0) {
    return null;
  }
  
  return rows[0] as User & { password_hash: string };
}

export async function getUserById(id: string): Promise<User | null> {
  const { rows } = await sql`
    SELECT id, email, name, created_at, updated_at
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `;
  
  if (rows.length === 0) {
    return null;
  }
  
  return rows[0] as User;
}

export async function updateUser(
  id: string,
  data: { name?: string; email?: string }
): Promise<User> {
  if (data.name && data.email) {
    const { rows } = await sql`
      UPDATE users
      SET name = ${data.name}, email = ${data.email}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, email, name, created_at, updated_at
    `;
    return rows[0] as User;
  } else if (data.name) {
    const { rows } = await sql`
      UPDATE users
      SET name = ${data.name}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, email, name, created_at, updated_at
    `;
    return rows[0] as User;
  } else if (data.email) {
    const { rows } = await sql`
      UPDATE users
      SET email = ${data.email}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, email, name, created_at, updated_at
    `;
    return rows[0] as User;
  } else {
    const user = await getUserById(id);
    if (!user) throw new Error("User not found");
    return user;
  }
}

export async function updateUserPassword(
  id: string,
  newPassword: string
): Promise<void> {
  const passwordHash = await hashPassword(newPassword);
  
  await sql`
    UPDATE users
    SET password_hash = ${passwordHash}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `;
}

export async function verifyUserPassword(
  email: string,
  password: string
): Promise<User | null> {
  const user = await getUserByEmail(email);
  
  if (!user) {
    return null;
  }
  
  const isValid = await verifyPassword(password, user.password_hash);
  
  if (!isValid) {
    return null;
  }
  
  // Return user without password_hash
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

