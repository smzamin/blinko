import { Icon } from '@/components/Common/Iconify/icons';
import { _ } from '@/lib/lodash';
import { Note, NoteType } from '@/server/types';
import { RootStore } from '@/store';
import { BlinkoStore } from '@/store/blinkoStore';
import { Tooltip } from '@heroui/react';
import { useTranslation } from 'react-i18next';
import { BlinkoItem } from '.';
import { ConvertItemFunction } from '../BlinkoRightClickMenu';
import { CommentCount } from './commentButton';

interface CardFooterProps {
  blinkoItem: BlinkoItem;
  blinko: BlinkoStore;
  isShareMode?: boolean;
}

export const CardFooter = ({ blinkoItem, blinko, isShareMode }: CardFooterProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center">
      <ConvertTypeButton blinkoItem={blinkoItem} />
      <RightContent blinkoItem={blinkoItem} t={t} />
    </div>
  );
};

export const ConvertTypeButton = ({
  blinkoItem,
  tooltip,
  toolTipClassNames,
  tooltipPlacement,
}: {
  blinkoItem: BlinkoItem & any;
  tooltip?: React.ReactNode;
  toolTipClassNames?: any;
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
}) => {
  const { t } = useTranslation();
  const blinko = RootStore.Get(BlinkoStore);
  const handleClick = (e) => {
    e.stopPropagation();
    blinko.curSelectedNote = _.cloneDeep(blinkoItem);
    ConvertItemFunction();
  };

  if (blinkoItem.type === NoteType.BLINKO) {
    return (
      <Tooltip placement={tooltipPlacement} classNames={toolTipClassNames} content={tooltip ?? t('convert-to') + ' Note'} delay={1000}>
        <div className="flex items-center justify-start cursor-pointer" onClick={handleClick}>
          <Icon className="text-yellow-500" icon="basil:lightning-solid" width="12" height="12" />
          <div className="text-desc text-xs font-bold ml-1 select-none">
            {t('blinko')}
            {blinkoItem.isBlog ? ` · ${t('article')}` : ''}
            {blinkoItem.isArchived ? ` · ${t('archived')}` : ''}
            {blinkoItem.isOffline ? ` · ${t('offline')}` : ''}
          </div>
        </div>
      </Tooltip>
    );
  }

  return (
    <Tooltip content={t('convert-to') + ' Blinko'} delay={1000}>
      <div className="flex items-center justify-start cursor-pointer" onClick={handleClick}>
        <Icon className="text-blue-500" icon="solar:notes-minimalistic-bold-duotone" width="12" height="12" />
        <div className="text-desc text-xs font-bold ml-1 select-none">
          {t('note')}
          {blinkoItem.isBlog ? ` · ${t('article')}` : ''}
          {blinkoItem.isArchived ? ` · ${t('archived')}` : ''}
          {blinkoItem.isOffline ? ` · ${t('offline')}` : ''}
        </div>
      </div>
    </Tooltip>
  );
};

const RightContent = ({ blinkoItem, t }: { blinkoItem: Note; t: any }) => {
  return (
    <div className="ml-auto flex items-center gap-2">
      {<CommentCount blinkoItem={blinkoItem} />}
      {blinkoItem?.metadata?.isIndexed && (
        <Tooltip content={'Indexed'} delay={1000}>
          <Icon className="!text-ignore opacity-50" icon="mingcute:ai-line" width="16" height="16" />
        </Tooltip>
      )}
    </div>
  );
};
