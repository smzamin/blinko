import { Icon } from '@iconify/react';
import { Tooltip } from '@nextui-org/react';
import { Note, NoteType } from '@/server/types';
import { ConvertItemFunction } from "../BlinkoRightClickMenu";
import { BlinkoStore } from '@/store/blinkoStore';
import { useTranslation } from 'react-i18next';
import dayjs from '@/lib/dayjs';
import { _ } from '@/lib/lodash';

interface CardFooterProps {
  blinkoItem: Note & {
    isBlog?: boolean;
    blogCover?: string;
    title?: string;
  };
  blinko: BlinkoStore;
}

export const CardFooter = ({ blinkoItem, blinko }: CardFooterProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center mt-2">
      <ConvertTypeButton blinkoItem={blinkoItem} blinko={blinko} t={t} />
      <CreatedTimeInfo blinkoItem={blinkoItem} t={t} />
    </div>
  );
};

const ConvertTypeButton = ({ blinkoItem, blinko, t }) => {
  const handleClick = (e) => {
    e.stopPropagation();
    blinko.curSelectedNote = _.cloneDeep(blinkoItem);
    ConvertItemFunction();
  };

  if (blinkoItem.type === NoteType.BLINKO) {
    return (
      <Tooltip content={t('convert-to') + ' Note'} delay={1000}>
        <div className='flex items-center justify-start cursor-pointer' onClick={handleClick}>
          <Icon className='text-yellow-500' icon="basil:lightning-solid" width="12" height="12" />
          <div className='text-desc text-xs font-bold ml-1 select-none'>{t('blinko')} {blinkoItem.isBlog ? ` · ${t('article')}` : ''} {blinkoItem.isArchived ? ` · ${t('archived')}` : ''}</div>
        </div>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={t('convert-to') + ' Blinko'} delay={1000}>
      <div className='flex items-center justify-start cursor-pointer' onClick={handleClick}>
        <Icon className='text-blue-500' icon="solar:notes-minimalistic-bold-duotone" width="12" height="12" />
        <div className='text-desc text-xs font-bold ml-1 select-none'>{t('note')} {blinkoItem.isBlog ? ` · ${t('article')}` : ''} {blinkoItem.isArchived ? ` · ${t('archived')}` : ''}</div>
      </div>
    </Tooltip>
  );
};

const CreatedTimeInfo = ({ blinkoItem, t }) => {
  if (!blinkoItem?.metadata?.isIndexed) {
    return null;
  }
  return (
    <div className='ml-auto flex items-center'>
      <Tooltip content={"Indexed"} delay={1000}>
        <Icon className='text-ignore opacity-50' icon="mingcute:ai-line" width="16" height="16" />
      </Tooltip>
    </div>
  );
};
