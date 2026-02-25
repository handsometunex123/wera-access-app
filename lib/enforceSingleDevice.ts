import prisma from "@/lib/prisma";

/**
 * Checks if the sessionToken in the session matches the one in the DB for the user.
 * Returns true if valid, false if the user has logged in elsewhere.
 */
export async function isSessionValid(userId: string, sessionToken: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.sessionToken) return false;
  return user.sessionToken === sessionToken;
}
