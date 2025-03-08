import { NextFunction, Request, Response } from "express";
import { z } from "zod";

function zodSchemaValidator<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  async function validateCreateTryout(req: Request, res: Response, next: NextFunction) {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ error: (error as z.ZodError).errors || "" });
    }
  }
}
