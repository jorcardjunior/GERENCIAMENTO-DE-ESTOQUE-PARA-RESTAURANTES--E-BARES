"use client";

import { Package } from "lucide-react";
import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export default function SplashScreen({ onComplete, duration = 2500 }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 500);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800 transition-opacity duration-500 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center animate-in zoom-in-50 duration-500">
        <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-8 mb-6 shadow-2xl animate-bounce">
          <Package className="w-16 h-16 text-white" strokeWidth={2} />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight animate-pulse">
          Estoque<span className="text-blue-200">Rest</span>
        </h1>
        <p className="text-blue-100/80 text-sm mt-2 font-medium">
          Gerenciamento Inteligente de Estoque
        </p>
      </div>

      <div className="mt-12 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-white/60 animate-ping"
            style={{ animationDelay: `${i * 0.2}s`, animationDuration: "1s" }}
          />
        ))}
      </div>
    </div>
  );
}
