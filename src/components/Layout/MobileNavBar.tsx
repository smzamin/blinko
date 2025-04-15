import { Icon } from '@/components/Common/Iconify/icons';
import { useSwiper } from "@/lib/hooks";
import { RootStore } from "@/store";
import { BaseStore } from "@/store/baseStore";
import { BlinkoStore } from "@/store/blinkoStore";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { SideBarItem } from "./index";

interface MobileNavBarProps {
  onItemClick?: () => void;
}

export const MobileNavBar = observer(({ onItemClick }: MobileNavBarProps) => {
  const router = useRouter();
  const base = RootStore.Get(BaseStore);
  const { t } = useTranslation();
  const blinkoStore = RootStore.Get(BlinkoStore);
  const isVisible = useSwiper();
  if (blinkoStore.config.value?.isHiddenMobileBar) {
    return null;
  }

  // Get all visible items for mobile, including those that might be hidden in sidebar
  // Make sure to include items even if they have hiddenSidebar=true but hiddenMobile=false
  const mobileItems = base.routerList.filter(i => !i.hiddenMobile);

  return (
    <motion.div
      className="h-[70px] flex w-full px-4 py-2 gap-2 bg-background block md:hidden overflow-hidden fixed bottom-0 z-50"
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{
        type: "tween",
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1]
      }}
    >
      {mobileItems.map(i => (
        <Link
          className="flex-1"
          key={i.title}
          href={i.href}
          shallow={i.shallow}
          onClick={() => {
            base.currentRouter = i;
            onItemClick?.();
          }}
        >
          <div
            className={`flex flex-col group ${SideBarItem} ${base.isSideBarActive(router, i) ? '!text-foreground' : '!text-desc'
              }`}
          >
            <Icon className={`text-center`} icon={i.icon} width="20" height="20" />
            <div className="text-center text-[10px] mt-[-4px]">{t(i.title)}</div>
          </div>
        </Link>
      ))}
    </motion.div>
  );
});