"use client";

import styles from "../styles/DurationButton.module.css";

type DurationButtonProps = {
  duration: number;
  selected?: boolean;
  onClick?: (duration: number) => void;
};

export default function DurationButton({
  duration,
  selected,
  onClick,
}: DurationButtonProps) {
  return (
    <button
      onClick={() => onClick?.(duration)}
      className={`${styles["duration-button"]} md:text-lg lg:text-xl ${selected ? "border-slate-800 bg-amber-500 shadow-2xl" : "border-amber-400 bg-amber-400"} `}
    >
      {duration} min
    </button>
  );
}
