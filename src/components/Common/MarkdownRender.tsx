import { helper } from '@/lib/helper';
import { useTheme } from 'next-themes';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { observer } from 'mobx-react-lite';
const highlightTags = (text) => {
  if (!text) return text
  try {
    const parts = text?.split(" ");
    return parts.map((part, index) => {
      if (part.match(helper.regex.isContainHashTag)) {
        return (
          <span key={index} className='blinko-tag px-11 font-bold cursor-pointer hover:opacity-80 transition-all' >
            {part + " "}
          </span>
        );
      } else {
        return part + " ";
      }
    });
  } catch (e) {
    // console.error(e)
    return text
  }
};

const Code = ({ className, children, ...props }) => {
  const { theme } = useTheme()
  const match = /language-(\w+)/.exec(className || '');
  return match ? (
    <SyntaxHighlighter
      {...props}
      PreTag="div"
      children={String(children).replace(/\n$/, '')}
      language={match[1]}
      style={theme == 'light' ? oneLight : oneDark}
    />
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

export const MarkdownRender = ({ content }) => {
  const { theme } = useTheme()
  return (
    <div className="markdown-body" >
      <div data-markdown-theme={theme}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ node, children }) => <p>{highlightTags(children)}</p>,
            code: Code
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};


export const StreamingCodeBlock = observer(({ markdown }: any) => {
  return (
    <ReactMarkdown components={{ code: Code }}>
      {markdown}
    </ReactMarkdown>
  );
});