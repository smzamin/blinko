import { Icon } from '@/components/Common/Iconify/icons';
import { RootStore } from '@/store';
import { DialogStore } from '@/store/module/Dialog';
import { Tooltip } from '@heroui/react';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import NoteHistoryModal from './NoteHistoryModal';

interface HistoryButtonProps {
  noteId: number;
  className?: string;
}

export const HistoryButton = observer(({ noteId, className = '' }: HistoryButtonProps) => {
  const { t } = useTranslation();

  const handleOpenHistory = (e) => {
    e.stopPropagation();
    RootStore.Get(DialogStore).setData({
      isOpen: true,
      size: '2xl',
      title: t('Note History'),
      content: <NoteHistoryModal noteId={noteId} />,
    });
  };

  return (
    <Tooltip content={t('View History Versions')}>
      <div className="flex items-center gap-2">
        <Icon className={className} onClick={handleOpenHistory} icon="lucide:history" width="16" height="16" />
      </div>
    </Tooltip>
  );
});

export default HistoryButton;
