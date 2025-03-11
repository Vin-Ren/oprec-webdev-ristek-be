/// <reference path="../@types/express-session/index.d.ts" />
import { Router } from "express";
import { Prisma, TryoutVisibility } from '@prisma/client';

import db from "../lib/prisma";
import zodSchemaValidator from "../lib/zodSchemaValidator";
import { CreateTryoutParams, createTryoutSchema, SearchTryoutParams, searchTryoutSchema, UpdateTryoutParams, updateTryoutSchema } from "../schemas/tryout";

const tryoutRouter = Router()

tryoutRouter.get('/', async (req, res) => {
  try {
    const tryouts = await db.tryout.findMany({
      where: {
        visibility: "PUBLIC",
      },
      select: {
        id: true,
        name: true,
        opensAt: true,
        closesAt: true,
        duration: true
      }
    });
    res.json({ tryouts });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.sendStatus(500)
    }
  }
})

tryoutRouter.get('/mine', async (req, res) => {
  try {
    const tryouts = await db.tryout.findMany({
      where: {
        ownerId: req.session.userId || ""
      },
      select: {
        id: true,
        name: true,
        opensAt: true,
        closesAt: true,
        duration: true
      }
    });
    res.json({ tryouts });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.sendStatus(500)
    }
  }
})

tryoutRouter.get('/search', zodSchemaValidator(searchTryoutSchema), async (req, res) => {
  try {
    const searchParams: SearchTryoutParams = req.body
    const selectors = [];
    if (searchParams.name) {
      selectors.push({
        name: {
          contains: searchParams.name
        }
      })
    }

    if (searchParams.afterDate) {
      selectors.push({
        createdAt: {
          gt: searchParams.afterDate
        }
      })
    }

    if (searchParams.beforeDate) {
      selectors.push({
        createdAt: {
          lt: searchParams.beforeDate
        }
      })
    }

    const tryouts = await db.tryout.findMany({
      where: {
        OR: [
          (req.session.user?.role === 'Admin') ? {} : { visibility: { not: "PRIVATE" } },
          { ownerId: req.session.userId }
        ],
        AND: selectors
      },
      select: {
        id: true,
        name: true,
        opensAt: true,
        closesAt: true,
        duration: true
      }
    });
    res.json({ tryouts });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.sendStatus(500)
    }
  }
})

tryoutRouter.get('/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(404).json({ error: "404 Not Found." })
      return
    }

    const publicTryoutTransact = db.tryout.findUniqueOrThrow({
      where: {
        id,
        OR: [
          {
            visibility: {
              not: "PRIVATE"
            },
          },
          { ownerId: req.session.userId || '' }
        ]
      },
      omit: {
        ownerId: true,
        passphrase: true,
        shuffled: true,
        questionsOrder: true,
        editable: true
      }
    });

    const ownerTryoutTransact = db.tryout.findUnique({
      where: {
        id,
        ownerId: req.session.userId
      }
    })

    const totalAggTransact = db.question.aggregate({
      where: { tryoutId: id },
      _count: true,
      _sum: {
        weight: true
      }
    });

    const [tryout, tryoutExtended, totalAgg] = await db.$transaction([
      publicTryoutTransact, ownerTryoutTransact, totalAggTransact
    ]);

    res.json({
      tryout: {
        ...tryout,
        ...(tryoutExtended || {}),
        questionCount: totalAgg._count,
        totalScore: totalAgg._sum.weight
      }
    });
    return;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error as Prisma.PrismaClientKnownRequestError).code === 'P2025') {
      res.sendStatus(404)
      return
    } else {
      res.sendStatus(500)
    }
    console.log(error)
  }
})


tryoutRouter.post('/', zodSchemaValidator(createTryoutSchema), async (req, res) => {
  try {
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(500)
    }
  }
})


tryoutRouter.put('/:id', zodSchemaValidator(updateTryoutSchema), async (req, res) => {
  try {
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(500)
    }
  }
})

tryoutRouter.delete('/:id', async (req, res) => {
  try {
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(500)
    }
  }
})


export default tryoutRouter;
