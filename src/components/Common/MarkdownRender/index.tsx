import { helper } from '@/lib/helper';
import { RootStore } from '@/store';
import { BlinkoStore } from '@/store/blinkoStore';
import { Skeleton } from '@heroui/react';
import 'katex/dist/katex.min.css';
import { observer } from 'mobx-react-lite';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import router, { useRouter } from 'next/router';
import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkTaskList from 'remark-task-list';
import { Code } from './Code';
import { ImageWrapper } from './ImageWrapper';
import { LinkPreview } from './LinkPreview';
import { ListItem } from './ListItem';
import { TableWrapper } from './TableWrapper';

const MermaidWrapper = dynamic(() => import('./MermaidWrapper').then(mod => mod.MermaidWrapper), {
  loading: () => <Skeleton className='w-full h-[40px]' />,
  ssr: false
});

const MarkmapWrapper = dynamic(() => import('./MarkmapWrapper').then(m => m.MarkmapWrapper), {
  loading: () => <Skeleton className='w-full h-[40px]' />,
  ssr: false
});

const EchartsWrapper = dynamic(() => import('./EchartsWrapper'), {
  loading: () => <Skeleton className='w-full h-[40px]' />,
  ssr: false
});

const HighlightTags = observer(({ text, }: { text: any }) => {
  const { pathname } = useRouter()
  if (!text) return text
  try {
    const decodedText = text.replace(/&nbsp;/g, ' ');
    const lines = decodedText?.split("\n");
    return lines.map((line, lineIndex) => {
      const parts = line.split(/\s+/);
      const processedParts = parts.map((part, index) => {
        if (part.startsWith('#') && part.length > 1 && part.match(helper.regex.isContainHashTag)) {
          const isShareMode = pathname.includes('share')
          if (isShareMode) return <span key={`${lineIndex}-${index}`} className={`w-fit select-none blinko-tag px-1 font-bold cursor-pointer hover:opacity-80 transition-all`}>{part + " "}</span>
          return (
            <span key={`${lineIndex}-${index}`}
              className={`select-none blinko-tag px-1 font-bold cursor-pointer hover:opacity-80 transition-all ${isShareMode ? 'pointer-events-none' : ''}`}
              onClick={async () => {
                if (isShareMode) return;
                await router.replace(`/?path=all&searchText=${encodeURIComponent(part)}`)
                RootStore.Get(BlinkoStore).forceQuery++
              }}>
              {part + " "}
            </span>
          );
        } else {
          return part + " ";
        }
      });
      return [...processedParts, <br key={`br-${lineIndex}`} />];
    });
  } catch (e) {
    return text
  }
});

const Table = ({ children }: { children: React.ReactNode }) => {
  return <div className="table-container">{children}</div>;
};

export const MarkdownRender = observer(({ content = '', onChange, isShareMode }: { content?: string, onChange?: (newContent: string) => void, isShareMode?: boolean }) => {
  const { theme } = useTheme()
  const contentRef = useRef(null);

  return (
    <div className={`markdown-body`}>
      <div ref={contentRef} data-markdown-theme={theme} className={`markdown-body content`}>
        <ReactMarkdown
          remarkPlugins={[
            [remarkGfm, { table: false }],
            remarkTaskList,
            [remarkMath, {
              singleDollarTextMath: true,
              inlineMath: [['$', '$']],
              blockMath: [['$$', '$$']]
            }]
          ]}
          rehypePlugins={[
            rehypeRaw,
            [rehypeKatex, {
              throwOnError: false,
              output: 'html',
              trust: true,
              strict: false
            }]
          ]}
          components={{
            p: ({ node, children }) => <p><HighlightTags text={children} /></p>,
            code: ({ node, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';

              if (language === 'mermaid') {
                return <MermaidWrapper content={String(children)} />;
              }

              if (language === 'mindmap') {
                return <MarkmapWrapper content={String(children)} />;
              }

              if (language === 'echarts') {
                return <EchartsWrapper options={String(children).trim()} />;
              }

              return <Code node={node} className={className} {...props}>{children}</Code>;
            },
            a: ({ node, children }) => {
              return <LinkPreview href={node?.properties?.href} text={children} />
            },
            li: ({ node, children, className }) => {
              const isTaskListItem = className?.includes('task-list-item');
              if (isTaskListItem && onChange && !isShareMode) {
                return (
                  <ListItem
                    content={content}
                    onChange={onChange}
                    className={className}
                  >
                    {children}
                  </ListItem>
                );
              }
              return <li className={className}>{children}</li>;
            },
            img: ImageWrapper,
            table: TableWrapper
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
});

export const StreamingCodeBlock = observer(({ markdown }: { markdown: string }) => {
  return (
    <ReactMarkdown components={{ code: Code }}>
      {markdown}
    </ReactMarkdown>
  );
});