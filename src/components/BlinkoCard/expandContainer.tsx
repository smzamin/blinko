import { motion } from "framer-motion";

interface ExpandableContainerProps {
  isExpanded: boolean;
  children: React.ReactNode;
}

export const ExpandableContainer = ({ isExpanded, children }: ExpandableContainerProps) => {
  return (
    <motion.div
      className='w-full'
      style={{
        boxShadow: '0 0 15px -5px #5858581a',
        position: isExpanded ? 'fixed' : 'relative',
        top: isExpanded ? 0 : 'auto',
        left: isExpanded ? 0 : 'auto',
        zIndex: isExpanded ? 50 : 1,
      }}
      layout
      animate={{
        width: isExpanded ? "100vw" : "100%",
        height: isExpanded ? "100vh" : "auto",
        scale: isExpanded ? 1 : 1,
      }}
      transition={{
        type: "spring",
        damping: 20,
        stiffness: 300,
        mass: 0.6,
      }}
    >
      {children}
    </motion.div>
  );
};