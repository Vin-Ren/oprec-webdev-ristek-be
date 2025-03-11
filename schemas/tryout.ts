import { TryoutVisibility } from "@prisma/client";
import { z } from "zod";


export const createTryoutSchema = z.object({
  name: z.string().min(3, "Name should be at least 3 characters").max(50, "Name should be at most 50 characters"),
  description: z.string().optional(),
  questionsOrder: z.string().optional(),
  shuffled: z.boolean().optional(),
  opensAt: z
    .string()
    .transform((val) => new Date(val))
    .refine((date) => !isNaN(date.getTime()), { message: "Invalid opens at date format" }),
  closesAt: z
    .string()
    .transform((val) => new Date(val))
    .refine((date) => !isNaN(date.getTime()), { message: "Invalid closes at date format" }),
  duration: z.number().int().min(0).max(86400), // Max duration is 1 day.
  visibility: z.nativeEnum(TryoutVisibility),
  passphrase: z.string().max(100).optional()
});

export type CreateTryoutParams = z.infer<typeof createTryoutSchema>


export const updateTryoutSchema = z.object({
  name: z.string().min(3, "Name should be at least 3 characters").max(50, "Name should be at most 50 characters"),
  description: z.string().optional(),
  questionsOrder: z.string().optional(),
  shuffled: z.boolean().optional(),
  opensAt: z
    .string()
    .transform((val) => new Date(val))
    .refine((date) => !isNaN(date.getTime()), { message: "Invalid opens at date format" }),
  closesAt: z
    .string()
    .transform((val) => new Date(val))
    .refine((date) => !isNaN(date.getTime()), { message: "Invalid closes at date format" }),
  duration: z.number().int().min(0).max(86400), // Max duration is 1 day.
  visibility: z.nativeEnum(TryoutVisibility),
  passphrase: z.string().max(100).optional()
});

export type UpdateTryoutParams = z.infer<typeof updateTryoutSchema>

export const searchTryoutSchema = z.object({
  name: z.string().optional(),
  beforeDate: z.date().optional(),
  afterDate: z.date().optional()
})

export type SearchTryoutParams = z.infer<typeof searchTryoutSchema>

