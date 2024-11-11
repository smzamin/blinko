import { RouterOutput, RouterInput } from "./routers/_app"
import { z } from "zod"

export type Note = Partial<NonNullable<RouterOutput['notes']['list'][0]>>
export type Attachment = NonNullable<Note['attachments']>[0] & { size: any }
export type Tag = NonNullable<RouterOutput['tags']['list']>[0]
export type Config = NonNullable<RouterOutput['config']['list']>
export type LinkInfo = NonNullable<RouterOutput['public']['linkPreview']>
export enum NoteType {
  'BLINKO',
  'NOTE'
}

export const ZConfigKey = z.union([
  z.literal('isAutoArchived'),
  z.literal('autoArchivedDays'),
  z.literal('isUseAI'),
  z.literal('aiModelProvider'),
  z.literal('aiApiKey'),
  z.literal('aiApiEndpoint'),
  z.literal('aiModel'),
  z.literal('isHiddenMobileBar'),
]);

export type ConfigKey = z.infer<typeof ZConfigKey>;

export const ZConfigSchema = z.object({
  isAutoArchived: z.boolean().optional(),
  autoArchivedDays: z.number().optional(),
  isUseAI: z.boolean().optional(),
  aiModelProvider: z.any(),
  aiApiKey: z.any(),
  aiApiEndpoint: z.any(),
  aiModel: z.any(),
  isHiddenMobileBar: z.boolean().optional(),
});

export type GlobalConfig = z.infer<typeof ZConfigSchema>;

