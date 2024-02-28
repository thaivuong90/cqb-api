import type { NextApiRequest, NextApiResponse } from "next";
import { updateUser, createUser, getUser } from "@/app/lib/firebase";
import MailTemplate from "@/app/emails/template";
import { sendEmail } from "@/app/lib/email";
import { render } from "@react-email/render";

const doSendMail = async (user: any) => {
  const { displayName, email, password } = user;
  if (email) {
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
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case "POST":
        const rsCreate = await createUser(req.body.user);
        doSendMail(req.body.user);
        return res
          .status(200)
          .json({ message: "Successfully", data: { uid: rsCreate.uid } });
      case "PUT":
        let rsUpdate = null;
        if (req.body.uid) {
          rsUpdate = await updateUser(req.body.uid, req.body.user);
        } else {
          rsUpdate = await createUser(req.body.user);
        }
        doSendMail(req.body.user);
        return res
          .status(200)
          .json({ message: "Successfully", data: { uid: rsUpdate.uid } });
      case "GET":
        const userRecord = await getUser(req.body.uid);
        return res.status(200).json({ message: userRecord });
      default:
        return res.status(200).json({ message: req.method });
    }
  } catch(error: any) {
    return res.status(500).json({ code: error.code, message: error.message });
  }
  
}
