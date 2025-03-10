import { TryoutVisibility } from "@prisma/client";
import { z } from "zod";


const createTryoutSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().optional(),
  questionsOrder: z.string().optional(),
  shuffled: z.boolean().optional(),
  opensAt: z
    .string()
    .transform((val) => new Date(val))
    .refine((date) => !isNaN(date.getTime()), { message: "Invalid date format" }),
  closesAt: z
    .string()
    .transform((val) => new Date(val))
    .refine((date) => !isNaN(date.getTime()), { message: "Invalid date format" }),
  duration: z.number().int().min(0).max(86400), // Max duration is 1 day.
  visibility: z.nativeEnum(TryoutVisibility),
  passphrase: z.string().max(100).optional()
});

type CreateTryoutParams = z.infer<typeof createTryoutSchema>


const updateTryoutSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().optional(),
  questionsOrder: z.string().optional(),
  shuffled: z.boolean().optional(),
  opensAt: z
    .string()
    .transform((val) => new Date(val))
    .refine((date) => !isNaN(date.getTime()), { message: "Invalid date format" }),
  closesAt: z
    .string()
    .transform((val) => new Date(val))
    .refine((date) => !isNaN(date.getTime()), { message: "Invalid date format" }),
  duration: z.number().int().min(0).max(86400), // Max duration is 1 day.
  visibility: z.nativeEnum(TryoutVisibility),
  passphrase: z.string().max(100).optional()
});

type UpdateTryoutParams = z.infer<typeof updateTryoutSchema>


export { createTryoutSchema, CreateTryoutParams, updateTryoutSchema, UpdateTryoutParams };
