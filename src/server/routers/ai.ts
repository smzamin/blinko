import { router, authProcedure } from '../trpc';
import { z } from 'zod';
import { AiService } from '../plugins/ai';

export const aiRouter = router({
  embeddingUpsert: authProcedure
    .input(z.object({
      id: z.number(),
      content: z.string(),
      type: z.enum(['update', 'insert'])
    }))
    .mutation(async ({ input }) => {
      const { id, content, type } = input
      try {
        const res = await AiService.embeddingUpsert({ id, content, type })
        return res
      } catch (error) {
        return { ok: false, msg: error?.message }
      }
    }),
  embeddingDelete: authProcedure
    .input(z.object({
      id: z.number()
    }))
    .mutation(async ({ input }) => {
      const { id } = input
      try {
        const res = await AiService.embeddingDelete({ id })
        return res
      } catch (error) {
        return { ok: false, msg: error?.message }
      }
    }),
  completions: authProcedure
    .input(z.object({
      question: z.string(),
      conversations: z.array(z.object({ role: z.string(), content: z.string() }))
    }))
    .mutation(async function* ({ input }) {
      const { question, conversations } = input
      try {
        const { result: responseStream, notes } = await AiService.completions({ question, conversations })
        yield { notes }
        for await (const chunk of responseStream) {
          yield { context: chunk }
        }
      } catch (error) {
        throw new Error(error)
      }
    }),
  speechToText: authProcedure
    .input(z.object({
      filePath: z.string()
    }))
    .mutation(async function ({ input }) {
      const { filePath } = input
      try {
        const doc = await AiService.speechToText(filePath)
        return doc
      } catch (error) {
        throw new Error(error)
      }
    })
})
