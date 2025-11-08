"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-6 sm:px-10 md:px-16 bg-gradient-to-br from-background via-background/95 to-muted/50 text-foreground relative overflow-hidden">
      {/* Animated background pulse */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Brand Title */}
      <motion.h1
        className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-center relative z-10 leading-tight"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span className="text-primary">Court</span>
        <span className="text-foreground">Pulse</span>
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="mt-3 text-xs sm:text-sm md:text-base text-muted-foreground tracking-wide text-center max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Analyzing performance, syncing stats, and preparing your dashboard…
      </motion.p>

      {/* Progress bar */}
      <motion.div
        className="mt-10 w-40 sm:w-56 md:w-72 h-1.5 bg-muted rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: ["0%", "40%", "70%", "100%"] }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            repeatDelay: 0.4,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Footer */}
      <motion.p
        className="absolute bottom-6 sm:bottom-8 text-[10px] sm:text-xs text-muted-foreground tracking-widest uppercase text-center w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: 1.2 }}
      >
        © {new Date().getFullYear()} CourtPulse Analytics
      </motion.p>
    </div>
  );
}
