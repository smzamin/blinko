import { helper } from '@/lib/helper';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef(null);
  const { t } = useTranslation()
  useEffect(() => {
    if (contentRef.current) {
      //@ts-ignore
      const isContentOverflowing = contentRef.current.scrollHeight > contentRef.current.clientHeight;
        //@ts-ignore
      const isSingleLine = contentRef.current.clientHeight === parseFloat(getComputedStyle(contentRef.current).lineHeight);
      setIsOverflowing(isContentOverflowing && !isSingleLine);
    }
  }, []);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`markdown-body`}>
      <div ref={contentRef} data-markdown-theme={theme} className={`markdown-body content ${isExpanded ? "expanded" : "collapsed"}`}>
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
      {isOverflowing && content && (
        <div className='mt-2 cursor-pointer font-bold select-none hover:opacity-70 transition-all' onClick={toggleExpand}>{isExpanded ? t('show-less') : t('show-more')}</div>
      )}
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