import type { NextApiRequest, NextApiResponse } from "next";
import { updateUser, createUser, getUser } from "@/app/lib/firebase";
import MailTemplate from "@/app/emails/template";
import { sendEmail } from "@/app/lib/email";
import { render } from "@react-email/render";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "POST":
      const rsCreate = await createUser(req.body.user);
      return res.status(200).json({ message: rsCreate });
    case "PUT":
      const rsUpdate = await updateUser(req.body.uid, req.body.user);
      const { displayName, email, password } = req.body.user;
      if (rsUpdate.email) {
        await sendEmail({
          to: email,
          subject: "[Rover] You have changed password!",
          html: render(
            MailTemplate({
              name: displayName,
              email: email,
              password: password,
            })
          ),
        });
      }

      return res.status(200).json({ message: "Sent Successfully" });
    case "GET":
      const userRecord = await getUser(req.body.uid);
      return res.status(200).json({ message: userRecord });
    default:
      return res.status(200).json({ message: req.method });
  }
}
