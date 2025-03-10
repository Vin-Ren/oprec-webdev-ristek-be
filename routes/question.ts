/// <reference path="../@types/express-session/index.d.ts" />
import { Router } from "express";

import db from "../lib/prisma";
import zodSchemaValidator from "../lib/zodSchemaValidator";
import { CreateQuestionParams, createQuestionSchema, getQuestionByIdSchema, getQuestionsByTryoutIdSchema, QuestionsByTryoutIdParams, UpdateQuestionParams, updateQuestionSchema } from "../schemas/question";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

const questionRouter = Router()

questionRouter.get('/', async (req, res) => {
  if (req.session.user?.role === 'User') {
    res.status(403);
    return;
  }

  const questions = await db.question.findMany()
  res.json({ questions })
  return
})

questionRouter.get('/:tryoutId', async (req, res) => {
  try {
    const { tryoutId } = await getQuestionsByTryoutIdSchema.parseAsync(req.params)
    const tryout = await db.tryout.findUnique({
      where: { id: tryoutId },
      select: { ownerId: true }
    })

    if (tryout?.ownerId != req.session.userId && req.session.user?.role! !== 'Admin') {
      res.status(403)
      return
    }

    const questions = await db.question.findMany({
      where: {
        tryoutId
      }
    })
    res.json({ questions })
    return;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(500)
    }
    res.status(400).json({ error: (error as ZodError).errors || "" });
  }
})

questionRouter.get('/:id', async (req, res) => {
  try {
    const { id } = await getQuestionByIdSchema.parseAsync(req.params)

    let validateUser = (req.session.user?.role === 'Admin') ? {} : {
      tryout: {
        ownerId: req.session.userId
      }
    }

    const question = await db.question.findUnique({
      where: {
        id,
        ...validateUser
      }
    })

    if (!question) {
      res.status(404)
      return
    }
    res.json({ question })
    return;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(500)
    }
    res.status(400).json({ error: (error as ZodError).errors || "" });
  }
})

questionRouter.post('/', zodSchemaValidator(createQuestionSchema), async (req, res) => {
  try {
    const data: CreateQuestionParams = req.body

    const bindedTryout = await db.tryout.findUnique({
      where: { id: data.tryoutId },
      select: { ownerId: true }
    })

    if (bindedTryout?.ownerId != req.session.userId && req.session.user?.role === 'User') {
      res.sendStatus(403)
      return
    }

    const question = await db.question.create({
      data
    })

    res.json({ question })
    return
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(500)
    }
    res.status(400).json({ error: (error as ZodError).errors || "" });
  }
})


questionRouter.put('/:id', zodSchemaValidator(updateQuestionSchema), async (req, res) => {
  try {
    const { id } = await getQuestionByIdSchema.parseAsync(req.params)
    const data: UpdateQuestionParams = req.body

    let validateUser = (req.session.user?.role === 'Admin') ? {} : {
      tryout: {
        ownerId: req.session.userId
      }
    }

    const question = await db.question.update({
      where: {
        id,
        ...validateUser
      },
      data
    })

    if (!question) {
      res.sendStatus(404)
      return
    }
    res.json({ question })
    return
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(500)
    }
    res.status(400).json({ error: (error as ZodError).errors || "" });
  }
})


questionRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = await getQuestionByIdSchema.parseAsync(req.params)

    let validateUser = (req.session.user?.role === 'Admin') ? {} : {
      tryout: {
        ownerId: req.session.userId
      }
    }

    const question = db.question.delete({
      where: {
        id,
        ...validateUser
      }
    })
    if (!question) {
      res.sendStatus(404)
      return
    }
    res.json({ question })
    return
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(500)
    }
    res.status(400).json({ error: (error as ZodError).errors || "" });
  }
})


export default questionRouter