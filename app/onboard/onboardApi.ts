import prisma from "@/lib/prisma";

export async function getInviteDetails(inviteId: string) {
  if (!inviteId) return null;
  const invite = await prisma.invite.findUnique({
    where: { id: inviteId },
    include: { user: true },
  });
  return invite;
}

type Invite = {
  id: string;
  userId?: string | null;
  email: string;
  role: "ADMIN" | "MAIN_RESIDENT" | "DEPENDANT" | "ESTATE_GUARD";
  status: string;
  createdAt: string;
  expiresAt: string;
  user?: unknown;
};

export function isInviteValid(invite: Invite | null | undefined) {
  if (!invite) return { valid: false, reason: "Invite not found." };
  if (invite.status === "REVOKED") return { valid: false, reason: "This invite has been revoked." };
  if (invite.status === "USED") return { valid: false, reason: "This invite has already been used." };
  if (new Date(invite.expiresAt) < new Date()) return { valid: false, reason: "This invite has expired." };
  return { valid: true };
}
