/// <reference path="./@types/express-session/index.d.ts" />
import express from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const sessionConf = {
  secret: process.env.SESSION_SECRET || '',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true },
}

if (app.get('env') === 'production') {
  app.set('trust proxy', 1) // trust first proxy
  sessionConf.cookie.secure = true // serve secure cookies
}
app.use(session(sessionConf));

app.use('/auth', authRouter);

app.get('/test', async (req, res) => {
  res.json({ 'hello': 'world' })
})


export default app;
