import axios from "axios";
import express, { NextFunction, Request, Response, Router } from "express";
import db from "../lib/prisma";
import GithubOAuthData from "../@types/GithubOAuth";


const authRouter = Router()


authRouter.get("/github", async (req, res) => {
  const { select_account = false } = req.query

  let redirect_uri = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_REDIRECT_URI}&scope=read:user`;
  if (select_account) {
    redirect_uri += "&prompt=select_account";
  }
  res.redirect(redirect_uri);
});

authRouter.get('/github/callback', async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).send('Code not provided');
    return 
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
    const githubData: GithubOAuthData = userResponse.data;

    let userData = await db.user.findUnique({
      where: {
        githubId: githubData.id
      }
    })
    if (userData === null) {
      userData = await db.user.create({
        data: {
          username: githubData.login,
          githubId: githubData.id,
          avatarUrl: githubData.avatar_url
        }
      })
    } else {
      userData = await db.user.update({
        where: {
          githubId: githubData.id
        },
        data: {
          avatarUrl: githubData.avatar_url
        }
      })
    }

    req.session.userId = userData.id;
    req.session.user = {
      id: userData.id,
      username: userData.username,
      avatarUrl: userData.avatarUrl,
      role: userData.role,
      githubId: userData.githubId
    };
    const _ = await db.session.upsert({
      where: {
        id: req.session.id
      }, update: {
        userId: userData.id,
      },
      create: {
        id: req.session.id,
        sid: req.session.id,
        userId: userData.id
      }
    })

    // Redirect to frontend with user data
    res.redirect(process.env.POST_LOGIN_REDIRECT_URI as string);
  } catch (error) {
    console.error('Error during GitHub OAuth process:', error);
    res.status(500).send('Authentication failed');
  }
});

authRouter.get('/user', async (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

authRouter.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  req.session.destroy(async err => {
    if (err) {
      console.error('Logout error:', err);
      return next(err);
    }

    try {
      const _ = await db.session.delete({
        where: {
          id: req.cookies['connect.sid'] || ''
        }
      })
    } catch (error) {

    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

export default authRouter;
