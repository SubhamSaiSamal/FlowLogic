/* Shared framer-motion variants & easing for the subgrad landing.
   Keeping these in one place so every section choreographs the same
   way — expo-out easing, consistent fade-up distance and stagger. */

export const EASE = [0.16, 1, 0.3, 1]; // expo-out — premium, snappy settle

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: EASE } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: EASE } },
};

/* Parent container that staggers its motion children. */
export const container = (staggerChildren = 0.08, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
});

/* Default viewport config: animate once, a touch before fully in view. */
export const viewportOnce = { once: true, amount: 0.2, margin: "0px 0px -8% 0px" };
