"use client";
import { useEffect, useRef, useState } from "react";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function useCountUp(
  endValue: number,
  duration: number = 1500,
  decimals: number = 0
): string {
  const [displayValue, setDisplayValue] = useState(0);
  const prevEndRef = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const startValue = prevEndRef.current;
    prevEndRef.current = endValue;

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = startValue + (endValue - startValue) * easedProgress;

      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [endValue, duration]);

  return displayValue.toFixed(decimals);
}
