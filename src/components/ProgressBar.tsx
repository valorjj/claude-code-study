"use client";
import { useEffect, useState } from "react";
import "./ProgressBar.css";

/** Fixed top reading-progress bar. */
export default function ProgressBar() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight || 1;
      setW(Math.min(1, Math.max(0, h.scrollTop / max)) * 100);
    };
    document.addEventListener("scroll", on, { passive: true });
    on();
    return () => document.removeEventListener("scroll", on);
  }, []);
  return <div id="progress-bar" style={{ width: `${w}%` }} />;
}
