import React from "react";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@nextui-org/react";
import { observer } from "mobx-react-lite";
import { DialogStore } from ".";
import { RootStore } from "@/store/root";
import TagSelectPop from "@/components/Common/TagSelectPop";
const Dialog = observer(() => {
  const modal = RootStore.Get(DialogStore);
  const { className, classNames, isOpen, placement, title, size, content, isDismissable, onlyContent = false, noPadding = false, transparent = false } = modal;
  const Content = typeof content === 'function' ? content : () => content;
  return (
    <Modal
      style={{ zIndex: 2000 }}
      onClose={() => {
        modal.close();
      }}
      // portalContainer={document.querySelector("#layout")!}
      backdrop='blur'
      isOpen={isOpen}
      size={size}
      placement={placement}
      onOpenChange={(open: boolean) => {
        if (open) {
          modal.preventClose = false
        }
        if (!open) {
          if (!modal.preventClose) {
            modal.close();
          }
        }
      }}
      hideCloseButton={size === 'full' ? true : false}
      className={`${className} ${transparent ? 'bg-transparent' : ''}`}
      classNames={classNames}
      isDismissable={isDismissable}
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
    >
      {
        onlyContent ? <ModalContent className="max-h-screen overflow-auto">< Content /></ModalContent > : <ModalContent className="max-h-screen overflow-auto">
          {() => (
            <>
              {title && <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>}
              <ModalBody className={`${noPadding ? '' : 'p-2 md:p-4 '}`}>
                <Content />
              </ModalBody>
            </>
          )}
        </ModalContent>
      }

    </Modal >
  );
});

export default Dialog;