import { _ } from "@/lib/lodash";
import { observer } from "mobx-react-lite";
import { motion, useAnimation } from "motion/react";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useMediaQuery } from "usehooks-ts";

type IProps = {
  style?: any;
  className?: any;
  onBottom: () => void;
  children: any;
  disableAnimation?: boolean;
};

export type ScrollAreaHandles = {
  scrollToBottom: () => void;
}

export const ScrollArea = observer(forwardRef<ScrollAreaHandles, IProps>(({ style, className, children, onBottom, disableAnimation = true }, ref) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtTop, setIsAtTop] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const controls = useAnimation();
  const isPc = useMediaQuery('(min-width: 768px)');
  let debounceBottom
  if (onBottom) {
    debounceBottom = _.debounce(onBottom!, 500, { leading: true, trailing: false });
  }

  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      scrollRef.current!.scrollTop = scrollRef.current!.scrollHeight;
    },
  }));

  const handleScroll = (e) => {
    const target = e.target;
    const bottom = (target.scrollHeight - target.scrollTop) <= target.clientHeight + 100;
    const top = target.scrollTop <= 100;

    if (bottom) {
      debounceBottom?.();
      if (!isAtBottom && !disableAnimation) {
        setIsAtBottom(true);
        controls.start({ y: [-10, 0], transition: { type: "spring", stiffness: 300 } });
      }
    } else {
      setIsAtBottom(false);
    }

    if (top && !disableAnimation) {
      if (!isAtTop) {
        setIsAtTop(true);
        controls.start({ y: [10, 0], transition: { type: "spring", stiffness: 300 } });
      }
    } else {
      setIsAtTop(false);
    }
  };

  useEffect(() => {
    const divElement = scrollRef.current;
    divElement!.addEventListener("scroll", handleScroll);
    return () => {
      divElement!.removeEventListener("scroll", handleScroll);
    };
  }, [isAtTop, isAtBottom]);

  return (
    <motion.div
      ref={scrollRef}
      style={style}
      className={`${className} overflow-y-scroll overflow-x-hidden  ${isPc ? '' : 'scrollbar-hide'}`}
      animate={disableAnimation ? undefined : controls}
    >
      {children}
    </motion.div>
  );
}))

// const styles = `
//   .scrollbar-hide {
//     -ms-overflow-style: none;  /* IE and Edge */
//     scrollbar-width: none;     /* Firefox */
//   }

//   .scrollbar-hide::-webkit-scrollbar {
//     display: none;  /* Chrome, Safari and Opera */
//   }
// `;

// if (typeof document !== 'undefined') {
//   const styleSheet = document.createElement('style');
//   styleSheet.textContent = styles;
//   document.head.appendChild(styleSheet);
// }
