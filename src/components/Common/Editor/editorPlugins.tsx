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
  
  let lastIndex = 0;
  let result = '';
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const beforeCode = content.slice(lastIndex, match.index);
    result += beforeCode.replace(/(<[^>]+>)/gi, '\\$1');

    const [_, language, code] = match;
    if (!language || !(language in codeBlockLanguages)) {
      result += '```plain\n' + code.trim() + '\n```';
    } else {
      result += '```' + language + '\n' + code.trim() + '\n```';
    }

    lastIndex = codeBlockRegex.lastIndex;
  }

  const afterLastCode = content.slice(lastIndex);
  result += afterLastCode.replace(/(<[^>]+>)/gi, '\\$1');

  return result;
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