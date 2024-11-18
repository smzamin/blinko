import { codeMirrorPlugin, headingsPlugin, imagePlugin, linkPlugin, sandpackPlugin } from '@mdxeditor/editor';
import { simpleSandpackConfig } from './type';
const { codeBlockPlugin, tablePlugin, listsPlugin, quotePlugin, markdownShortcutPlugin } = await import('@mdxeditor/editor')
export const codeBlockLanguages = {
  plain: "plain",
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
  ini: "INI"
}

export const ProcessCodeBlocks = (content: string): string => {
  if (!content) return '';
  const codeBlockRegex = /```(?:(\w*)\n)?([\s\S]*?)```/g;
  
  const htmlRegex = /(<[^>]+>)/gi;
  try {
    return content.replace(codeBlockRegex, (match, language, code) => {
      if (!language || !(language in codeBlockLanguages)) {
        return '```plain\n' + code.trim() + '\n```';
      }
      return '```' + language + '\n' + code.trim() + '\n```';
    }).replace(htmlRegex, '\\$1');
  } catch (error) {
    
    return content
  }
};

export const MyPlugins = [
  codeBlockPlugin({ defaultCodeBlockLanguage: 'plain' }),
  sandpackPlugin({ sandpackConfig: simpleSandpackConfig }),
  codeMirrorPlugin({
    codeBlockLanguages
  }),
  imagePlugin(),
  listsPlugin(),
  linkPlugin(),
  quotePlugin(),
  tablePlugin(),
  headingsPlugin(),
  markdownShortcutPlugin()
]