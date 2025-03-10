import { z } from "zod";


export const getAnswersByQuestionIdSchema = z.object({ questionId: z.number() })

export type AnswersByQuestionIdParams = z.infer<typeof getAnswersByQuestionIdSchema>

export const getAnswerByIdSchema = z.object({ id: z.number() })

export type AnswerByIdParams = z.infer<typeof getAnswerByIdSchema>

export const createAnswerSchema = z.object({
  content: z.string().optional(),
  choiceId: z.number().optional(),
  questionId: z.number({ message: "Requires question id" }),
});

export type CreateAnswerParams = z.infer<typeof createAnswerSchema>

export const updateAnswerSchema = z.object({
  content: z.string().optional(),
  choiceId: z.number().optional(),
  questionId: z.number({ message: "Requires question id" }),
});

export type UpdateAnswerParams = z.infer<typeof updateAnswerSchema>
