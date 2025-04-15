import { ResourceItemPreview } from '@/components/BlinkoResource/ResourceItem';
import { Icon } from '@/components/Common/Iconify/icons';
import { helper } from '@/lib/helper';
import { _ } from '@/lib/lodash';
import { cn } from '@/lib/utils';
import { allSettings } from '@/pages/settings';
import { Note, ResourceType, Tag } from '@/server/types';
import { RootStore } from '@/store';
import { AiStore } from '@/store/aiStore';
import { BlinkoStore } from '@/store/blinkoStore';
import { Button, Divider, Input, Modal, ModalBody, ModalContent } from '@heroui/react';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/router';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'usehooks-ts';
import { BlinkoCard } from '../BlinkoCard';
import { ConvertTypeButton } from '../BlinkoCard/cardFooter';
import { LoadingAndEmpty } from '../Common/LoadingAndEmpty';
import { ScrollArea } from '../Common/ScrollArea';

interface GlobalSearchProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GlobalSearch = observer(({ isOpen, onOpenChange }: GlobalSearchProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const blinkoStore = RootStore.Get(BlinkoStore);
  const aiStore = RootStore.Get(AiStore);
  const isPc = useMediaQuery('(min-width: 768px)');

  // Move all state management to RootStore.Local
  const store = RootStore.Local(() => ({
    searchQuery: '',
    isAiQuestion: false,
    isTagSearch: false,
    isSearching: false,
    searchResults: {
      notes: [] as Note[],
      resources: [] as ResourceType[],
      settings: [] as any[],
      tags: [] as Tag[],
    },

    // Methods
    setSearchQuery(value: string) {
      this.searchQuery = value;

      // Auto-detect @AI syntax
      if (value.startsWith('@') && !this.isAiQuestion) {
        this.isAiQuestion = true;
        this.isTagSearch = false;
      } else if (value.startsWith('#') && !this.isTagSearch) {
        this.isTagSearch = true;
        this.isAiQuestion = false;
      } else if (!value.startsWith('@') && !value.startsWith('#')) {
        this.isAiQuestion = false;
        this.isTagSearch = false;
      }

      // Trigger search with loading state
      if (value) {
        this.isSearching = true;
        if (this.isTagSearch) {
          // Perform local tag search without debounce
          this.performTagSearch(value.substring(1));
        } else {
          debouncedSearch.current(value);
        }
      } else if (!value) {
        this.searchResults = { notes: [], resources: [], settings: [], tags: [] };
        // Reset blinkoStore search text and reset list calls
        blinkoStore.searchText = '';
        blinkoStore.globalSearchTerm = '';
        blinkoStore.noteList.resetAndCall({ page: 1, size: 20 });
        blinkoStore.resourceList.resetAndCall({
          page: 1,
          size: 20,
          searchText: '',
          folder: undefined,
        });
        blinkoStore.updateTicker++
      }
    },

    performTagSearch(query: string) {
      // Filter tags from the blinkoStore.tagList
      const matchingTags = blinkoStore.tagList.value?.listTags
        .filter(tag => tag.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10); // Limit to top 10 results

      this.searchResults = {
        notes: [],
        resources: [],
        settings: [],
        tags: matchingTags
      };
      this.isSearching = false;
    },

    toggleAiQuestion() {
      this.isAiQuestion = !this.isAiQuestion;
      this.isTagSearch = false;
      this.searchQuery = this.isAiQuestion ? '@' + this.searchQuery.replace('#', '') : this.searchQuery.replace('@', '');
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    },

    toggleTagSearch() {
      this.isTagSearch = !this.isTagSearch;
      this.isAiQuestion = false;
      this.searchQuery = this.isTagSearch ? '#' + this.searchQuery.replace('@', '') : this.searchQuery.replace('#', '');
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    },

    // Computed properties
    get hasResults() {
      return (
        this.searchResults.notes.length > 0 ||
        this.searchResults.resources.length > 0 ||
        this.searchResults.settings.length > 0 ||
        this.searchResults.tags.length > 0
      );
    },
  }));

  // Reset search query when the modal opens
  useEffect(() => {
    if (isOpen) {
      store.searchQuery = blinkoStore.searchText || '';
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  }, [isOpen, blinkoStore.searchText]);

  useEffect(() => {
    blinkoStore.noteListFilterConfig.isUseAiQuery = store.isAiQuestion;
  }, [store.isAiQuestion]);

  // Create debounced search function - properly update search results after typing stops
  const debouncedSearch = useRef(
    _.debounce(async (query) => {
      if (!query) {
        store.searchResults = { notes: [], resources: [], settings: [], tags: [] };
        store.isSearching = false;
        return;
      }

      // 1. Store the search query in the store
      blinkoStore.searchText = query;
      blinkoStore.globalSearchTerm = query;

      try {
        // 2. Search for notes using the API
        // Set search text in the store and call the API through the store
        blinkoStore.searchText = query;
        const notes = await blinkoStore.noteList.resetAndCall({ page: 1, size: 20 });

        // 3. Search for resources using the API
        const resources = await blinkoStore.resourceList.resetAndCall({
          page: 1,
          size: 20,
          searchText: query,
          folder: undefined,
        });

        // 4. Search settings using the imported allSettings array
        // Filter settings that match the search query
        const matchingSettings = allSettings
          .filter((setting) => setting.title.toLowerCase().includes(query.toLowerCase()) || setting.keywords?.some((kw) => kw.toLowerCase().includes(query.toLowerCase())))
          .filter((setting) => setting.key !== 'all')
          .slice(0, 5);

        // 5. Update search results
        store.searchResults = {
          notes: notes || [],
          resources: resources || [],
          settings: matchingSettings,
          tags: [],
        };
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        store.isSearching = false;
      }
    }, 300),
  );

  // Key handling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (store.isAiQuestion) {
        handleAiQuestion();
      } else if (store.isTagSearch && store.searchResults.tags.length > 0) {
        navigateToTag(store.searchResults.tags?.[0]?.name || '');
      } else if (store.searchQuery) {
        // Navigate to the first result
        if (store.searchResults.notes.length > 0) {
          navigateToNote(store.searchResults.notes?.[0] as any);
        } else if (store.searchResults.resources.length > 0) {
          navigateToResource(store.searchResults.resources?.[0] as any);
        } else if (store.searchResults.settings.length > 0) {
          navigateToSetting(store.searchResults.settings?.[0].key);
        }
      }
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  // Navigation methods
  const navigateToNote = (note: Note) => {
    router.push(`/detail?id=${note.id}`);
    onOpenChange(false);
  };

  const navigateToResource = (resource: ResourceType) => {
    //download
    helper.download.downloadByLink(resource.path);
    onOpenChange(false);
  };

  const navigateToSetting = (settingKey: string) => {
    router.push(`/settings?section=${settingKey}`);
    onOpenChange(false);
  };

  const handleAiQuestion = () => {
    if (!store.searchQuery) return;

    // Prepare the AI prompt
    const aiPrompt = store.searchQuery.startsWith('@') ? store.searchQuery.substring(1).trim() : store.searchQuery;

    // Start a new AI chat with the question
    aiStore.newChatWithSuggestion(aiPrompt);
    router.push('/ai');
    onOpenChange(false);
  };

  // Add a new navigation method for tags
  const navigateToTag = (tagName: string) => {
    router.push(`/?path=all&searchText=%23${encodeURIComponent(tagName)}`);
    onOpenChange(false);
  };

  // Render search result items
  const renderNoteItem = (note: Note) => (
    <div key={note.id} className="flex gap-2 items-center p-2 hover:bg-default-100 rounded-md cursor-pointer transition-colors" onClick={() => navigateToNote(note)}>
      <div className="text-xs truncate w-full md:w-[80%]">{note?.content?.substring(0, 60) || t('no-content')}</div>
      <div className="ml-auto hidden md:block">
        <ConvertTypeButton
          blinkoItem={note}
          tooltipPlacement="right"
          toolTipClassNames={{
            base: '!bg-none p-0 rounded-full',
            content: '!bg-none p-0 rounded-full',
          }}
          tooltip={
            <div className="max-w-[400px] p-0">
              <BlinkoCard blinkoItem={note} />
            </div>
          }
        />
      </div>
    </div>
  );

  const renderResourceItem = (resource: ResourceType) => (
    <div key={resource.id} className="hover:bg-default-100 rounded-md cursor-pointer transition-colors" onClick={() => navigateToResource(resource)}>
      <ResourceItemPreview item={resource} onClick={() => navigateToResource(resource)} showExtraInfo={true} showAssociationIcon={true} className="hover:bg-transparent" />
    </div>
  );

  const renderSettingItem = (setting: any) => (
    <div key={setting.key} className="flex gap-2 items-center p-2 hover:bg-default-100 rounded-md cursor-pointer transition-colors" onClick={() => navigateToSetting(setting.key)}>
      <div className="p-2 rounded-md bg-warning-50">
        <Icon icon={setting.icon} className="text-warning" />
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="font-medium text-sm truncate">{t(setting.title)}</div>
        <div className="text-xs text-default-500 truncate">{t('settings')}</div>
      </div>
    </div>
  );

  // Render tag item
  const renderTagItem = (tag: Tag) => (
    <div key={tag.id} className="flex gap-2 items-center p-2 hover:bg-default-100 rounded-md cursor-pointer transition-colors" onClick={() => navigateToTag(tag.name)}>
      <div className="text-xs flex items-center gap-2">
        <span className="text-primary">#{tag.name}</span>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="top"
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', bounce: 0.5, duration: 0.6, },
          },
          exit: {
            y: -20,
            opacity: 0,
            transition: { type: 'spring', bounce: 0.5, duration: 0.3, },
          },
        }
      }}
      classNames={{
        base: 'max-w-2xl mx-auto mt-10',
      }}
    >
      <ModalContent>
        <ModalBody className="py-4">
          <div className="flex flex-col gap-3">
            {/* Search Input */}
            <Input
              ref={searchInputRef}
              aria-label="global-search"
              className={cn("mt-4", {
                'input-highlight': store.isAiQuestion,
                'input-tag-highlight': store.isTagSearch
              })}
              placeholder={t('search-or-ask-ai')}
              value={store.searchQuery}
              onChange={(e) => {
                const value = e.target.value;
                store.setSearchQuery(value);
              }}
              autoFocus
              onKeyDown={handleKeyDown}
              startContent={
                <Icon
                  className=""
                  icon={
                    store.isAiQuestion
                      ? 'mingcute:ai-line'
                      : store.isTagSearch
                        ? 'mingcute:hashtag-line'
                        : 'lets-icons:search'
                  }
                  width="24"
                  height="24"
                />
              }
              endContent={
                <div className="flex items-center gap-1">
                  {store.searchQuery && (
                    <Button
                      isIconOnly
                      variant="light"
                      size="sm"
                      onPress={() => store.setSearchQuery('')}
                      className="hover:text-danger transition-colors"
                    >
                      <Icon icon="ph:x-bold" width="16" height="16" />
                    </Button>
                  )}
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={() => store.toggleAiQuestion()}
                    className={cn('hover:text-primary transition-colors', store.isAiQuestion && 'text-primary')}
                  >
                    <Icon icon={store.isAiQuestion ? 'lets-icons:search' : 'mingcute:ai-line'} width="20" height="20" />
                  </Button>
                </div>
              }
            />

            {/* Search Results */}
            {store.searchQuery && (
              <div className="mt-2">
                <LoadingAndEmpty isLoading={store.isSearching} isEmpty={!store.hasResults} />
                <ScrollArea className="max-h-[600px] md:max-h-[400px]" onBottom={() => {}}>
                  <div className="flex flex-col gap-3 px-1">
                    {/* Tag section - only shown when in tag search mode */}
                    {store.isTagSearch && store.searchResults.tags.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-col">{store.searchResults.tags.map(renderTagItem)}</div>
                      </div>
                    )}

                    {/* Actions section - only show if not in tag search mode */}
                    {!store.isTagSearch && (
                      <div className="flex flex-col gap-1 mb-2">
                        <div className="flex items-center">
                          <Icon icon="mingcute:lightning-line" className="mr-2 text-primary" />
                          <h3 className="text-sm font-medium text-default-700">{t('action')}</h3>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex gap-2 items-center p-2 hover:bg-default-100 rounded-md cursor-pointer transition-colors" onClick={() => handleAiQuestion()}>
                            <div className="p-2 rounded-md bg-primary-50">
                              <Icon icon="mingcute:ai-line" className="text-primary" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <div className="font-medium text-sm truncate">
                                {t('ask-ai')} "{store.searchQuery}"
                              </div>
                              <div className="text-xs text-default-500 truncate">{t('ask-blinko-ai-about-this-query')}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes section - only show if not in tag search mode */}
                    {!store.isTagSearch && store.searchResults.notes.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Icon icon="mingcute:document-line" className="mr-2 text-primary" />
                            <h3 className="text-sm font-medium text-default-700">{t('note')}</h3>
                          </div>
                        </div>
                        <div className="flex flex-col">{store.searchResults.notes.map(renderNoteItem)}</div>
                      </div>
                    )}

                    {/* Resources section - only show if not in tag search mode */}
                    {!store.isTagSearch && store.searchResults.resources.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <Divider className="my-2" />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Icon icon="mingcute:folder-line" className="mr-2 text-success" />
                            <h3 className="text-sm font-medium text-default-700">{t('resources')}</h3>
                          </div>
                        </div>
                        <div className="flex flex-col">{store.searchResults.resources.map(renderResourceItem)}</div>
                      </div>
                    )}

                    {/* Settings section - only show if not in tag search mode */}
                    {!store.isTagSearch && store.searchResults.settings.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <Divider className="my-2" />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Icon icon="tabler:settings" className="mr-2 text-warning" />
                            <h3 className="text-sm font-medium text-default-700">{t('settings')}</h3>
                          </div>
                        </div>
                        <div className="flex flex-col">{store.searchResults.settings.map(renderSettingItem)}</div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="text-xs text-default-500 flex justify-between items-center">
              <div>
                {store.isAiQuestion ? (
                  t('to-ask-ai')
                ) : store.isTagSearch ? (
                  t('to-search-tags')
                ) : (
                  <>
                    {t('press-enter-to-select-first-result')} • <span className="text-primary">@</span> {t('to-ask-ai')} • <span className="text-primary">#</span> {t('to-search-tags')}
                  </>
                )}
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-default-100 rounded text-default-600 text-xs">Ctrl</kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-default-100 rounded text-default-600 text-xs">K</kbd>
              </div>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
});
