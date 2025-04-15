import { Icon } from '@/components/Common/Iconify/icons';
import i18n from '@/lib/i18n';
import { api } from '@/lib/trpc';
import { AiStore } from '@/store/aiStore';
import { DialogStore } from '@/store/module/Dialog';
import { RootStore } from '@/store/root';
import { PromiseCall } from '@/store/standard/PromiseState';
import { Textarea } from '@heroui/react';
import { motion } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'usehooks-ts';
import { AiSetting } from '../BlinkoSettings/AiSetting';
import { BlinkoSelectNote } from '../Common/BlinkoSelectNote';
import { IconButton } from '../Common/Editor/Toolbar/IconButton';
import { ScrollArea } from '../Common/ScrollArea';
import { AiConversactionList } from './aiConversactionList';

interface AiInputProps {
  mode?: 'card' | 'inline';
  onSubmit?: (value: string) => void;
  className?: string;
}

const cardIcons = [
  {
    tooltip: <>{i18n.t('new-conversation')}</>,
    icon: 'hugeicons:bubble-chat-add',
    size: 20,
    containerSize: 30,
    onClick: () => {
      RootStore.Get(AiStore).newChat();
    },
  },
  {
    tooltip: <>{i18n.t('knowledge-base-search')}</>,
    icon: 'hugeicons:search-list-01',
    size: 20,
    containerSize: 30,
    onClick: () => {
      RootStore.Get(AiStore).withRAG.save(!RootStore.Get(AiStore).withRAG.value);
    },
    classNames: () => {
      return RootStore.Get(AiStore).withRAG.value
        ? {
            base: 'bg-primary hover:opacity-80 hover:bg-primary ',
            icon: 'text-primary-foreground font-bold',
          }
        : {
            base: 'bg-transparent text-foreground',
            icon: 'text-foreground',
          };
    },
  },
  {
    tooltip: <>{i18n.t('online-search')}</>,
    icon: 'hugeicons:global-search',
    size: 20,
    containerSize: 30,
    onClick: () => {
      RootStore.Get(AiStore).withOnline.save(!RootStore.Get(AiStore).withOnline.value);
    },
    classNames: () => {
      return RootStore.Get(AiStore).withOnline.value
        ? {
            base: 'bg-primary hover:opacity-80 hover:bg-primary ',
            icon: 'text-primary-foreground font-bold',
          }
        : {
            base: 'bg-transparent text-foreground',
            icon: 'text-foreground',
          };
    },
  },
  {
    tooltip: <div className="w-[200px]">{i18n.t('add-tools-to-model')}</div>,
    icon: 'hugeicons:ai-chemistry-02',
    size: 20,
    containerSize: 30,
    onClick: () => {
      RootStore.Get(AiStore).withTools.save(!RootStore.Get(AiStore).withTools.value);
    },
    classNames: () => {
      return RootStore.Get(AiStore).withTools.value
        ? {
            base: 'bg-primary hover:opacity-80 hover:bg-primary ',
            icon: 'text-primary-foreground font-bold',
          }
        : {
            base: 'bg-transparent text-foreground',
            icon: 'text-foreground',
          };
    },
  },
  {
    tooltip: <>{i18n.t('clear-current-content')}</>,
    icon: 'hugeicons:delete-01',
    size: 20,
    containerSize: 30,
    isHidden: () => {
      return !RootStore.Get(AiStore).isChatting;
    },
    onClick: async () => {
      const aiStore = RootStore.Get(AiStore);
      await PromiseCall(api.conversation.clearMessages.mutate({ id: aiStore.currentConversationId }));
      await aiStore.currentConversation.call();
    },
  },
];

export const AiInput = observer(({ onSubmit, className }: AiInputProps) => {
  const isPc = useMediaQuery('(min-width: 768px)');
  const aiStore = RootStore.Get(AiStore);
  let mode = aiStore.isChatting ? 'inline' : 'card';
  const { t } = useTranslation();
  return (
    <motion.div
      className={`w-full p-2 rounded-3xl bg-background ${className}`}
      animate={{
        width: mode === 'inline' ? (isPc ? '85%' : '100%') : isPc ? '60%' : '100%',
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className="relative flex items-end gap-2">
        <Textarea
          className={`mt-4 mb-10`}
          data-focus-visible="false"
          autoFocus
          value={aiStore.input}
          onKeyDown={(e) => {
            // Handle Enter key press to submit input, but ignore if user is composing text (e.g. using IME)
            const isComposing = Boolean(e.isComposing || (e.nativeEvent && e.nativeEvent.isComposing));

            if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
              e.preventDefault();
              aiStore.onInputSubmit();
            }
          }}
          onChange={(e) => (aiStore.input = e.target.value)}
          classNames={{
            input: `!bg-transparent border-none ${mode == 'inline' ? 'min-h-[20px]' : 'min-h-[120px]'} whitespace-pre-wrap`,
            label: '!bg-transparent border-none',
            inputWrapper: '!bg-transparent border-none !shadow-none',
          }}
          rows={mode == 'inline' ? 1 : 20}
          maxRows={40}
          placeholder={t('search-blinko-content-or-help-create')}
        />
        <div className="absolute bottom-3 right-0 w-full px-2 gap-1 flex justify-center items-center transition-all">
          <>
            {cardIcons.map(
              (icon, index) =>
                !icon.isHidden?.() && (
                  <IconButton onClick={icon.onClick} tooltip={icon.tooltip} icon={icon.icon} size={icon.size} containerSize={icon.containerSize} classNames={icon.classNames?.()} />
                ),
            )}
          </>

          <BlinkoSelectNote
            onSelect={(item) => {
              if (aiStore.referencesNotes?.includes(item.id)) return;
              aiStore.referencesNotes.push(item);
              aiStore.input = aiStore.input += `${item.content}`;
            }}
            iconButton={<IconButton tooltip={'@'} icon="hugeicons:at" size={20} containerSize={30} />}
            blackList={aiStore.referencesNotes.map((i) => i.id ?? 0)}
          />

          <div className="ml-auto"></div>

          <IconButton
            onClick={async () => {
              RootStore.Get(DialogStore).setData({
                isOpen: true,
                size: '2xl',
                onlyContent: true,
                title: t('settings'),
                content: (
                  <ScrollArea className="h-full md:h-[600px]" onBottom={() => {}}>
                    <AiSetting />
                  </ScrollArea>
                ),
              });
            }}
            tooltip={t('settings')}
            icon="hugeicons:settings-03"
            size={20}
            containerSize={30}
          />

          <IconButton
            onClick={async () => {
              RootStore.Get(DialogStore).setData({
                isOpen: true,
                title: t('conversation-history'),
                content: <AiConversactionList />,
              });
            }}
            tooltip={t('conversation-history')}
            icon="hugeicons:book-edit"
            size={20}
            containerSize={30}
          />

          <div className="text-ignore opacity-50 w-[2px] h-[20px] bg-desc rounded-full"></div>

          <div
            className={`ml-2 bg-primary rounded-full p-1 group  ${aiStore.input.trim() == '' && !aiStore.isAnswering ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => {
              if (aiStore.isAnswering) {
                return aiStore.abortAiChat();
              }
              if (aiStore.input.trim() == '') {
                return;
              } else {
                aiStore.onInputSubmit();
              }
            }}
          >
            {aiStore.isAnswering ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: 'linear',
                }}
              >
                <Icon icon="uil:spinner-alt" width="24" height="24" className="text-primary-foreground group-hover:translate-y-[-1px] transition-all" />
              </motion.div>
            ) : (
              <Icon icon="uil:arrow-up" width="24" height="24" className="text-primary-foreground group-hover:translate-y-[-1px] transition-all" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
