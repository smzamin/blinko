import { UPLOAD_FILE_PATH } from '@/lib/constant';
import sqlite3 from 'sqlite3';
import { prisma } from '../prisma';
import { adminCaller } from '../routers/_app';
import fs from 'fs/promises'
type Memo = {
  id: string,
  created_ts: number,
  updated_ts: number,
  content: string,
}

export class Memos {
  private db: sqlite3.Database
  initDB(filePath: string) {
    this.db = new sqlite3.Database(UPLOAD_FILE_PATH + '/' + filePath, (err) => {
      if (err) {
        console.error('can not connect to memos db', err.message);
      }
    });
  }
  async importMemosDB() {
    return new Promise((resolve, reject) => {
      this.db.each(`SELECT * FROM memo`, async (err, row: Memo) => {
        console.log(row)
        const blinkoNote = await prisma.notes.findFirst({ where: { content: row.content } })
        if (blinkoNote) {
          return
        }
        const note = await adminCaller.notes.upsert({
          content: row.content,
        })
        if (note) {
          await prisma.notes.update({
            where: { id: note.id },
            data: {
              createdAt: new Date(row.created_ts * 1000),
              updatedAt: new Date(row.updated_ts * 1000),
            }
          })
        }
        console.log('import memos success->', note?.content)
      }, (err, numRows) => {
        if (err) {
          reject(err);
        } else {
          resolve(true)
        }
      })
    })
  }

  async importFiles() {
    return new Promise((resolve, reject) => {
      this.db.each(`SELECT * FROM resource`, async (err, row: {
        memo_id: number,
        filename: string,
        blob: string,
        size: number,
      }) => {
        console.log(row)
        this.db.get(`SELECT * FROM memo WHERE id = ${row.memo_id}`, async (err, memo: Memo) => {
          if (memo) {
            const node = await prisma.notes.findFirst({ where: { content: memo.content } })
            if (node) {
              try {
                const attachment = await prisma.attachments.findFirst({ where: { name: row.filename } })
                if (attachment) {
                  return
                }
                const fileName = 'memosfile_' + row.filename
                const filePath = UPLOAD_FILE_PATH + '/' + fileName
                await fs.writeFile(filePath, row.blob)
                await prisma.attachments.create({
                  data: {
                    name: row.filename,
                    path: '/api/file/' + fileName,
                    size: row.size,
                    noteId: node.id,
                  }
                })
              } catch (error) {
                console.error('import files error->', error)
              }
            }
          }
        })
      }, (err, numRows) => {
        if (err) {
          reject(err);
        } else {
          resolve(true)
        }
      })
    })
  }
}
