import { useEffect } from "react";

const Spotlight = () => {
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      document.documentElement.style.setProperty("--mx", `${x}px`);
      document.documentElement.style.setProperty("--my", `${y}px`);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 opacity-40 dark:opacity-30"
      style={{
        background: "radial-gradient(600px circle at var(--mx, 50%) var(--my, 50%), hsl(var(--brand) / 0.15), transparent 60%)",
      }}
    />
  );
};

export default Spotlight;
