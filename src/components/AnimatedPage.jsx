'use client';

import { motion } from 'framer-motion';

/**
 * Page-level wrapper with a smooth fade + slide-up entrance.
 */
const pageVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -16 },
};

export default function AnimatedPage({ children, className = '' }) {
  return (
    <motion.div
      className={`page ${className}`}
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger container — children animate one-by-one.
 */
export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

/**
 * Item that fades + slides up (for use inside stagger container).
 */
export const fadeUpItem = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

/**
 * Scale-in pop for cards / reveals.
 */
export const popIn = {
  hidden:  { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

/**
 * Simple tap feedback for buttons.
 */
export const tapScale = { scale: 0.96 };
