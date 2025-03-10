/// <reference path="./@types/express-session/index.d.ts" />
import express, { Router } from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";

import authRouter from "./routes/auth";
import db from "./lib/prisma";
import tryoutRouter from "./routes/tryout";
import questionRouter from "./routes/question";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const sessionConf = {
  secret: process.env.SESSION_SECRET || '',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true },
  store: new PrismaSessionStore(
    db,
    {
      checkPeriod: (parseInt(process.env.SESSION_POOLING_INTERVAL as string || "120")) * 1000,  // Remove expired sessions every 2 minutes
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }
  ),
}

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sessionConf.cookie.secure = true // serve secure cookies
}

app.use(session(sessionConf));

const v1Router = Router();
v1Router.use('/auth', authRouter);
v1Router.use('/tryout', tryoutRouter);
v1Router.use('/question', questionRouter)


app.use('/v1', v1Router)

export default app;
