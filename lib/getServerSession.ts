import { getServerSession as nextAuthGetServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export function getServerSession() {
  return nextAuthGetServerSession(authOptions);
}
