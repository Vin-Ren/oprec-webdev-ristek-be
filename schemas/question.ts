import { QuestionType } from "@prisma/client";
import { z } from "zod";


export const getQuestionsByTryoutIdSchema = z.object({ tryoutId: z.string().cuid() })

export type QuestionsByTryoutIdParams = z.infer<typeof getQuestionsByTryoutIdSchema>

export const getQuestionByIdSchema = z.object({ id: z.number() })

export type QuestionByIdParams = z.infer<typeof getQuestionByIdSchema>

export const createQuestionSchema = z.object({
  content: z.string().nonempty("Content is required"), // Content of the question, must be a non-empty string
  weight: z.number().min(0).default(1), // Weight must be a positive number, default is 1
  type: z.nativeEnum(QuestionType), // Validates based on the defined QuestionType enum
  tryoutId: z.string().nonempty("Tryout ID is required"), // Required tryout ID, must be a non-empty string
});

export type CreateQuestionParams = z.infer<typeof createQuestionSchema>

export const updateQuestionSchema = z.object({
  content: z.string().nonempty("Content is required"), // Content of the question, must be a non-empty string
  weight: z.number().min(0).default(1), // Weight must be a positive number, default is 1
  type: z.nativeEnum(QuestionType), // Validates based on the defined QuestionType enum
  tryoutId: z.string().nonempty("Tryout ID is required"), // Required tryout ID, must be a non-empty string
});

export type UpdateQuestionParams = z.infer<typeof updateQuestionSchema>
