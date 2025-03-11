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
import choiceRouter from "./routes/choice";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
}

app.use(session({
  secret: process.env.SESSION_SECRET || '',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: "none",
  },
  store: new PrismaSessionStore(
    db,
    {
      checkPeriod: (parseInt(process.env.SESSION_POOLING_INTERVAL as string || "120")) * 1000,  // Remove expired sessions every 2 minutes
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }
  ),
}));

const v1Router = Router();
v1Router.use('/auth', authRouter);
v1Router.use('/tryout', tryoutRouter);
v1Router.use('/question', questionRouter)
v1Router.use('/choice', choiceRouter)


app.use('/v1', v1Router)

export default app;
