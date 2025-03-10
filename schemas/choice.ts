import { z } from "zod";


export const getChoicesByQuestionIdSchema = z.object({ questionId: z.number() })

export type ChoicesByQuestionIdParams = z.infer<typeof getChoicesByQuestionIdSchema>

export const getChoiceByIdSchema = z.object({ id: z.number() })

export type ChoiceByIdParams = z.infer<typeof getChoiceByIdSchema>

export const createChoiceSchema = z.object({
  content: z.string().nonempty("Content is required"), // Content of the Choice, must be a non-empty string
  questionId: z.number({ message: "Requires question id" }), // Required Question ID, must be a non-empty string
});

export type CreateChoiceParams = z.infer<typeof createChoiceSchema>

export const updateChoiceSchema = z.object({
  content: z.string().nonempty("Content is required"), // Content of the Choice, must be a non-empty string
  questionId: z.number({ message: "Requires question id" }), // Required Question ID, must be a non-empty string
});

export type UpdateChoiceParams = z.infer<typeof updateChoiceSchema>
