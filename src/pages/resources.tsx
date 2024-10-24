import { helper } from "@/lib/helper";
import { RootStore } from "@/store";
import { BlinkoStore } from "@/store/blinkoStore";
import { Card, Image } from "@nextui-org/react";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { FileIcon, defaultStyles } from 'react-file-icon';
import { filesize } from "filesize";
import dayjs from "@/lib/dayjs";
import { ScrollArea } from "@/components/Common/ScrollArea";
import { PhotoProvider, PhotoView } from "react-photo-view";

const Page = observer(() => {
  const blinko = RootStore.Get(BlinkoStore)
  useEffect(() => {
    blinko.resourceList.resetAndCall({})
  }, [])
  return <ScrollArea onBottom={() => blinko.resourceList.callNextPage({})} className="px-2 md:px-6 h-[calc(100vh_-_100px)]">
    <div className="columns-3 md:columns-3 lg:columns-5 gap-4 mt-4 ">
      <PhotoProvider>
        {
          blinko.resourceList.value?.map(i => {
            const extension = helper.getFileExtension(i.path)
            return <Card shadow="none" className="bg-background cursor-pointer px-4 pt-4 mb-4 pb-2 flex flex-col gap-2 items-center">
              {
                helper.isImage(i.path) ?
                  <PhotoView width={150} src={i.path} >
                    <Image radius="sm" className="w-full" src={i.path} alt='' />
                  </PhotoView> :
                  <div className="w-[60px] ">
                    <FileIcon extension={extension} {...defaultStyles[extension ?? '']} />
                  </div>
              }
              <div className="w-full break-words whitespace-normal text-xs font-bold">{decodeURIComponent(i.name)}</div>
              <div className="w-full break-words whitespace-normal text-xs text-desc ">{dayjs(i.createdAt).fromNow()}-{filesize(i.size as any, { standard: "jedec" })}</div>
            </Card>
          })
        }
      </PhotoProvider>
    </div>
  </ScrollArea>
});

export default Page