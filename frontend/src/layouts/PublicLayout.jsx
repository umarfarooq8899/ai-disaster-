import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/ui/Navbar";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-blue-white">
      <div className="pointer-events-none fixed inset-0 bg-blue-glow" />
      <div className="relative">
        <Navbar />
        <main className="mx-auto max-w-6xl px-5 py-8">
          <Outlet />
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
