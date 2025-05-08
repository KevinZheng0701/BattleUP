"use client";

import styles from "../styles/DurationButton.module.css";

type DurationButtonProps = {
  duration: number;
  selected?: boolean;
  disabled?: boolean;
  onClick?: (duration: number) => void;
};

export default function DurationButton({
  duration,
  selected,
  disabled,
  onClick,
}: DurationButtonProps) {
  return (
    <button
      onClick={() => onClick?.(duration)}
      disabled={disabled}
      className={`${styles["duration-button"]} md:text-lg lg:text-xl ${selected ? "border-slate-800 bg-amber-500 shadow-2xl" : "border-amber-400 bg-amber-400"} `}
    >
      {duration} min
    </button>
  );
}
