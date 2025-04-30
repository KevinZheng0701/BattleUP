"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import ModalBackdrop from "./ModalBackdrop";

type MatchResultModalProp = {
  result: string;
  yourScore: number;
  opponentScore: number;
  duration: number;
  rematchAvailable: boolean;
  userId: string;
  rematchRequested: boolean;
  onRematch: () => void;
};

export default function MatchResultModal({
  result,
  yourScore,
  opponentScore,
  duration,
  rematchAvailable,
  userId,
  rematchRequested,
  onRematch,
}: MatchResultModalProp) {
  const router = useRouter();

  // Calls the backend to find a room
  async function searchMatch() {
    try {
      const response = await fetch("http://localhost:5001/api/find-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, duration }),
      });

      if (!response.ok) {
        if (response.status === 400) {
          console.log("Invalid player id.");
          throw new Error("Invalid player id");
        } else {
          console.log("Failed to find room.");
          throw new Error("Failed to find room");
        }
      }

      const data = await response.json();
      const roomId = data.roomId;

      // Redirect to room
      router.push(`/room/${roomId}`);
    } catch (error) {
      throw error;
    }
  }

  return (
    <>
      <ModalBackdrop />
      <div className="fixed top-1/2 z-2 flex max-w-3/5 min-w-1/2 -translate-y-1/2 flex-col items-center justify-center gap-5 rounded-3xl bg-gradient-to-t from-[#ffce6c] via-[#ffe460] to-[#ffaa00] px-4 py-6 text-[#3c2f1c] shadow-xl">
        <h1 className="text-2xl font-bold md:text-3xl">{result}</h1>
        <div className="flex items-center justify-around gap-5 text-xl md:text-2xl">
          <h3 className="font-semibold">{yourScore}</h3>
          <span className="text-base md:text-lg">vs</span>
          <h3 className="font-semibold">{opponentScore}</h3>
        </div>
        <div className="flex max-w-full min-w-3/5 flex-col justify-center gap-3 text-base md:text-lg">
          <button
            className="cursor-fist text-foreground rounded-lg bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 px-6 py-3 font-semibold shadow-lg transition duration-300 hover:brightness-125"
            onClick={searchMatch}
          >
            New Match
          </button>
          {rematchAvailable && (
            <button
              className="text-foreground rounded-lg bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 px-6 py-3 font-semibold shadow-lg transition duration-300 hover:brightness-115"
              onClick={onRematch}
              disabled={rematchRequested}
            >
              Rematch
            </button>
          )}

          <Link
            href="/"
            className="text-background rounded-lg bg-gray-100 px-6 py-3 font-semibold shadow-md transition duration-300 hover:bg-gray-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </>
  );
}
