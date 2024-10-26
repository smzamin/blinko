import { observer } from "mobx-react-lite";
import { BasicSetting } from "@/components/BlinkoSettings/BasicSetting";
import { AiSetting } from "@/components/BlinkoSettings/AiSetting";
import { PerferSetting } from "@/components/BlinkoSettings/PerferSetting";
import { TaskSetting } from "@/components/BlinkoSettings/TaskSetting";
import { ImportSetting } from "@/components/BlinkoSettings/ImportSetting";

const Page = observer(() => {
  return <>
    <div className="px-2 md:px-6 pt-2 flex flex-col gap-8">
      <BasicSetting />
      <AiSetting />
      <PerferSetting />
      <TaskSetting />
      <ImportSetting />
      {/* <Button onClick={e => {
        PromiseCall(api.task.restoreDB.query({ filePath: ".blinko/files/blinko_export.bko" }))
      }}>Import db</Button> */}
    </div >
  </>
});

export default Page