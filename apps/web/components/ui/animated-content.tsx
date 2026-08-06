'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { type ReactNode } from 'react';

interface AnimatedContentProps {
  isLoading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AnimatedContent({ isLoading, skeleton, children, className }: AnimatedContentProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) return <>{isLoading ? skeleton : children}</>;

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          className={className}
        >
          {skeleton}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
