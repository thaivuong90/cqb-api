import type { NextApiRequest, NextApiResponse } from "next";
import { render } from "@react-email/render";
import MailTemplate from "@/app/emails/template";
import { sendEmail } from "@/app/lib/email";

const methods = ["POST", "PUT"];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method && methods.includes(req.method)) {
    await sendEmail({
      to: req.body.to,
      subject: req.body.subject,
      html: render(
        MailTemplate({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
        })
      ),
    });

    return res.status(200).json({ message: "Email sent successfully" });
  }
  return res.status(200).json({ message: "ok" });
  
}
