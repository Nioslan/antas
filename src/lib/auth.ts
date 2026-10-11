import { cookies } from "next/headers";

const COOKIE_NAME = "antas_admin";
const SESSION_VALUE = "authenticated";

export function getAdminPassword(): string | null {
  // Sin fallback: si la variable no está configurada, nadie puede entrar.
  // (ADMIN_PASSWORD debe estar definida en las variables de entorno de Vercel)
  return process.env.ADMIN_PASSWORD ?? null;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === SESSION_VALUE;
}

export { COOKIE_NAME, SESSION_VALUE };
