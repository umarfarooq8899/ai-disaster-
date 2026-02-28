import React from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "../components/ui/Navbar";

export default function PublicLayout() {
  const location = useLocation();
  const element = useOutlet();

  return (
    <div className="min-h-screen bg-blue-white">
      <div className="pointer-events-none fixed inset-0 bg-blue-glow" />

      <div className="relative">
        <Navbar />

        {/* PUSH CONTENT BELOW NAVBAR */}
        <main className="mx-auto max-w-6xl px-5 py-8 mt-20">
          <AnimatePresence mode="wait">
            {element && React.cloneElement(element, { key: location.pathname })}
          </AnimatePresence>
        </main>

        <footer className="border-t border-brand-100 bg-white/70">
          <div className="mx-auto max-w-6xl px-5 py-6 text-sm text-slate-600">
            © {new Date().getFullYear()} Disaster Relief • Blue & White Theme
          </div>
        </footer>
      </div>
    </div>
  );
}
