"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/50 text-foreground relative overflow-hidden">
      {/* Background pulse */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Brand Title */}
      <motion.h1
        className="text-5xl font-black tracking-tight relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span className="text-primary">Court</span>
        <span className="text-foreground">Pulse</span>
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="mt-3 text-sm text-muted-foreground tracking-wide uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Analyzing Performance • Syncing Stats • Preparing Dashboard
      </motion.p>

      {/* Progress bar */}
      <motion.div
        className="mt-10 w-64 h-1.5 bg-muted rounded-full overflow-hidden"
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
            repeatDelay: 0.3,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Footer */}
      <motion.div
        className="absolute bottom-8 text-xs text-muted-foreground tracking-widest uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: 1.2 }}
      >
        © {new Date().getFullYear()} CourtPulse Analytics
      </motion.div>
    </div>
  );
}
