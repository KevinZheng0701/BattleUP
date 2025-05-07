"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import MatchSelectorModal from "../components/MatchSelectorModal";
import InstructionsBoard from "@/components/InstructionsBoard";
import useAlert from "@/context/AlertContext";
const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001";

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>("");
  const router = useRouter();
  const { showAlert } = useAlert();

  // Assign a random user id when loaded to the page
  useEffect(() => {
    let storedId = localStorage.getItem("userId") ?? "";

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isValidUuid = storedId && uuidRegex.test(storedId);

    // If no valid ID is found then generate a new one
    if (!isValidUuid) {
      storedId = uuidv4();
      localStorage.setItem("userId", storedId);
    }

    setUserId(storedId);
  }, []);

  // Open the match selector modal
  function openModal() {
    setIsModalOpen(true);
  }

  // Close the match selector modal
  function closeModal() {
    setIsModalOpen(false);
  }

  // Calls the backend to find a room
  async function searchMatch(duration: number) {
    try {
      const seconds = duration * 60;
      const response = await fetch(`${API}/api/find-room`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, duration: seconds }),
      });

      if (!response.ok) {
        if (response.status === 400) {
          showAlert("warning", "Invalid player id. Please refresh.", 3000);
        } else {
          showAlert("warning", "Failed to find room. Server error.", 3000);
        }
      }

      const data = await response.json();
      const roomId = data.roomId;

      // Redirect to room
      router.push(`/room/${roomId}`);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="text-foreground flex h-screen min-h-screen flex-col items-center bg-gradient-to-b from-[#0e0b16] via-[#4c0033] to-[#1a1a40] text-center font-serif">
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
      <button
        onClick={openModal}
        className="text-background cursor-fist rounded-xl bg-gradient-to-r from-red-700 via-orange-500 to-yellow-300 px-8 py-3 text-xl font-semibold shadow-lg transition-transform duration-300 hover:scale-105 hover:brightness-125 md:mb-8"
      >
        Start Battle
      </button>
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
        backgroundClass="bg-card/25"
      />
      {isModalOpen && (
        <MatchSelectorModal onStart={searchMatch} onClose={closeModal} />
      )}
    </div>
  );
}
