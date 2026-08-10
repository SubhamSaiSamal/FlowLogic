import { motion } from "framer-motion";
import { EASE, viewportOnce } from "./motion";

/* Scroll-reveal wrapper — fades + lifts its children in once they
   enter the viewport. Now powered by framer-motion (whileInView).
   Drop-in API compatible: { children, className, delay (ms), as }.
   Reduced motion is handled globally by <MotionConfig reducedMotion="user">. */
export default function Reveal({ children, className = "", delay = 0, as = "div" }) {
  const MotionTag = motion[as] ?? motion.div;
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.7, ease: EASE, delay: delay / 1000 }}
    >
      {children}
    </MotionTag>
  );
}
