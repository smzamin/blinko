import React, { useEffect, useState } from "react";
import TreeView, { flattenTree } from "react-accessible-treeview";
import { observer } from "mobx-react-lite";
import { RootStore } from "@/store";
import { BlinkoStore } from "@/store/blinkoStore";
import { Icon } from "@iconify/react";
import { SideBarItem } from "../Layout";
import { Popover, PopoverTrigger, PopoverContent, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useTheme } from "next-themes";
import { useRouter } from "next/router";
import { ToastPlugin } from "@/store/module/Toast/Toast";
import { ShowUpdateTagDialog } from "./UpdateTagPop";
import { api } from "@/lib/trpc";
import { PromiseCall } from "@/store/standard/PromiseState";

const EmojiPick = ({ children, element }) => {
  const { theme } = useTheme();
  const blinko = RootStore.Get(BlinkoStore);
  return <Popover placement="bottom" showArrow={true}>
    <PopoverTrigger>
      <div className="hover:bg-background transition-all rounded-md px-1">
        {children}
      </div>
    </PopoverTrigger>
    <PopoverContent>
      <EmojiPicker theme={theme == 'dark' ? Theme.DARK : Theme.LIGHT} onEmojiClick={async e => {
        PromiseCall(api.tags.updateTagIcon.mutate({ id: element.id, icon: e.emoji }))
      }} />
    </PopoverContent>
  </Popover>
}


export const TagListPanel = observer(() => {
  const blinko = RootStore.Get(BlinkoStore);
  const router = useRouter()
  const [showPopId, setPopId] = useState(0) //id
  // const [tagName, setTagName] = useState('')
  // const store = RootStore.Local(() => ({
  //   tagName: ''
  // }))
  useEffect(() => { }, [blinko.noteListFilterConfig.tagId])
  useEffect(() => {
    document.addEventListener('click', () => setPopId(0));
    return () => {
      document.removeEventListener('click', () => setPopId(0));
    }
  }, [])
  return (
    <>
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
            <div className={`${SideBarItem} mb-1 relative group ${(blinko.noteListFilterConfig.tagId == element.id && router.pathname == '/all') ? '!bg-primary !text-primary-foreground' : ''}`}
              onClick={e => {
                blinko.currentRouter = blinko.allTagRouter
                router.push('/all?tagId=' + element.id, undefined, { shallow: true })
              }}
            >
              {isBranch ? (
                <EmojiPick element={element}>
                  <div className="flex items-center justify-center">
                    <div className="group-hover:block hidden">
                      {isExpanded ?
                        <Icon icon="gravity-ui:caret-down" width="20" height="20" />
                        : <Icon icon="gravity-ui:caret-right" width="20" height="20" />
                      }
                    </div>
                    <div className="group-hover:hidden block">
                      {
                        element.metadata?.icon ? <div>{element.metadata?.icon}</div>
                          : <Icon icon="mdi:hashtag" width="20" height="20" />
                      }
                    </div>
                  </div>
                </EmojiPick>
              ) : (
                <EmojiPick element={element}>
                  <div> {
                    element.metadata?.icon ? element.metadata?.icon : <Icon icon="mdi:hashtag" width="20" height="20" />
                  } </div>
                </EmojiPick>
              )}

              <div className="truncate overflow-hidden whitespace-nowrap" title={element.name}>
                {element.name}
              </div>
              <Dropdown>
                <DropdownTrigger>
                  <Icon className="ml-auto group-hover:opacity-100 opacity-0 transition-all" icon="ri:more-fill" width="20" height="20" />
                </DropdownTrigger>
                <DropdownMenu aria-label="Static Actions">
                  <DropdownItem key="delete" onClick={async () => {
                    setPopId(element.id as number)
                    ShowUpdateTagDialog({
                      defaultValue: (element.metadata?.path! as string),
                      onSave: async (tagName) => {
                        await PromiseCall(api.tags.updateTagName.mutate({
                          id: element.id as number,
                          oldName: element.metadata?.path as string,
                          newName: tagName
                        }))
                        router.push('/all')
                        setPopId(0)
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
