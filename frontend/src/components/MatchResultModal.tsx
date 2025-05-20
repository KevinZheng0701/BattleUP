"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ModalBackdrop from "./ModalBackdrop";
import useAlert from "@/context/AlertContext";
const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { showAlert } = useAlert();

  // Calls the backend to find a room
  async function searchMatch() {
    setIsLoading(true);
    try {
      const response = await fetch(`${API}/api/find-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, duration }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 400 || response.status === 403) {
          throw new Error(data.message || "Request failed. Please try again.");
        } else {
          throw new Error("Failed to find room. Server error.");
        }
      }
      // Redirect to room
      const roomId = data.roomId;
      router.push(`/room/${roomId}`);
    } catch (error) {
      setIsLoading(false);
      if (error instanceof Error) {
        showAlert(
          "warning",
          "Error: " + error.message || "Unknown error occurred.",
          5000,
        );
        router.push("/");
      } else {
        console.log(error);
      }
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
        <p className="text-base font-semibold text-orange-500">
          {isLoading ? "Finding a match..." : ""}
        </p>
        <div className="flex max-w-full min-w-3/5 flex-col justify-center gap-3 text-base md:text-lg">
          <button
            className="cursor-fist text-foreground rounded-lg bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 px-6 py-3 font-semibold shadow-lg transition duration-300 hover:brightness-125"
            onClick={searchMatch}
            disabled={isLoading}
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
