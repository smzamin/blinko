import { codeMirrorPlugin, headingsPlugin, imagePlugin, linkPlugin, sandpackPlugin } from '@mdxeditor/editor';
import { simpleSandpackConfig } from './type';
const { codeBlockPlugin, tablePlugin, listsPlugin, quotePlugin, markdownShortcutPlugin } = await import('@mdxeditor/editor')

export const MyPlugins = [
  codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
  sandpackPlugin({ sandpackConfig: simpleSandpackConfig }),
  codeMirrorPlugin({
    codeBlockLanguages: {
      js: "JavaScript",
      javascript: "JavaScript",
      typescript: "TypeScript",
      html: "HTML",
      python: "Python",
      java: "Java",
      c: "C",
      csharp: "C#",
      php: "PHP",
      sql: "SQL",
      lua: "Lua",
      bash: "Shell (Bash)",
      shell: "Shell Script",
      json: "JSON",
      xml: "XML",
      yaml: "YAML",
      ini: "INI",
    }
  }),
  imagePlugin(),
  listsPlugin(),
  linkPlugin(),
  quotePlugin(),
  tablePlugin(),
  headingsPlugin(),
  markdownShortcutPlugin()
]