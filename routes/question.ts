/// <reference path="../@types/express-session/index.d.ts" />
import { Router } from "express";

import db from "../lib/prisma";
import zodSchemaValidator from "../lib/zodSchemaValidator";
import { CreateQuestionParams, createQuestionSchema, getQuestionByIdSchema, getQuestionsByTryoutIdSchema, QuestionsByTryoutIdParams, UpdateQuestionParams, updateQuestionSchema } from "../schemas/question";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

const questionRouter = Router()

questionRouter.get('/', async (req, res) => {
  if (!req.session.userId) {
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

    if (tryout?.ownerId != req.session.userId && req.session.user?.role! === 'Admin') {
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

    const question = db.question.create({
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
    const where = await getQuestionByIdSchema.parseAsync(req.params)
    const data: UpdateQuestionParams = req.body

    const question = db.question.update({
      where,
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


questionRouter.delete('/:id', async (req, res) => {
  try {
    const where = await getQuestionByIdSchema.parseAsync(req.params)

    const question = db.question.delete({
      where
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


export default questionRouter