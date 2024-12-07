import React from "react";
import { ScrollShadow, Image } from "@nextui-org/react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { TagListPanel } from "../Common/TagListPanel";
import { SideBarItem } from "./index";
import { RootStore } from "@/store";
import { BaseStore } from "@/store/baseStore";
import { BlinkoStore } from "@/store/blinkoStore";

interface SidebarProps {
  onItemClick?: () => void;
}

export const Sidebar = observer(({ onItemClick }: SidebarProps) => {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const base = RootStore.Get(BaseStore);
  const blinkoStore = RootStore.Get(BlinkoStore);

  return (
    <div className="flex h-full w-[288px] flex-1 flex-col p-4 relative bg-background">
      <div className="flex items-center gap-2 px-2 select-none w-full">
        {theme == 'dark' ? (
          <Image src="/logo-dark.svg" width={100} />
        ) : (
          <Image src="/logo.svg" width={100} />
        )}
      </div>
      <ScrollShadow className="-mr-[16px] mt-[-5px] h-full max-h-full pr-6">
        <div>
          <div className="flex flex-col gap-1 mt-4 font-semibold">
            {base.routerList.map(i => (
              <Link
                key={i.title}
                shallow={i.shallow}
                href={i.href}
                onClick={() => {
                  base.currentRouter = i;
                  onItemClick?.();
                }}
              >
                <div
                  className={`group ${SideBarItem} ${
                    i?.href == router.pathname ? '!bg-primary !text-primary-foreground' : ''
                  }`}
                >
                  <Icon
                    className="group-hover:translate-x-1 transition-all"
                    icon={i.icon}
                    width="20"
                    height="20"
                  />
                  <div className="group-hover:translate-x-1 transition-all">
                    {t(i.title)}
                  </div>
                </div>
              </Link>
            ))}
            <div>
              {blinkoStore.tagList.value?.listTags.length != 0 &&
                blinkoStore.tagList.value?.listTags && (
                  <TagListPanel />
                )}
            </div>
          </div>
        </div>
      </ScrollShadow>
      <div className="halation absolute inset-0 h-[250px] w-[250px] overflow-hidden blur-3xl z-[0] pointer-events-none">
        <div
          className="w-full h-[100%] bg-[#ffc65c] opacity-20"
          style={{ clipPath: "circle(35% at 50% 50%)" }}
        />
      </div>
    </div>
  );
}); 