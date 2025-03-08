import axios from "axios";
import express, { NextFunction, Request, Response, Router } from "express";


const authRouter = Router()


authRouter.get("/github", async (req, res) => {
  const redirect_uri = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_REDIRECT_URI}&scope=read:user&prompt=select_account`;
  res.redirect(redirect_uri);
});

authRouter.get('/github/callback', (async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    return res.status(400).send('Code not provided');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Fetch user data from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Store user data in session
    req.session.user = userResponse.data;
    console.log(req.session.user)

    // Redirect to frontend with user data
    res.redirect(process.env.POST_LOGIN_REDIRECT_URI as string);
  } catch (error) {
    console.error('Error during GitHub OAuth process:', error);
    res.status(500).send('Authentication failed');
  }
}) as express.RequestHandler);

authRouter.get('/user', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

authRouter.post('/logout', (req: Request, res: Response, next: NextFunction) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return next(err);
    }

    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

export default authRouter;
