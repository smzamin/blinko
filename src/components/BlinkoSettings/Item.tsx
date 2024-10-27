import { observer } from "mobx-react-lite"

export const Item = observer(({ leftContent, rightContent }: any) => {
  return <div className="flex flex-col md:flex-row items-center py-2">
    <div className="font-bold">{leftContent}</div>
    <div className="ml-auto mt-2 md:mt-0">{rightContent}</div>
  </div>
})
