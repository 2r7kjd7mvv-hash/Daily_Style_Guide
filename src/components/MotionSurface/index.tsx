import type { PropsWithChildren } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function MotionSurface({ children }: PropsWithChildren) {
  const reduced = useReducedMotion();
  return <motion.div initial={reduced ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}
