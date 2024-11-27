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
  z.literal('isAllowRegister'),
  z.literal('isOrderByCreateTime'),
  z.literal('timeFormat'),
  z.literal('objectStorage'),
  z.literal('s3AccessKeyId'),
  z.literal('s3AccessKeySecret'),
  z.literal('s3Endpoint'),
  z.literal('s3Bucket'),
  z.literal('s3Region'),
  z.literal('smallDeviceCardColumns'),
  z.literal('mediumDeviceCardColumns'),
  z.literal('largeDeviceCardColumns'),
  z.literal('textFoldLength'),
  z.literal('embeddingModel'),
]);

export type ConfigKey = z.infer<typeof ZConfigKey>;

export const ZConfigSchema = z.object({
  isAutoArchived: z.boolean().optional(),
  autoArchivedDays: z.number().optional(),
  isUseAI: z.boolean().optional(),
  aiModelProvider: z.any().optional(),
  aiApiKey: z.any().optional(),
  aiApiEndpoint: z.any().optional(),
  aiModel: z.any().optional(),
  isHiddenMobileBar: z.boolean().optional(),
  isAllowRegister: z.any().optional(),
  isOrderByCreateTime: z.any().optional(),
  timeFormat: z.any().optional(),
  smallDeviceCardColumns: z.any().optional(),
  mediumDeviceCardColumns: z.any().optional(),
  largeDeviceCardColumns: z.any().optional(),
  textFoldLength: z.number().optional(),
  objectStorage: z.any().optional(),
  s3AccessKeyId: z.any().optional(),
  s3AccessKeySecret: z.any().optional(),
  s3Endpoint: z.any().optional(),
  s3Bucket: z.any().optional(),
  s3Region: z.any().optional(),
  embeddingModel: z.any().optional(),
});

export type GlobalConfig = z.infer<typeof ZConfigSchema>;

