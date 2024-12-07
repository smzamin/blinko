import { PromiseState } from "@/store/standard/PromiseState";
import { SandpackConfig } from "@mdxeditor/editor";

export const defaultSnippetContent = `
export default function App() {
  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>
    </div>
  );
}
`.trim()

export const simpleSandpackConfig: SandpackConfig = {
  defaultPreset: 'react',
  presets: [
    {
      label: 'React',
      name: 'react',
      meta: 'live react',
      sandpackTemplate: 'react',
      sandpackTheme: 'light',
      snippetFileName: '/App.js',
      snippetLanguage: 'jsx',
      initialSnippetContent: defaultSnippetContent
    },
  ]
}

export type OnSendContentType = {
  content: string;
  files: (FileType & { uploadPath: string })[]
  references: number[]
}

export type FileType = {
  name: string
  size: number
  previewType: 'image' | 'audio' | 'video' | 'other'
  extension: string
  preview: any
  uploadPromise: PromiseState<any>
  type: string // audio/webm
}

export const TranslationEditor = (key: string, defaultValue: string, interpolations, t: (key: string) => string) => {
  // Handle basic toolbar items
  if (key === 'toolbar.bulletedList') return t('bulleted-list');
  if (key === 'toolbar.numberedList') return t('numbered-list');
  if (key === 'toolbar.checkList') return t('check-list');
  if (key === 'toolbar.table') return t('insert-table');
  if (key === 'toolbar.codeBlock') return t('insert-codeblock');
  if (key === 'toolbar.insertSandpack') return t('insert-sandpack');
  if (key === 'toolbar.blockTypes.paragraph') return t('paragraph');
  if (key === 'toolbar.blockTypes.quote') return t('quote');
  if (key === 'toolbar.bold') return t('bold');
  if (key === 'toolbar.removeBold') return t('remove-bold');
  if (key === 'toolbar.italic') return t('italic');
  if (key === 'toolbar.removeItalic') return t('remove-italic');
  if (key === 'toolbar.underline') return t('underline');
  if (key === 'toolbar.removeUnderline') return t('remove-underline');
  if (key === 'toolbar.blockTypeSelect.selectBlockTypeTooltip') return t('select-block-type');
  if (key === 'toolbar.blockTypeSelect.placeholder') return t('block-type-select-placeholder');
  // console.log(key, defaultValue, interpolations?.level); // Keep for debugging if needed
  // Handle heading translations
  if (key.startsWith('toolbar.blockTypes.heading')) {
    return t('heading') + ' ' + interpolations?.level;
  }
  return defaultValue;
}