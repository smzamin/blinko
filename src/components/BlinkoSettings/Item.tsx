import { observer } from "mobx-react-lite"

export const Item = observer(({ leftContent, rightContent, type = 'row' }: any) => {

  if (type == 'col') {
    return <div className="flex flex-col py-2">
      <div className="font-bold">{leftContent}</div>
      <div className="mt-2 w-full">{rightContent}</div>
    </div>
  } else {
    return <div className="flex flex-row items-center py-2">
      <div className="font-bold">{leftContent}</div>
      <div className="ml-auto">{rightContent}</div>
    </div>
  }
})
