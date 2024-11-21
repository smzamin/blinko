import { Icon } from "@iconify/react"
import { observer } from "mobx-react-lite"
import { Popover, PopoverTrigger, PopoverContent } from "@nextui-org/popover";
import { Image, Textarea } from "@nextui-org/react";
import { RootStore } from "@/store";
import { BlinkoStore } from "@/store/blinkoStore";
import { motion } from "framer-motion"
import { AiStore } from "@/store/aiStore";
import { useEffect, useRef } from "react";
import { useMediaQuery } from "usehooks-ts";
import { DialogStore } from "@/store/module/Dialog";
import { UserStore } from "@/store/user";
import { useTranslation } from "react-i18next";
import { ScrollArea, ScrollAreaHandles } from "../Common/ScrollArea";
import Link from "next/link";
import DraggableDiv from "../Common/DragContainer";
import dayjs from "@/lib/dayjs";
import { FilesAttachmentRender } from "../Common/AttachmentRender";

export const BlinkoAiChat = observer(() => {
  const ai = RootStore.Get(AiStore)
  const user = RootStore.Get(UserStore)
  const scrollAreaRef = useRef<ScrollAreaHandles>(null);
  const { t } = useTranslation()
  useEffect(() => {
    scrollAreaRef.current?.scrollToBottom()
  }, [ai.scrollTicker])

  return <div className="flex flex-col p-0 md:p-2 relative h-full">
    <ScrollArea
      onBottom={() => { }}
      ref={scrollAreaRef}
      key='BlinkoAiChat'
      className={`mx-1 w-full !h-[500px] md:!h-[360px]`}>
      {
        ai.chatHistory.list.length == 0 && <div className="font-bold mt-5 select-none text-desc">
          <Image src="/single-logo.svg" className="ml-[-8px]" width={40} />
          {t('hi-user-name-i-can-search-for-the-notes-for-you-how-can-i-help-you-today', { name: user.name })}
        </div>
      }
      {ai.chatHistory.list?.map((i, index) => {
        return <div className="flex flex-col w-full gap-2">
          {i.role == 'user' && <div className="text-center text-desc">{dayjs(i.createAt).fromNow()}</div>}
          {
            i.role == 'user' && <div className="ml-auto max-w-[80%] mb-2 bg-primary text-primary-foreground p-2 rounded-xl">
              {i.content}
            </div>
          }
          {
            i.role == 'assistant' &&
            <div className="flex flex-col gap-1">
              <div className="max-w-[80%] mb-2 bg-sencondbackground p-2 rounded-xl">
                {
                  (i.content == '') ?
                    <div className="flex items-center gap-1">
                      <div className='text-desc'>Thinking</div>
                      <Icon icon="eos-icons:three-dots-loading" width="20" height="20" />
                    </div> : i.content
                }
              </div>
              {
                (ai.chatHistory.list?.length == index + 1) && <div className="flex flex-col gap-1">
                  {ai.relationNotes?.list?.map(note => {
                    return <Link href={`/detail?id=${note.id}`} className="w-[90%] flex flex-col gap-1 justify-center cursor-pointer blinko-tag" style={{ fontSize: '11px' }}>
                      <div className="flex items-center gap-1">
                        <Icon className="min-w-[15px]" icon="uim:arrow-up-left" width="15" height="15" />
                        {note.content && <div className="truncate  ">{note.content}</div>}
                      </div>
                      <div className="text-foreground">
                        <FilesAttachmentRender preview files={note.attachments ?? []} />
                      </div>
                    </Link>
                  })}
                </div>
              }

            </div>
          }
        </div>
      })}
    </ScrollArea>
    <div className="flex gap-2 mt-auto w-full ">
      <div className="relative w-full pb-4 md:pb-0">
        <Textarea
          className="w-[78%]"
          variant="bordered"
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          onKeyUp={event => {
            event.preventDefault();
            if (event.key === 'Enter' && event.shiftKey) {
              ai.aiSearchText += '\n'
            } else if (event.key === 'Enter') {
              ai.completionsStream()
              ai.aiSearchText = ''
            }
          }}
          minRows={1}
          placeholder={t('enter-send-shift-enter-for-new-line')}
          value={ai.aiSearchText} onChange={e => {
            ai.aiSearchText = e.target.value
          }}
        />

        <div className="flex gap-3 absolute bottom-[22px] md:bottom-[7px] right-[5px] ">
          <div onClick={e => {
            ai.aiSearchText = ''
            ai.chatHistory.clear()
          }} className="cursor-pointer hover:opacity-80 transition-all rounded-full">
            <Icon icon="ant-design:clear-outlined" width="26" height="26" />
          </div>

          <div onClick={e => {
            if (ai.aiSearchText == '') return
            ai.completionsStream()
            ai.aiSearchText = ''
          }} className={`${ai.aiSearchText == '' ? 'opacity-30 select-none' : ''} cursor-pointer hover:opacity-70 transition-all rounded-full bg-primary text-primary-foreground`}>
            <Icon icon="uil:arrow-up" width="26" height="26" />
          </div>
        </div>
      </div>
    </div>
  </div >
})
export const BlinkoAiButton = () => {
  const isPc = useMediaQuery('(min-width: 768px)')
  return <DraggableDiv >
    <motion.div whileHover={{ opacity: 1, scale: 1.1 }} whileTap={{ scale: 1.2 }}
      className="rounded-full p-2 cursor-pointer bg-primary !z-20 opacity-70 text-primary-foreground" onClick={e => {
        if (!isPc) {
          RootStore.Get(DialogStore).setData({
            isOpen: true,
            content: <BlinkoAiChat />,
            size: '5xl'
          })
        }
      }}
    >
      <Icon icon="mingcute:ai-line" width="20" height="20" />
    </motion.div>
  </DraggableDiv>
}

export const BlinkoAi = observer(() => {
  const blinko = RootStore.Get(BlinkoStore)
  const isPc = useMediaQuery('(min-width: 768px)')
  return <>
    {
      isPc ? <Popover placement="top">
        <PopoverTrigger>
          <motion.div whileHover={{ opacity: 1, scale: 1.1 }} whileTap={{ scale: 1.2 }}
            className="fixed rounded-full p-2 cursor-pointer bg-primary bottom-[15%] right-[10%] md:bottom-10 md:right-20 z-10 opacity-70 text-primary-foreground">
            <Icon icon="mingcute:ai-line" width="20" height="20" />
          </motion.div>
        </PopoverTrigger>
        <PopoverContent>
          <div className="h-[420px] w-[420px]">
            <BlinkoAiChat />
          </div>
        </PopoverContent>
      </Popover> : <BlinkoAiButton />
    }
  </>
})