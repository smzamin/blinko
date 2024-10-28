import { BlinkoCard } from "@/components/BlinkoCard";
import { ScrollArea } from "@/components/Common/ScrollArea";
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
  }, [router.isReady])

  return <ScrollArea onBottom={() => { }} className='p-6'>{
    blinko.noteDetail.value && <BlinkoCard blinkoItem={blinko.noteDetail.value} />
  } </ScrollArea>
})

export default Detail