import jwt from "jsonwebtoken";
import { mkdir } from "fs";
import { sendError } from "../helper/client.js";
import { TOKEN_BLACKLIST, TOKEN_LIST } from "../../index.js";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

/**
 *
 */
export const createUploadDir = (req, res, next) => {
  const d = new Date();
  const dirName = d.toISOString().slice(0, 7);
  mkdir(`public/uploads/${dirName}`, { recursive: true }, (err) => {
    if (err) return sendError(res, "Cannot upload file.");
  });
  req.dirName = dirName;
  next();
};

export const createAssetsDir = (req, res, next) => {
  mkdir(`public/assets`, { recursive: true }, (err) => {
    if (err) return sendError(res, "Cannot upload file.");
  });
  req.dirName = "assets";
  next();
};

export const createLogoDir = (req, res, next) => {
  mkdir(`public/logo`, { recursive: true }, (err) => {
    if (err) return sendError(res, "Cannot upload file.");
  });
  req.dirName = "logo";
  next();
};

export const createImageDir = (req, res, next) => {
  mkdir(`public/images`, { recursive: true }, (err) => {
    if (err) return sendError(res, "Cannot upload file.");
  });
  req.dirName = "images";
  next();
};

/**
 * header contain
 * Authorised : Bearer token
 */
export const verifyToken = async (req, res, next) => {
  try {
    const data = req.headers["authorization"];
    const token = data?.split(" ")[1];
    if (!token) return sendError(res, "jwt must be provided.", 401);

    if (TOKEN_BLACKLIST.has(token))
      return sendError(res, "Unauthorized.", 401);

    const decoded = jwt.verify(token, JWT_SECRET_KEY, {
      complete: true,
    });
    const payload = decoded.payload;
    console.log(payload);

    if (!payload.id) return sendError(res, "Unauthorized.", 401);

    req.verifyToken = token;
    req.user = payload;
    next();
  } catch (error) {
    console.log(error);    
    if (error.name === "TokenExpiredError") {
      return sendError(res, "jwt expired.", 401);
    }
    return sendError(res, "Invalid token.", 401);    
  }
};

export const verifyAdmin = async (req, res, next) => {
  if (req.user.role !== "admin") return sendError(res, "Forbidden.", 403);
  next();
};

// export const verifyStaff = async (req, res, next) => {
//     if (! req.user.role.hasOwnProperty('staff_type'))
//         return sendError(res, 'Forbidden.',403)
//     next()
// }

export const verifyCustomer = async (req, res, next) => {
  if (req.user.role !== "customer") return sendError(res, "Forbidden.", 403);
  next();
};
// export const verifyStorekeeper = async (req, res, next) => {
//     if (req.user.role.staff_type !== 'storekeeper')
//         return sendError(res, 'Forbidden.',403)
//     next()
// }
// export const verifyCustomerOrAdmin = async (req, res, next) => {
//     if (req.user.role.staff_type !== 'admin' && (!req.user.role.hasOwnProperty('customer_type')))
//         return sendError(res, 'Forbidden.', 403)
//     next()
// }
// export const verifyDriver = async (req, res, next) => {
//     if (req.user.role.staff_type !== 'driver')
//         return sendError(res, 'Forbidden.',403)
//     next()
// }
