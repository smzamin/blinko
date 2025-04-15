import { api } from '@/lib/trpc';
import { RootStore } from '@/store';
import { DialogStandaloneStore } from '@/store/module/DialogStandalone';
import { ToastPlugin } from '@/store/module/Toast/Toast';
import { ResourceStore } from "@/store/resourceStore";
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { MultiSelectToolbar } from '../Common/MultiSelectToolbar';
import { showTipsDialog } from '../Common/TipsDialog';

export const ResourceMultiSelectPop = observer(() => {
  const { t } = useTranslation();
  const resourceStore = RootStore.Get(ResourceStore);

  const actions = [
    {
      icon: "mingcute:delete-2-line",
      text: t('delete'),
      isDeleteButton: true,
      onClick: () => {
        showTipsDialog({
          title: t('confirm-to-delete'),
          content: t('this-operation-will-delete-the-selected-files-and-cannot-be-restored-please-confirm'),
          onConfirm: async () => {
            const selectedIds = Array.from(resourceStore.selectedItems);
            if (selectedIds.length === 0) return;

            await RootStore.Get(ToastPlugin).promise(
              api.attachments.deleteMany.mutate({ ids: selectedIds }),
              {
                loading: t('in-progress'),
                success: <b>{t('your-changes-have-been-saved')}</b>,
                error: <b>{t('operation-failed')}</b>,
              }
            );
            resourceStore.clearSelection();
            resourceStore.loadResources(resourceStore.currentFolder || undefined);
            RootStore.Get(DialogStandaloneStore).close();
          }
        });
      }
    }
  ];

  return (
    <MultiSelectToolbar
      show={resourceStore.selectedItems.size > 0}
      actions={actions}
      onClose={() => resourceStore.clearSelection()}
    />
  );
});
