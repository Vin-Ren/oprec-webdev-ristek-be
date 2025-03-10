/// <reference path="../@types/express-session/index.d.ts" />
import { Router } from "express";

import db from "../lib/prisma";
import zodSchemaValidator from "../lib/zodSchemaValidator";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { CreateChoiceParams, createChoiceSchema, getChoiceByIdSchema, getChoicesByQuestionIdSchema, UpdateChoiceParams, updateChoiceSchema } from "../schemas/choice";

const choiceRouter = Router()

choiceRouter.get('/', async (req, res) => {
  if (req.session.user?.role === 'User') {
    res.status(403);
    return;
  }

  const choices = await db.choice.findMany()
  res.json({ choices })
  return
})

choiceRouter.get('/:questionId', async (req, res) => {
  try {
    const { questionId } = await getChoicesByQuestionIdSchema.parseAsync(req.params)
    const question = await db.question.findUnique({
      where: { id: questionId },
      select: {
        tryout: {
          select: {
            ownerId: true
          }
        }
      }
    })

    if (question?.tryout?.ownerId != req.session.userId && req.session.user?.role! !== 'Admin') {
      res.status(403)
      return
    }

    const choices = await db.choice.findMany({
      where: {
        questionId
      }
    })
    res.json({ choices })
    return;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(500)
    }
    res.status(400).json({ error: (error as ZodError).errors || "" });
  }
})

choiceRouter.get('/:id', async (req, res) => {
  try {
    const { id } = await getChoiceByIdSchema.parseAsync(req.params)

    let validateUser = (req.session.user?.role === 'Admin') ? {} : {
      question: {
        tryout: {
          ownerId: req.session.userId
        }
      }
    }

    const choice = await db.choice.findUnique({
      where: {
        id,
        ...validateUser
      }
    })

    if (!choice) {
      res.status(404)
      return
    }
    res.json({ choice })
    return;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(500)
    }
    res.status(400).json({ error: (error as ZodError).errors || "" });
  }
})

choiceRouter.post('/', zodSchemaValidator(createChoiceSchema), async (req, res) => {
  try {
    const data: CreateChoiceParams = req.body

    const bindedQuestion = await db.question.findUnique({
      where: { id: data.questionId },
      select: { tryout: { select: { ownerId: true } } }
    })

    if (bindedQuestion?.tryout?.ownerId != req.session.userId && req.session.user?.role === 'User') {
      res.sendStatus(403)
      return
    }

    const choice = await db.choice.create({
      data
    })
    res.json({ choice })
    return
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(500)
    }
    res.status(400).json({ error: (error as ZodError).errors || "" });
  }
})


choiceRouter.put('/:id', zodSchemaValidator(updateChoiceSchema), async (req, res) => {
  try {
    const { id } = await getChoiceByIdSchema.parseAsync(req.params)
    const data: UpdateChoiceParams = req.body

    let validateUser = (req.session.user?.role === 'Admin') ? {} : {
      question: {
        tryout: {
          ownerId: req.session.userId
        }
      }
    }

    const choice = await db.choice.update({
      where: {
        id,
        ...validateUser
      },
      data
    })

    if (!choice) {
      res.sendStatus(404)
      return
    }

    res.json({ choice })
    return
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(500)
    }
    res.status(400).json({ error: (error as ZodError).errors || "" });
  }
})


choiceRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = await getChoiceByIdSchema.parseAsync(req.params)

    let validateUser = (req.session.user?.role === 'Admin') ? {} : {
      question: {
        tryout: {
          ownerId: req.session.userId
        }
      }
    }

    const choice = db.choice.delete({
      where: {
        id,
        ...validateUser
      }
    })

    if (!choice) {
      res.sendStatus(404)
      return
    }

    res.json({ choice })
    return
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(500)
    }
    res.status(400).json({ error: (error as ZodError).errors || "" });
  }
})


export default choiceRouter