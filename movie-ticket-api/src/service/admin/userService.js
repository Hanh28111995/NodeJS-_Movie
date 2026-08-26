import userRepository from "../../repository/userRepository.js";
import bcrypt from "bcryptjs";

class UserService {
  async getAllUsers(queryParam) {
    const page = Math.max(1, parseInt(queryParam.page) || 1);
    const limit = Math.min(8, parseInt(queryParam.limit) || 8);
    const skip = (page - 1) * limit;

    const keyword = (queryParam.keyword || queryParam.search || "").trim();

    let query = {};
    if (keyword) {
      const regex = { $regex: keyword, $options: "i" };
      query = {
        $or: [{ email: regex }, { userphone: regex }],
      };
    }

    const [total, users] = await Promise.all([
      userRepository.countDocuments(query),
      userRepository.findAll(query, { skip, limit }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userid) {
    const user = await userRepository.findById(userid);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  async addNewUser(bodyData) {
    const { username, password, email, role } = bodyData;

    const existing = await userRepository.findOne({
      $or: [{ username }, { email }],
    });
    if (existing) {
      const field = existing.username === username ? "Username" : "Email";
      const error = new Error(`${field} already exists`);
      error.statusCode = 409;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await userRepository.create({
      username,
      password: hashedPassword,
      email,
      role,
    });

    return {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
    };
  }

  async updateUser(bodyData) {
    const userid = bodyData._id;
    const updated = await userRepository.updateById(userid, bodyData);
    if (!updated) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    return updated;
  }

  async deleteUser(userid) {
    const deleted = await userRepository.deleteById(userid);
    if (!deleted) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    return deleted;
  }
}

export default new UserService();
