"use client";

import MatchSelectorModal from "../components/MatchSelectorModal";
import InstructionsBoard from "@/components/InstructionsBoard";

export default function HomePage() {
  return (
    <div className="text-foreground flex h-screen flex-col items-center bg-gradient-to-b from-[#0e0b16] via-[#4c0033] to-[#1a1a40] text-center font-serif">
      <div className="my-5 flex items-center text-5xl font-bold md:mt-11 md:mb-7 lg:mt-12 lg:mb-8">
        <span className="inline-block bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-2xl text-transparent md:text-3xl lg:text-5xl">
          💪
        </span>
        <h1 className="mx-2 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-4xl text-transparent md:text-5xl lg:text-6xl">
          Battle Up
        </h1>
        <span className="inline-block -scale-x-100 transform bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-2xl text-transparent md:text-3xl lg:text-5xl">
          💪
        </span>
      </div>
      <p className="mb-5 w-8/9 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-xl font-light text-transparent md:mb-6 md:text-2xl lg:mb-7 lg:text-3xl">
        Challenge people in a real-time push-up battle. Compete, sweat, and win!
      </p>
      <MatchSelectorModal />
      <InstructionsBoard
        title="💡 How It Works"
        instructions={[
          {
            title: "1. Join the Arena",
            description:
              "Click Start Battle to enter a 1v1 real-time push-up competition.",
          },
          {
            title: "2. Get Counted",
            description:
              "Your webcam tracks your push-ups using smart AI. No cheating.",
          },
          {
            title: "3. Win & Climb",
            description: "Beat your opponent and claim your spot at the top.",
          },
        ]}
      />
    </div>
  );
}
