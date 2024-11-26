import { Image } from '@nextui-org/react';
import { Note } from '@/server/types';

interface BlogContentProps {
  blinkoItem: Note & {
    isBlog?: boolean;
    blogCover?: string;
    title?: string;
  };
  isExpanded?: boolean;
}

export const BlogContent = ({ blinkoItem, isExpanded }: BlogContentProps) => {
  return (
    <div className={`flex items-center justify-between gap-2 w-full ${isExpanded ? 'mb-4' : 'mb-1'}`}>
      {blinkoItem.blogCover && (
        <Image 
          src={blinkoItem.blogCover} 
          alt='blog cover' 
          className={`object-cover aspect-square rounded-lg w-fit max-w-[100px] max-h-[100px]`}
        />
      )}
      <div className='flex-1 flex flex-col min-w-[70%] pr-2'>
        <div className={`font-bold line-clamp-1 ${isExpanded ? 'text-xl' : 'text-lg'}`}>
          {blinkoItem.title?.replace(/#/g, '').replace(/\*/g, '')}
        </div>
        <div className={`text-desc line-clamp-5 flex-1 ${isExpanded ? 'text-sm' : 'text-xs'}`}>
          {blinkoItem.content?.replace(blinkoItem.title ?? '', '').replace(/#/g, '').replace(/\*/g, '')}
        </div>
      </div>
    </div>
  );
};