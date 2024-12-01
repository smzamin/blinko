import { motion } from "framer-motion";
import { createPortal } from "react-dom";

interface ExpandableContainerProps {
  isExpanded: boolean;
  children: React.ReactNode;
}

export const ExpandableContainer = ({ isExpanded, children }: ExpandableContainerProps) => {
  if (isExpanded) {
    return createPortal(
      <motion.div
        className='w-full expand-container fixed inset-0'
        style={{
          boxShadow: '0 0 15px -5px #5858581a',
          backgroundColor: 'var(--background)',
          zIndex: 9999,
        }}
        layout
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          width: "100vw",
          height: "100vh",
          scale: 1,
          opacity: 1
        }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 300,
          mass: 0.6,
        }}
      >
        {children}
      </motion.div>,
      document.body
    );
  }

  return (
    <motion.div
      className='w-full expand-container'
      style={{
        boxShadow: '0 0 15px -5px #5858581a',
        position: 'relative',
      }}
      layout
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {children}
    </motion.div>
  );
};