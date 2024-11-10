import { codeMirrorPlugin, linkPlugin, sandpackPlugin } from '@mdxeditor/editor';
import { simpleSandpackConfig } from './type';
const { codeBlockPlugin, tablePlugin, listsPlugin, quotePlugin, markdownShortcutPlugin } = await import('@mdxeditor/editor')

export const MyPlugins = [
  codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
  sandpackPlugin({ sandpackConfig: simpleSandpackConfig }),
  codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS' } }),
  listsPlugin(),
  linkPlugin(),
  quotePlugin(),
  tablePlugin(),
  markdownShortcutPlugin()
]