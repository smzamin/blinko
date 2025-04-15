import { api } from '@/lib/trpc';
import { RootStore } from '@/store';
import { BlinkoStore } from '@/store/blinkoStore';
import { DialogStandaloneStore } from '@/store/module/DialogStandalone';
import { ToastPlugin } from '@/store/module/Toast/Toast';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { MultiSelectToolbar } from '../Common/MultiSelectToolbar';
import { showTipsDialog } from '../Common/TipsDialog';
import { ShowUpdateTagDialog } from '../Common/UpdateTagPop';

export const BlinkoMultiSelectPop = observer(() => {
  const { t } = useTranslation();
  const blinko = RootStore.Get(BlinkoStore);
  const isArchivedView = blinko.noteListFilterConfig.isArchived;

  const actions = [
    {
      icon: isArchivedView ? "eva:archive-outline" : "eva:archive-outline",
      text: isArchivedView ? t('recovery') : t('archive'),
      onClick: async () => {
        await RootStore.Get(ToastPlugin).promise(
          api.notes.updateMany.mutate({ ids: blinko.curMultiSelectIds, isArchived: !isArchivedView }),
          {
            loading: t('in-progress'),
            success: <b>{t('your-changes-have-been-saved')}</b>,
            error: <b>{t('operation-failed')}</b>,
          });
        blinko.onMultiSelectRest();
      }
    },
    {
      icon: "solar:tag-outline",
      text: t('add-tag'),
      onClick: () => {
        ShowUpdateTagDialog({
          type: 'select',
          onSave: async (tagName) => {
            await RootStore.Get(ToastPlugin).promise(
              api.tags.updateTagMany.mutate({ tag: tagName, ids: blinko.curMultiSelectIds }),
              {
                loading: t('in-progress'),
                success: <b>{t('your-changes-have-been-saved')}</b>,
                error: <b>{t('operation-failed')}</b>,
              });
            blinko.onMultiSelectRest();
          }
        });
      }
    },
    {
      icon: "mingcute:delete-2-line",
      text: t('delete'),
      isDeleteButton: true,
      onClick: () => {
        showTipsDialog({
          title: t('confirm-to-delete'),
          content: t('this-operation-removes-the-associated-label-and-cannot-be-restored-please-confirm'),
          onConfirm: async () => {
            await RootStore.Get(ToastPlugin).promise(
              api.notes.deleteMany.mutate({ ids: blinko.curMultiSelectIds }),
              {
                loading: t('in-progress'),
                success: <b>{t('your-changes-have-been-saved')}</b>,
                error: <b>{t('operation-failed')}</b>,
              });
            blinko.curMultiSelectIds.map(i => api?.['ai'].embeddingDelete.mutate({ id: i }));
            blinko.onMultiSelectRest();
            RootStore.Get(DialogStandaloneStore).close();
          }
        });
      }
    }
  ];

  return (
    <MultiSelectToolbar
      show={blinko.isMultiSelectMode}
      actions={actions}
      onClose={() => blinko.onMultiSelectRest()}
    />
  );
});