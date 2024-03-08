import type { NextApiRequest, NextApiResponse } from "next";
import { updateUser, createUser, getUser } from "@/app/lib/firebase";
import MailTemplate from "@/app/emails/template";
import { sendEmail } from "@/app/lib/email";
import { render } from "@react-email/render";

type User = {
  displayName?: string;
  email?: string;
  password?: string;
};

const doSendMail = async (user: User) => {
  const { displayName, email, password } = user;
  if (email && password) {
    await sendEmail({
      to: email,
      subject: "[Rover] You have changed information!",
      html: render(
        MailTemplate({
          name: displayName || "Shop",
          email: email || "",
          password: password || "",
        })
      ),
    });
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userInfo: User = {};
  const { displayName, email, password } = req.body;
  userInfo.displayName = displayName;
  if (email) userInfo.email = email;
  if (password) userInfo.password = password;
  try {
    switch (req.method) {
      case "POST":
        const rsCreate = await createUser(userInfo);
        userInfo.email = rsCreate.email;
        doSendMail(userInfo);
        return res
          .status(200)
          .json({ message: "Successfully", data: { uid: rsCreate.uid } });
      case "PUT":
        let rsUpdate = null;
        if (req.body.uid) {
          rsUpdate = await updateUser(req.body.uid, userInfo);
        } else {
          rsUpdate = await createUser(userInfo);
        }
        userInfo.email = rsUpdate.email;
        doSendMail(userInfo);
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
