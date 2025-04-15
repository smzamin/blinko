import { LeftCickMenu, ShowEditBlinkoModel } from "@/components/BlinkoRightClickMenu";
import { FilesAttachmentRender } from "@/components/Common/AttachmentRender";
import { ContextMenuTrigger } from "@/components/Common/ContextMenu";
import { MarkdownRender } from "@/components/Common/MarkdownRender";
import { ScrollArea } from "@/components/Common/ScrollArea";
import { _ } from "@/lib/lodash";
import { RootStore } from "@/store";
import { BlinkoStore } from "@/store/blinkoStore";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import { useEffect } from "react";

const Detail = observer(() => {
  const router = useRouter()
  const blinko = RootStore.Get(BlinkoStore)
  useEffect(() => {
    if (router.query.id) {
      blinko.noteDetail.call({ id: Number(router.query.id) })
    }
  }, [router.isReady, router.query?.id, blinko.updateTicker, blinko.forceQuery])

  return <ScrollArea onBottom={() => {}} >
    <ContextMenuTrigger id="blink-item-context-menu" >
      <div
        onContextMenu={() => {
          blinko.curSelectedNote = _.cloneDeep(blinko.noteDetail.value!)
        }}
        onDoubleClick={() => {
          blinko.curSelectedNote = _.cloneDeep(blinko.noteDetail.value!)
          ShowEditBlinkoModel()
        }}
      >
        <div className="markdown-detail-body max-w-[800px] mx-auto bg-background px-4 py-2 md:py-6 md:px-8 rounded-2xl relative">
          <div className="flex items-center justify-end">
            <LeftCickMenu  className={'-mr-[10px] group-hover/card:ml-2'} onTrigger={() => { blinko.curSelectedNote = _.cloneDeep(blinko.noteDetail.value!) }} />
          </div>
          <MarkdownRender content={blinko.noteDetail.value?.content ?? ''} />
          <div className="mt-4">
            <FilesAttachmentRender files={blinko.noteDetail.value?.attachments ?? []} preview />
          </div>
          <div className="halation absolute bottom-10 left-0 md:left-[50%] h-[400px] w-[400px] overflow-hidden blur-3xl z-[0] pointer-events-none">
            <div className="w-full h-[100%] bg-[#c45cff] opacity-5"
              style={{ "clipPath": "circle(50% at 50% 50%)" }} />
          </div>
          <div className="halation absolute top-10 md:right-[50%] h-[400px] w-[400px] overflow-hidden blur-3xl z-[0] pointer-events-none">
            <div className="w-full h-[100%] bg-[#c45cff] opacity-5"
              style={{ "clipPath": "circle(50% at 50% 50%)" }} />
          </div>
        </div>
      </div>
    </ContextMenuTrigger>
  </ScrollArea>
})

export default Detail