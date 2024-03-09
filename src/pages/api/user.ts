import type { NextApiRequest, NextApiResponse } from "next";
import { updateUser, createUser, getUser } from "@/app/lib/firebase";
import MailTemplate from "@/app/emails/template";
import { sendEmail } from "@/app/lib/email";
import { render } from "@react-email/render";
import axios from "axios";

type UserInfo = {
  displayName?: string;
  email?: string;
  password?: string;
};

const doSendMail = async (user: UserInfo, create: boolean = true) => {
  try {
    const { displayName, email, password } = user;
    if (email) {
      return await sendEmail({
        to: email,
        subject: `[Rover] ${
          create ? "Register was successful" : "Update was successful"
        }!`,
        html: render(
          MailTemplate({
            name: displayName || "",
            email: email,
            password: password || "",
          })
        ),
      });
    }
    return true;
  } catch (error) {
    return false;
  }
};

const doSendMailApi = async (user: UserInfo, create: boolean = true) => {
  const url = "https://cqb-send-mail.vercel.app";
  const res = await axios.post(
    url,
    { name: user.displayName, email: user.email, password: user.password },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return res.status === 200 ? true : false;
};

const makeFormData = (user: any): UserInfo => {
  let formData: UserInfo = {};
  if (user.displayName) formData.displayName = user.displayName;
  if (user.email) formData.email = user.email;
  if (user.password) formData.password = user.password;
  return formData;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case "POST":
        let userInfoCreate = makeFormData(req.body.user);
        const rsCreate = await createUser(userInfoCreate);
        userInfoCreate.displayName =
          userInfoCreate.displayName || rsCreate.displayName;
        userInfoCreate.email = userInfoCreate.email || rsCreate.email;
        // await doSendMail(userInfoCreate);
        doSendMailApi(userInfoCreate);
        return res.status(200).json({
          message: "Successfully",
          data: { uid: rsCreate.uid },
        });
      case "PUT":
        let userInfoUpdate = makeFormData(req.body.user);
        let rsUpdate = null;
        if (req.body.uid) {
          rsUpdate = await updateUser(req.body.uid, userInfoUpdate);
        } else {
          rsUpdate = await createUser(userInfoUpdate);
        }
        userInfoUpdate.displayName =
          userInfoUpdate.displayName || rsUpdate.displayName;
        userInfoUpdate.email = userInfoUpdate.email || rsUpdate.email;
        // await doSendMail(userInfoUpdate, false);
        doSendMailApi(userInfoUpdate);
        return res.status(200).json({
          message: "Successfully",
          data: { uid: rsUpdate.uid },
        });
      case "GET":
        const userRecord = await getUser(req.body.uid);
        return res.status(200).json({ message: userRecord });
      default:
        return res.status(200).json({ message: req.method });
    }
  } catch (error: any) {
    return res.status(500).json({ code: error.code, message: error.message });
  }
}
