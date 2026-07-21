"use client";
import { useEffect, useState } from "react";

/**
 * Returns the id of the section currently near the top of the viewport.
 * Mirrors the standalone doc's IntersectionObserver scrollspy.
 */
export function useScrollspy(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? "");

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const visible: Record<string, boolean> = {};
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null);

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          visible[e.target.id] = e.isIntersecting;
        });
        for (const id of ids) {
          if (visible[id]) {
            setActive(id);
            break;
          }
        }
      },
      { rootMargin: "-12% 0px -70% 0px", threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ids]);

  return active;
}
