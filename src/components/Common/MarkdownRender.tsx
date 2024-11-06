import { helper } from '@/lib/helper';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/trpc';
import { LinkInfo } from '@/server/types';
import { Card, Image } from '@nextui-org/react';
import { RootStore } from '@/store';
import { StorageState } from '@/store/standard/StorageState';

const highlightTags = (text) => {
  if (!text) return text
  try {
    const parts = text?.split(" ");
    return parts.map((part, index) => {
      if (part.match(helper.regex.isContainHashTag)) {
        return (
          <span key={index} className='select-none blinko-tag px-11 font-bold cursor-pointer hover:opacity-80 transition-all' >
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

const LinkPreview = ({ href }) => {
  // const [previewData, setPreviewData] = useState<LinkInfo | null>(null);
  const store = RootStore.Local(() => ({
    previewData: new StorageState<LinkInfo | null>({ key: href, default: null }),
  }))
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!store.previewData.value) {
          const info = await api.public.linkPreview.query(href)
          store.previewData.setValue(info)
        }
      } catch (error) {
        console.error('Error fetching preview data:', error);
      }
    };

    fetchData();
  }, [href]);

  return (
    <div className="link-preview">
      <a href={href} target="_blank" rel="noopener noreferrer">{href}</a>
      {store.previewData.value && <Card className='p-2 my-1 bg-sencondbackground rounded-lg select-none' radius='none' shadow='none'>
        <div className='flex items-center gap-2'>
          {store.previewData.value.image && <Image className='rounded-none' src={store.previewData.value.image} width={20} height={20}></Image>}
          <div>{store.previewData.value.domain}</div>
        </div>
        <div className='font-bold'>{store.previewData.value.title}</div>
        <div className='text-desc truncate'>{store.previewData.value.description}</div>
      </Card>}
    </div>
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
            code: Code,
            a: ({ node, children }) => <LinkPreview href={children} />
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