import React, { useEffect, useState } from "react";
import TreeView, { flattenTree } from "react-accessible-treeview";
import { observer } from "mobx-react-lite";
import { RootStore } from "@/store";
import { BlinkoStore } from "@/store/blinkoStore";
import { Icon } from "@iconify/react";
import { SideBarItem } from "../Layout";
import { Popover, PopoverTrigger, PopoverContent, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import { useTheme } from "next-themes";
import { useRouter } from "next/router";
import { ToastPlugin } from "@/store/module/Toast/Toast";
import { ShowUpdateTagDialog } from "./UpdateTagPop";
import { api } from "@/lib/trpc";
import { PromiseCall } from "@/store/standard/PromiseState";
import { BaseStore } from "@/store/baseStore";
import { useTranslation } from "react-i18next";

const EmojiPick = ({ children, element }) => {
  const { theme } = useTheme();
  return <Popover placement="bottom" showArrow={true}>
    <PopoverTrigger>
      <div className="hover:translate-x-1 transition-all rounded-md px-1">
        {children}
      </div>
    </PopoverTrigger>
    <PopoverContent>
      <EmojiPicker emojiStyle={EmojiStyle.NATIVE} theme={theme == 'dark' ? Theme.DARK : Theme.LIGHT} onEmojiClick={async e => {
        PromiseCall(api.tags.updateTagIcon.mutate({ id: element.id, icon: e.emoji }))
      }} />
    </PopoverContent>
  </Popover>
}


export const TagListPanel = observer(() => {
  const blinko = RootStore.Get(BlinkoStore);
  const base = RootStore.Get(BaseStore);
  const {t} = useTranslation()
  const router = useRouter()
  const isSelected = (id) => {
    return blinko.noteListFilterConfig.tagId == id && router.pathname == '/all'
  }
  useEffect(() => { }, [blinko.noteListFilterConfig.tagId])
  return (
    <>
      <div className="ml-2 my-2 text-xs font-bold text-[#a252e1]">{t('total-tags')}</div>
      <TreeView
        data={flattenTree({
          name: "",
          children: blinko.tagList.value?.listTags,
        })}
        aria-label="directory tree"
        togglableSelect
        // selectedIds={[urpcStore.curSelectPath]}
        clickAction="EXCLUSIVE_SELECT"
        onNodeSelect={(e) => {
          // urpcStore.onRenderFunctionAndVar(
          //   e.element.metadata._path,
          //   e.element.metadata
          // );
        }}
        multiSelect={false}
        nodeRenderer={({
          element,
          isBranch,
          isExpanded,
          getNodeProps,
          level,
          handleSelect,
        }) => (
          <div {...getNodeProps()} style={{ paddingLeft: 20 * (level - 1) + 6 }} >
            <div className={`${SideBarItem} mb-1 relative group ${(isSelected(element.id)) ? '!bg-primary !text-primary-foreground' : ''}`}
              onClick={async e => {
                base.currentRouter = blinko.allTagRouter
                await router.push('/all?tagId=' + element.id, undefined, { shallow: true })
                blinko.forceQuery++
              }}
            >
              {isBranch ? (
                <EmojiPick element={element}>
                  <div className="flex items-center justify-center h-[24px]">
                    <div className="flex items-center justify-center group-hover:opacity-100 opacity-0 w-0 h-0 group-hover:w-[24px] group-hover:h-[24px] transition-all" >
                      {isExpanded ?
                        <Icon icon="gravity-ui:caret-down" className="hover:text-primary transition-all" width="20" height="20" />
                        : <Icon icon="gravity-ui:caret-right" className="hover:text-primary transition-all" width="20" height="20" />
                      }
                    </div>
                    <div className="group-hover:opacity-0 opacity-100 w-[24px] group-hover:w-0 transition-all">
                      {
                        element.metadata?.icon ? <div>{element.metadata?.icon}</div>
                          : <Icon icon="mdi:hashtag" width="20" height="20" />
                      }
                    </div>
                  </div>
                </EmojiPick>
              ) : (
                <EmojiPick element={element}>
                  <div>
                    {
                      element.metadata?.icon ? element.metadata?.icon : <Icon icon="mdi:hashtag" width="20" height="20" />
                    }
                  </div>
                </EmojiPick>
              )}

              <div className="truncate overflow-hidden whitespace-nowrap" title={element.name}>
                {element.name}
              </div>
              <Dropdown>
                <DropdownTrigger>
                  <Icon className="ml-auto group-hover:opacity-100 opacity-0 transition-all group-hover:translate-x-0 translate-x-2" icon="ri:more-fill" width="20" height="20" />
                </DropdownTrigger>
                <DropdownMenu aria-label="Static Actions">
                  <DropdownItem key="delete" onClick={async () => {
                    ShowUpdateTagDialog({
                      defaultValue: (element.metadata?.path! as string),
                      onSave: async (tagName) => {
                        await PromiseCall(api.tags.updateTagName.mutate({
                          id: element.id as number,
                          oldName: element.metadata?.path as string,
                          newName: tagName
                        }))
                        router.push('/all')
                      }
                    })
                  }}>
                    Update name
                  </DropdownItem>
                  <DropdownItem key="delete" className="text-danger" color="danger" onClick={async () => {
                    PromiseCall(api.tags.deleteOnlyTag.mutate(({ id: element.id as number })))
                  }}>
                    Delete only tag
                  </DropdownItem>
                  <DropdownItem key="delete" className="text-danger" color="danger" onClick={async () => {
                    PromiseCall(api.tags.deleteTagWithAllNote.mutate(({ id: element.id as number })))
                  }}>
                    Delete tag with note
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div >
        )}
      />
    </>
  );
});
