import { BlinkoCard } from "@/components/BlinkoCard";
import { ScrollArea } from "@/components/Common/ScrollArea";
import { api } from "@/lib/trpc";
import { RootStore } from "@/store";
import { PromisePageState } from "@/store/standard/PromiseState";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import Masonry from "react-masonry-css";

const Page = observer(() => {
  const store = RootStore.Local(() => ({
    shareNoteList: new PromisePageState({
      function: async () => {
        const notes = await api.notes.publicList.mutate({})
        return notes
      }
    })
  }))

  useEffect(() => {
    store.shareNoteList.resetAndCall()
  }, [])

  return <ScrollArea className='p-4 bg-sencondbackground h-[100vh] w-full' onBottom={() => store.shareNoteList.callNextPage()}>
    <Masonry
      breakpointCols={{
        default: 2,
        500: 1
      }}
      className="my-masonry-grid"
      columnClassName="my-masonry-grid_column">
      {
        store.shareNoteList?.value?.map(i => {
          return <BlinkoCard blinkoItem={i} isShareMode/>
        })
      }
    </Masonry>
  </ScrollArea>
});

export default Page