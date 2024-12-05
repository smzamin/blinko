import { helper } from "@/lib/helper"
import { Attachment } from "@/server/types"
import { FileType } from "./type"
import { PromiseState } from "@/store/standard/PromiseState"
import { IsTagSelectVisible } from "../PopoverFloat/tagSelectPop"
import { MDXEditorMethods } from "@mdxeditor/editor"

export type ViewMode = 'source' | 'rich-text';

export type ToolbarProps = {
  store: any;
  files: FileType[];
  openFileDialog: () => void;
  getInputProps: any;
  mode: 'create' | 'edit';
  isPc: boolean;
  canSend: boolean;
  isSendLoading?: boolean;
  mdxEditorRef: React.RefObject<MDXEditorMethods>;
  onSend?: (args: any) => Promise<any>;
  onChange?: (content: string) => void;
}

export type UploadAction = {
  key: string;
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  showCondition?: boolean;
}
export const HandleFileType = (originFiles: Attachment[]): FileType[] => {
  if (originFiles?.length == 0) return []
  const res = originFiles?.map(file => {
    const extension = helper.getFileExtension(file.name)
    const previewType = helper.getFileType(file.type, file.name)
    return {
      name: file.name,
      size: file.size,
      previewType,
      extension: extension ?? '',
      preview: file.path,
      uploadPromise: new PromiseState({ function: async () => file.path }),
      type: file.type
    }
  })
  res?.map(i => i.uploadPromise.call())
  return res
}

export const getEditorElements = () => {
  const editorElements = document.querySelectorAll('._contentEditable_uazmk_379') as NodeListOf<HTMLElement>
  return editorElements
}


export const handleEditorKeyEvents = () => {
  const editorElements = getEditorElements()
  editorElements.forEach(element => {
    element.addEventListener('keydown', (e) => {
      const isTagSelectVisible = IsTagSelectVisible()
      if (e.key === 'Enter' && isTagSelectVisible) {
        e.preventDefault()
        return false
      }
    }, true)
  })
}
