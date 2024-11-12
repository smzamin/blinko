import { observer } from "mobx-react-lite"

type IProps = {
  leftContent?: any
  rightContent?: any
  type?: 'row' | 'col'
  hidden?: boolean
}
export const Item = observer(({ leftContent, rightContent, type = 'row', hidden = false }: IProps) => {
  if (hidden) return null
  if (type == 'col') {
    return <div className="flex flex-col py-2">
      <div className="font-bold">{leftContent}</div>
      <div className="mt-2 w-full">{rightContent}</div>
    </div>
  } else {
    return <div className="flex flex-row items-center py-2">
      {!!leftContent && <div className={rightContent ? "font-bold" : 'w-full'}>{leftContent}</div>}
      {!!rightContent && <div className="ml-auto">{rightContent}</div>}
    </div>
  }
})
