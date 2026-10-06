import { useEffect, useRef, useState } from 'react';

/** Animates a number from 0 to value when it first appears. */
export default function CountUp({ value, duration = 1200 }) {
  const [shown, setShown] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf = 0;
    const run = () => {
      const start = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - start) / duration);
        setShown(Math.round(value * (1 - (1 - k) ** 3)));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        run();
        io.disconnect();
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return <span ref={ref}>{shown.toLocaleString('en-IN')}</span>;
}
