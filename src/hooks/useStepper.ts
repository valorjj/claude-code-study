"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type Stepper = {
  /** current index. When `overview`, 0 = "overview" and 1..count are steps. */
  cur: number;
  playing: boolean;
  speed: number;
  /** inclusive max index reachable. */
  max: number;
  setSpeed: (v: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  restart: () => void;
  goTo: (i: number) => void;
  setLoop: (v: boolean) => void;
};

type Opts = { overview?: boolean; loop?: boolean; baseMs?: number };

/**
 * Generic playback stepper for the walkthrough (overview:false, cur 0..count-1)
 * and the architecture diagram (overview:true, cur 0..count with 0 = overview).
 */
export function useStepper(count: number, opts: Opts = {}): Stepper {
  const { overview = false, baseMs = 2600 } = opts;
  const max = overview ? count : count - 1;
  const start = overview ? 1 : 0;

  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const loopRef = useRef(!!opts.loop);

  const clamp = useCallback((i: number) => Math.max(0, Math.min(max, i)), [max]);
  const goTo = useCallback((i: number) => setCur(clamp(i)), [clamp]);
  const pause = useCallback(() => setPlaying(false), []);
  const next = useCallback(() => {
    setPlaying(false);
    setCur((c) => clamp(c + 1));
  }, [clamp]);
  const prev = useCallback(() => {
    setPlaying(false);
    setCur((c) => clamp(c - 1));
  }, [clamp]);
  const restart = useCallback(() => {
    setPlaying(false);
    setCur(0);
  }, []);
  const play = useCallback(() => {
    setCur((c) => (c >= max ? start : Math.max(c, start)));
    setPlaying(true);
  }, [max, start]);
  const toggle = useCallback(() => setPlaying((p) => !p), []);
  const setLoop = useCallback((v: boolean) => {
    loopRef.current = v;
  }, []);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setCur((c) => {
        if (c >= max) {
          if (loopRef.current) return start;
          setPlaying(false);
          return c;
        }
        return c + 1;
      });
    }, Math.round(baseMs / speed));
    return () => window.clearInterval(id);
  }, [playing, speed, max, start, baseMs]);

  return { cur, playing, speed, max, setSpeed, play, pause, toggle, next, prev, restart, goTo, setLoop };
}
