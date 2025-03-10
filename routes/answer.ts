/// <reference path="../@types/express-session/index.d.ts" />
import { Router } from "express";

import db from "../lib/prisma";
import zodSchemaValidator from "../lib/zodSchemaValidator";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { CreateAnswerParams, createAnswerSchema, getAnswerByIdSchema, getAnswersByQuestionIdSchema, UpdateAnswerParams, updateAnswerSchema } from "../schemas/answer";

const answerRouter = Router()

answerRouter.get('/:questionId', async (req, res) => {
  try {
    const { questionId } = await getAnswersByQuestionIdSchema.parseAsync(req.params)

    const answer = await db.answer.findUnique({
      where: {
        questionId
      },
      select: {
        question: {
          select: {
            tryout: {
              select: {
                ownerId: true
              }
            }
          }
        }
      }
    })

    if (answer?.question?.tryout?.ownerId != req.session.userId && req.session.user?.role! !== 'Admin') {
      res.status(403)
      return
    }

    res.json({ answer })
    return;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(500)
    }
    res.status(400).json({ error: (error as ZodError).errors || "" });
  }
})

answerRouter.get('/:id', async (req, res) => {
  try {
    const { id } = await getAnswerByIdSchema.parseAsync(req.params)

    let validateUser = (req.session.user?.role === 'Admin') ? {} : {
      question: {
        tryout: {
          ownerId: req.session.userId
        }
      }
    }

    const answer = await db.answer.findUnique({
      where: {
        id,
        ...validateUser
      }
    })

    if (!answer) {
      res.status(404)
      return
    }
    res.json({ answer })
    return;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(500)
    }
    res.status(400).json({ error: (error as ZodError).errors || "" });
  }
})

answerRouter.post('/', zodSchemaValidator(createAnswerSchema), async (req, res) => {
  try {
    const data: CreateAnswerParams = req.body

    const bindedQuestion = await db.question.findUnique({
      where: { id: data.questionId },
      select: { tryout: { select: { ownerId: true } } }
    })

    if (bindedQuestion?.tryout?.ownerId != req.session.userId && req.session.user?.role === 'User') {
      res.sendStatus(403)
      return
    }

    const answer = await db.answer.create({
      data
    })
    res.json({ answer })
    return
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(500)
    }
    res.status(400).json({ error: (error as ZodError).errors || "" });
  }
})


answerRouter.put('/:id', zodSchemaValidator(updateAnswerSchema), async (req, res) => {
  try {
    const { id } = await getAnswerByIdSchema.parseAsync(req.params)
    const data: UpdateAnswerParams = req.body

    let validateUser = (req.session.user?.role === 'Admin') ? {} : {
      question: {
        tryout: {
          ownerId: req.session.userId
        }
      }
    }

    const answer = await db.answer.update({
      where: {
        id,
        ...validateUser
      },
      data
    })

    if (!answer) {
      res.sendStatus(404)
      return
    }

    res.json({ answer })
    return
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(500)
    }
    res.status(400).json({ error: (error as ZodError).errors || "" });
  }
})


answerRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = await getAnswerByIdSchema.parseAsync(req.params)

    let validateUser = (req.session.user?.role === 'Admin') ? {} : {
      question: {
        tryout: {
          ownerId: req.session.userId
        }
      }
    }

    const answer = db.answer.delete({
      where: {
        id,
        ...validateUser
      }
    })

    if (!answer) {
      res.sendStatus(404)
      return
    }

    res.json({ answer })
    return
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(500)
    }
    res.status(400).json({ error: (error as ZodError).errors || "" });
  }
})


export default answerRouter
