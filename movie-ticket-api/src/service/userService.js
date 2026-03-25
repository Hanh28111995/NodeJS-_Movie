import User from "../model/userModel.js";
import bcrypt from "bcryptjs";

export const getAllUsers = async ({ page = 1, limit = 10, search } = {}) => {
  const filter = search
    ? { $or: [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ]}
    : {};

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getUserById = async (id) => {
  return await User.findById(id).select("-password").lean();
};

export const createUser = async ({ username, password, email, role }) => {
  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    const field = existing.username === username ? "Username" : "Email";
    throw new Error(`${field} already exists`);
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return await User.create({ username, password: hashedPassword, email, role });
};

export const updateUser = async (id, data) => {
  return await User.findByIdAndUpdate(id, data, { new: true }).select("-password").lean();
};

export const deleteUser = async (id) => {
  return await User.findByIdAndDelete(id).lean();
};
