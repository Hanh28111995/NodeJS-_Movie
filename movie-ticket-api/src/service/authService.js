import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../model/userModel.js";
import { auth as firebaseAuth } from "../middleware/firebase.js";

const generateToken = (payload, secret, expiresIn) => {
  return jwt.sign(payload, secret, { expiresIn });
};

export const login = async (username, password) => {
  const user = await User.findOne({ username });
  if (!user) throw new Error("Username does not exist");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Incorrect password");

  const payload = {
    id: user._id,
    username: user.username,
    role: user.role,
  };

  const accessToken = generateToken(
    payload,
    process.env.JWT_SECRET_KEY,
    "10m"
  );
  const refreshToken = generateToken(
    payload,
    process.env.JWT_REFRESH_SECRET_KEY,
    "7d"
  );

  user.refreshToken = refreshToken;
  await user.save();

  return {
    user_inf: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    user_token: accessToken,
    refreshToken,
  };
};

export const logout = async (refreshToken) => {
  if (refreshToken) {
    await User.updateOne({ refreshToken }, { $set: { refreshToken: "" } });
  }
};

export const register = async (userData) => {
  const { username, email, password } = userData;
  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) throw new Error("Username or Email already exists");

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    ...userData,
    password: hashedPassword,
    role: "customer",
  });

  await newUser.save();
  return newUser;
};

export const refreshToken = async (token) => {
  if (!token) throw new Error("Missing refresh token");

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET_KEY);
    const newAccessToken = jwt.sign(
      { id: decoded.id, username: decoded.username, role: decoded.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "30m" }
    );
    return newAccessToken;
  } catch (err) {
    throw new Error("Invalid or expired refresh token");
  }
};

export const googleLogin = async (idToken) => {
  console.log("--- Google Login Debug ---");
  console.log("idToken type:", typeof idToken);
  console.log("idToken length:", idToken ? idToken.length : 0);

  if (!idToken) {
    throw new Error("idToken is missing in request body");
  }

  if (!firebaseAuth) {
    throw new Error("Firebase Admin SDK chưa được cấu hình đúng. Vui lòng kiểm tra biến môi trường FIREBASE_SDK.");
  }

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);
    console.log("Decoded Token email:", decodedToken.email);
    const { email, name, picture, uid } = decodedToken;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        username: name || (email ? email.split("@")[0] : "user") + "_" + uid.substring(0, 5),
        email,
        avatar: picture,
        provider: "google",
        role: "customer",
      });
      await user.save();
    } else if (user.provider === "local") {
      user.provider = "google";
      user.avatar = picture;
      await user.save();
    }

    const payload = {
      id: user._id,
      username: user.username,
      role: user.role,
    };

    const accessToken = generateToken(
      payload,
      process.env.JWT_SECRET_KEY,
      "10m"
    );
    const refreshToken = generateToken(
      payload,
      process.env.JWT_REFRESH_SECRET_KEY,
      "7d"
    );

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user_inf: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      user_token: accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error("Lỗi xác thực Google Token:", error.message);
    throw new Error(`Xác thực Google thất bại: ${error.message}`);
  }
};
