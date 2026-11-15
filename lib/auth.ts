import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type User } from "./backend";
import { loginHref } from "./nav";

/** For signed-in pages: the user, or a redirect to login that comes back here. */
export async function requireUser(returnTo: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(loginHref(returnTo));
  return user;
}
