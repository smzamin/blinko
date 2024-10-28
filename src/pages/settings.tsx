import { observer } from "mobx-react-lite";
import { BasicSetting } from "@/components/BlinkoSettings/BasicSetting";
import { AiSetting } from "@/components/BlinkoSettings/AiSetting";
import { PerferSetting } from "@/components/BlinkoSettings/PerferSetting";
import { TaskSetting } from "@/components/BlinkoSettings/TaskSetting";
import { ImportSetting } from "@/components/BlinkoSettings/ImportSetting";
import { ScrollArea } from "@/components/Common/ScrollArea";

const Page = observer(() => {
  return <div className="h-mobile-full ">
    <ScrollArea onBottom={() => { }} className="px-2 md:px-6 pt-2 pb-6 flex flex-col gap-8 ">
      <BasicSetting />
      <PerferSetting />
      <AiSetting />
      <TaskSetting />
      <ImportSetting />
    </ScrollArea >
  </div>
});

export default Page