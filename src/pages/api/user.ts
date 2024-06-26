import type { NextApiRequest, NextApiResponse } from "next";
import { updateUser, createUser, getUser, checkPhoneExistence, checkEmailExistence, deleteUser } from "@/app/lib/firebase";
import MailTemplate from "@/app/emails/template";
import { sendEmail } from "@/app/lib/email";
import { render } from "@react-email/render";
import axios from "axios";

type UserInfo = {
  displayName?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
};

const doSendMail = async (user: UserInfo, create: boolean = true) => {
  try {
    const { displayName, email, password } = user;
    if (!email && !password) return true;
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

const makeFormData = (user: any): UserInfo => {
  let formData: UserInfo = {};
  if (user.displayName) formData.displayName = user.displayName;
  if (user.email) formData.email = user.email;
  if (user.password) formData.password = user.password;
  if (user.phoneNumber) formData.phoneNumber = formatPhone(user.phoneNumber);
  return formData;
};

const formatPhone = (phone: any) => {
  return phone.replace(phone.charAt(0), "+84");
}

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
        await doSendMail(userInfoCreate);
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
        await doSendMail(userInfoUpdate, false);
        return res.status(200).json({
          message: "Successfully",
          data: { uid: rsUpdate.uid },
        });
      case "GET":
        const {phoneNumber} = req.query;
        if (phoneNumber) {
          const result = await checkPhoneExistence(formatPhone(phoneNumber));
          return res.status(200).json({ data: { existence: result }});
        }

        const { email } = req.query;
        if (email) {
          const result = await checkEmailExistence(email as string);
          return res.status(200).json({ data: { existence: result } });
        }
        const userRecord = await getUser(req.body.uid);
        return res.status(200).json({ message: userRecord });
      case "DELETE":
        const { uid } = req.query;
        if (uid) {
          const ret = await deleteUser(uid as string);
          return res.status(200).json({ data: ret });
        } else {
          return res.status(200).json({ data: "uid is required" });
        }
        
      default:
        return res.status(200).json({ message: req.method });
    }
  } catch (error: any) {
    const { errorInfo } = error;
    console.log("errorInfo ====> ", errorInfo);
    if (errorInfo) {
      return res.status(500).json({
        code: errorInfo.code,
        message: errorInfo.message,
      });
    }

    return res
      .status(500)
      .json({ message: error.message });
  }
}
