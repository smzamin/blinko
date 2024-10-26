import { observer } from "mobx-react-lite"

export const Item = observer(({ leftContent, rightContent }: any) => {
  return <div className="flex items-center py-2">
    <div className="font-bold">{leftContent}</div>
    <div className="ml-auto">{rightContent}</div>
  </div>
})
