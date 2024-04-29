import admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";

let serviceAccount = require("./cqb-vn-6c3ac-firebase-adminsdk-p5mqo-3553651c4a.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
// const db = admin.firestore();

type UserInfo = {
  email?: string;
  password?: string;
  phoneNumber?: string;
  displayName?: string;
  disabled?: boolean;
  emailVerified?: boolean;
};

const getUser = async (uid: string) => {
  const userRecord = await getAuth().getUser(uid);
  return userRecord ? userRecord : null;
};

const updateUser = async (uid: string, user: UserInfo) => {
  return await getAuth().updateUser(uid, user);
};

const createUser = async (user: UserInfo) => {
  return await getAuth().createUser(user);
};

const deleteUser = async (uid: string) => {
  return await getAuth().deleteUser(uid);
};

const checkPhoneExistence = async (phone: string) => {
  try {
    let result = await getAuth().getUserByPhoneNumber(phone);
    return result.uid ? true : false;
  } catch(err) {
    return false;
  }
}

const checkEmailExistence = async (email: string) => {
  try {
    let result = await getAuth().getUserByEmail(email);
    return result.uid ? true : false;
  } catch (err) {
    return false;
  }
};
export {
  getUser,
  updateUser,
  createUser,
  checkPhoneExistence,
  checkEmailExistence,
  deleteUser,
};
