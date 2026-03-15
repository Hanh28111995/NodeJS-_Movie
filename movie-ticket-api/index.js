import dotenv from "dotenv";
dotenv.config();
import express from "express";
import connect from "./src/config/DB.js";

import session from "express-session";

import adminRouter from "./src/router/admin/index.js";
import customerTicketRouter from "./src/router/customer/ticket.js";
import moviesRouter from "./src/router/movie.js";
import authRouter from "./src/router/auth.js";


import {
  verifyAdmin,
  verifyCustomer,
  verifyToken,
} from "./src/middleware/index.js";
import uploadRouter from "./src/router/uploads/uploads.js";


export const TOKEN_LIST = [];
export const TOKEN_BLACKLIST = [];

const PORT = process.env.PORT;
const DEV = process.env.NODE_ENV == 1;
/*
 *connect MongoDB
 */
connect();

/*
Create Express server
 */
const SESSION_AGE = 1000 * 60 * 60 * 2;
const app = express();
const store = new session.MemoryStore();
app.use(
  session({
    secret: process.env.SESSION_NAME,
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: { maxAge: SESSION_AGE },
  })
);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

/*
Link to router
 */
app.use("/api/uploads", verifyToken, uploadRouter);

app.use("/api/admin", verifyToken, verifyAdmin, adminRouter);

app.use("/api/customer", verifyToken, verifyCustomer, customerTicketRouter);

app.use("/api/movies", moviesRouter);
app.use("/api/auth", authRouter);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
