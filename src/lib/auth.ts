import { cookies } from "next/headers";

const COOKIE_NAME = "antas_admin";
const SESSION_VALUE = "authenticated";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? "antas2024";
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === SESSION_VALUE;
}

export { COOKIE_NAME, SESSION_VALUE };
