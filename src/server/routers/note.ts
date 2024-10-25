import { router, authProcedure } from '../trpc';
import { z } from 'zod';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import { helper, TagTreeNode } from '@/lib/helper';
import { _ } from '@/lib/lodash';
import { NoteType } from '../types';

export const noteRouter = router({
  list: authProcedure
    .input(z.object({
      tagId: z.union([z.number(), z.null()]).default(null),
      page: z.number().default(1),
      size: z.number().default(10),
      orderBy: z.enum(["asc", 'desc']).default('desc'),
      type: z.union([z.nativeEnum(NoteType), z.literal(-1)]).default(-1),
      isArchived: z.boolean().default(false).optional(),
      isRecycle: z.boolean().default(false).optional(),
      searchText: z.string().default('').optional()
    }))
    .query(async function ({ input }) {
      const { tagId, type, isArchived, isRecycle, searchText, page, size, orderBy } = input
      let where: Prisma.notesWhereInput = { isArchived, isRecycle }
      if (tagId) {
        const tags = await prisma.tagsToNote.findMany({ where: { tagId } })
        console.log("findTags!", tags)
        where.id = { in: tags?.map(i => i.noteId) }
      }
      if (searchText != '') {
        where.content = { contains: searchText }
      }
      if (type != -1) { where.type = type }
      return await prisma.notes.findMany({
        where,
        orderBy: { createdAt: orderBy },
        skip: (page - 1) * size,
        take: size,
        include: { tags: true, attachments: true }
      })
    }),
  upsert: authProcedure
    .input(z.object({
      content: z.string().default(''),
      type: z.union([z.nativeEnum(NoteType), z.literal(-1)]).default(-1),
      attachments: z.custom<Pick<Prisma.attachmentsCreateInput, 'name' | 'path' | 'size'>[]>().default([]),
      id: z.number().optional(),
      isArchived: z.union([z.boolean(), z.null()]).default(null)
    }))
    .mutation(async function ({ input }) {
      let { id, isArchived, type, attachments, content } = input
      content = content?.replace(/\\/g, '').replace(/&#x20;/g, ' ')
      const tagTree = helper.buildHashTagTreeFromHashString(helper.extractHashtags(content ?? ''))

      let newTags: Prisma.tagCreateManyInput[] = []
      const handleAddTags = async (tagTree: TagTreeNode[], parentTag: Prisma.tagCreateManyInput | undefined, noteId?: number) => {
        for (const i of tagTree) {
          let hasTag = await prisma.tag.findFirst({ where: { name: i.name, parent: parentTag?.id ?? 0 } })
          if (!hasTag) {
            hasTag = await prisma.tag.create({ data: { name: i.name, parent: parentTag?.id ?? 0 } })
          }
          if (noteId) {
            const hasRelation = await prisma.tagsToNote.findFirst({ where: { tag: hasTag, noteId } })
            !hasRelation && await prisma.tagsToNote.create({ data: { tagId: hasTag.id, noteId } })
          }
          if (i?.children) {
            await handleAddTags(i.children, hasTag, noteId);
          }
          newTags.push(hasTag)
        }
      }


      const update: Prisma.notesUpdateInput = {
        ...(type !== -1 && { type }),
        ...(isArchived !== null && { isArchived }),
        ...(content && { content })
      }

      if (id) {
        const note = await prisma.notes.update({ where: { id }, data: update })
        const oldTagsInThisNote = await prisma.tagsToNote.findMany({ where: { noteId: note.id }, include: { tag: true } })
        await handleAddTags(tagTree, undefined)
        const oldTags = oldTagsInThisNote.map(i => i.tag).filter(i => !!i)
        const oldTagsString = oldTags.map(i => `${i?.name}<key>${i?.parent}`)
        const newTagsString = newTags.map(i => `${i?.name}<key>${i?.parent}`)
        const needTobeAddedRelationTags = _.difference(newTagsString, oldTagsString);
        const needToBeDeletedRelationTags = _.difference(oldTagsString, newTagsString);
        console.log({ oldTags, newTags, needToBeDeletedRelationTags, needTobeAddedRelationTags })
        if (needToBeDeletedRelationTags.length != 0) {
          await prisma.tagsToNote.deleteMany({
            where: {
              note: {
                id: note.id
              },
              tag: {
                id: {
                  in: needToBeDeletedRelationTags.map(i => {
                    const [name, parent] = i.split('<key>')
                    return oldTags.find(t => (t?.name == name) && (t?.parent == Number(parent)))!.id
                  }).filter(i => !!i)
                }
              }
            }
          })
        }

        if (needTobeAddedRelationTags.length != 0) {
          await prisma.tagsToNote.createMany({
            data: needTobeAddedRelationTags.map(i => {
              const [name, parent] = i.split('<key>')
              return { noteId: note.id, tagId: newTags.find(t => (t.name == name) && (t.parent == Number(parent)))!.id }
            })
          })
        }

        //delete unused tags
        const allTagsIds = oldTags?.map(i => i?.id)
        const usingTags = (await prisma.tagsToNote.findMany({ where: { tagId: { in: allTagsIds } } })).map(i => i.tagId).filter(i => !!i)
        console.log({ allTagsIds, usingTags })
        const needTobeDeledTags = _.difference(allTagsIds, usingTags);
        console.log({ needTobeDeledTags })
        if (needTobeDeledTags) {
          await prisma.tag.deleteMany({ where: { id: { in: needTobeDeledTags } } })
        }

        //insert not repeate attachments
        try {
          if (attachments?.length != 0) {
            const oldAttachments = await prisma.attachments.findMany({ where: { noteId: note.id } })
            const needTobeAddedAttachmentsPath = _.difference(attachments?.map(i => i.path), oldAttachments.map(i => i.path));
            if (needTobeAddedAttachmentsPath.length != 0) {
              await prisma.attachments.createMany({
                data: attachments?.filter(t => needTobeAddedAttachmentsPath.includes(t.path))
                  .map(i => { return { noteId: note.id, ...i } })
              })
            }
          }
        } catch (err) {
          console.log(err)
        }
        return note
      } else {
        try {
          const note = await prisma.notes.create({ data: { content, type } })
          await handleAddTags(tagTree, undefined, note.id)
          await prisma.attachments.createMany({
            data: attachments.map(i => { return { noteId: note.id, ...i } })
          })
          return note
        } catch (error) {
          console.log(error)
        }
      }
    }),
  updateMany: authProcedure
    .input(z.object({
      type: z.union([z.nativeEnum(NoteType), z.literal(-1)]).default(-1),
      isArchived: z.union([z.boolean(), z.null()]).default(null),
      isRecycle: z.union([z.boolean(), z.null()]).default(null),
      ids: z.array(z.number())
    }))
    .mutation(async function ({ input }) {
      const { type, isArchived, isRecycle, ids } = input
      const update: Prisma.notesUpdateInput = {
        ...(type !== -1 && { type }),
        ...(isArchived !== null && { isArchived }),
        ...(isRecycle !== null && { isRecycle }),
      }
      return await prisma.notes.updateMany({ where: { id: { in: ids } }, data: update })
    }),
  deleteMany: authProcedure
    .input(z.object({
      ids: z.array(z.number())
    }))
    .mutation(async function ({ input }) {
      const { ids } = input
      const notes = await prisma.notes.findMany({ where: { id: { in: ids } }, include: { tags: { include: { tag: true } }, attachments: true } })
      const handleDeleteRelation = async () => {
        for (const note of notes) {
          // await notesRepo.relations(note).tags.deleteMany({ where: { noteId: note.id } })
          await prisma.tagsToNote.deleteMany({ where: { noteId: note.id } })
          //delete unused tags
          const allTagsInThisNote = note.tags || []
          const oldTags = allTagsInThisNote.map(i => i.tag).filter(i => !!i)
          const allTagsIds = oldTags?.map(i => i?.id)
          const usingTags = (await prisma.tagsToNote.findMany({ where: { tagId: { in: allTagsIds } }, include: { tag: true } })).map(i => i.tag?.id).filter(i => !!i)
          const needTobeDeledTags = _.difference(allTagsIds, usingTags);
          if (needTobeDeledTags) {
            await prisma.tag.deleteMany({ where: { id: { in: needTobeDeledTags } } })
          }
          if (note.attachments) {
            for (const attachment of note.attachments) {
              try {
                await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/file/delete`, {
                  method: 'POST',
                  body: JSON.stringify({ attachment_path: attachment.path }),
                });
              } catch (error) {
                console.log(error)
              }
            }
          }
        }
      }
      await handleDeleteRelation()
      await prisma.notes.deleteMany({ where: { id: { in: ids } } })
      return { ok: true }
    }),
})

