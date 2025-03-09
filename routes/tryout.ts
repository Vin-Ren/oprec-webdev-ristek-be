/// <reference path="../@types/express-session/index.d.ts" />
import { Router } from "express";
import { Prisma, TryoutVisibility } from '@prisma/client';

import db from "../lib/prisma";
import zodSchemaValidator from "../lib/zodSchemaValidator";
import { CreateTryoutParams, createTryoutSchema, UpdateTryoutParams, updateTryoutSchema } from "../@types/tryout";

const tryoutRouter = Router()

tryoutRouter.get('/', async (req, res) => {
  const tryouts = await db.tryout.findMany({
    select: {
      id: true,
      name: true,
      opensAt: true,
      closesAt: true,
      duration: true
    }
  });
  res.json({ tryouts });
  return;
})

tryoutRouter.get('/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(404).json({ error: "404 Not Found." })
      return
    }

    const tryoutTransact = db.tryout.findUniqueOrThrow({
      where: { id },
    });

    const totalAggTransact = db.question.aggregate({
      where: { tryoutId: id },
      _count: true,
      _sum: {
        weight: true
      }
    });

    const [tryout, totalAgg] = await db.$transaction([tryoutTransact, totalAggTransact]);

    res.json({ tryout: { ...tryout, questionCount: totalAgg._count, totalScore: totalAgg._sum.weight } });
    return;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error as Prisma.PrismaClientKnownRequestError).code === 'P2025') {
      res.sendStatus(404)
      return
    }
    console.log(error)
  }
})


tryoutRouter.post('/', zodSchemaValidator(createTryoutSchema), async (req, res) => {
  const {
    name,
    description = "",
    questionsOrder,
    shuffled = false,
    opensAt = new Date(),
    closesAt = new Date(),
    duration = 0,
    visibility = TryoutVisibility.PRIVATE,
    passphrase = ""
  }: CreateTryoutParams = req.body;

  const tryout = await db.tryout.create({
    data: {
      name,
      description,
      questionsOrder,
      shuffled,
      opensAt,
      closesAt,
      duration,
      ownerId: (req.session.userId as string),
      visibility,
      passphrase
    }
  })
  res.json({ tryout })
  return;
})


tryoutRouter.put('/:id', zodSchemaValidator(updateTryoutSchema), async (req, res) => {
  const { id } = req.params;
  if (!id) {
    res.status(404).json({ error: "404 Not found." })
    return
  }

  const {
    name,
    description = "",
    questionsOrder,
    shuffled = false,
    opensAt = new Date(),
    closesAt = new Date(),
    duration = 0,
    visibility = TryoutVisibility.PRIVATE,
    passphrase = ""
  }: UpdateTryoutParams = req.body;

  const isEditable = await db.tryout.findUnique({
    where: {
      id,
      ownerId: (req.session.userId as string),
      editable: true
    }
  })

  if (isEditable === null) {
    res.status(403).json({ error: "Either the tryout is fictictuous, the tryout is not yours, or it is no longer editable." });
    return;
  }

  const tryout = await db.tryout.update({
    where: { id },
    data: {
      name,
      description,
      questionsOrder,
      shuffled,
      opensAt,
      closesAt,
      duration,
      ownerId: (req.session.userId as string),
      visibility,
      passphrase
    }
  })
  res.json({ tryout })
  return;
})

tryoutRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    res.status(404).json({ error: "404 Not found." })
    return
  }

  const isEditable = await db.tryout.findUnique({
    where: {
      id,
      ownerId: (req.session.userId as string)
    }
  })

  if (isEditable === null) {
    res.status(403).json({ error: "Either the tryout is fictictuous or the tryout is not yours." });
    return;
  }

  const _ = await db.tryout.delete({
    where: { id }
  })
  res.json({ message: "Success!" })
  return
})


export default tryoutRouter;
