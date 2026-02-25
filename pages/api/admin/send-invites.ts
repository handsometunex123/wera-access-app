import { NextApiRequest, NextApiResponse } from "next";
import { sendEmail } from "@/lib/email";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { emails } = req.body;

  if (!Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "Invalid email list" });
  }

  try {
    for (const email of emails) {
      await sendEmail({
        to: email,
        subject: "Invitation to Join",
        text: "You have been invited to join the platform. Please follow the instructions to complete your registration.",
      });
    }

    return res.status(200).json({ message: "Emails sent successfully" });
  } catch (error) {
    console.error("Failed to send emails:", error);
    return res.status(500).json({ error: "Failed to send emails" });
  }
}