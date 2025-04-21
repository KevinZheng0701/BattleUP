import { useState } from "react";
import ModalBackdrop from "./ModalBackdrop";
import DurationButton from "./DurationButton";

export default function MatchSelectorModal() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [matchSelected, setMatchSelected] = useState<number>(0);

  // Open the match selector modal
  function openMatchModal() {
    setIsModalOpen(true);
  }

  // Close the match selector modal
  function closeMatchModal() {
    setIsModalOpen(false);
    setMatchSelected(0);
  }

  // Select the duration of the match
  function selectMatch(duration: number) {
    setMatchSelected(duration);
  }

  // Start the search for a match up
  function startMatchSearch() {
    if (matchSelected === 0) {
      alert("Choose a duration");
      return;
    }
  }

  return (
    <>
      <button
        onClick={openMatchModal}
        className="text-background cursor-fist rounded-xl bg-gradient-to-r from-red-700 via-orange-500 to-yellow-300 px-8 py-3 text-xl font-semibold shadow-lg transition-transform duration-300 hover:scale-105 hover:brightness-125 md:mb-8"
      >
        Start Battle
      </button>
      {isModalOpen && (
        <>
          <ModalBackdrop onClick={closeMatchModal} />
          <div className="text-foreground fixed top-1/2 z-2 flex max-w-9/10 min-w-1/2 -translate-y-1/2 flex-col items-center justify-center gap-5 rounded-xl bg-gradient-to-tr from-purple-900 via-indigo-800 to-slate-700 p-4 shadow-xl">
            <h1 className="text-xl font-bold md:text-2xl lg:text-3xl">
              Choose Match Duration
            </h1>
            <div className="flex w-full justify-center gap-3">
              <DurationButton
                duration={1}
                onClick={selectMatch}
                selected={matchSelected === 1}
              />
              <DurationButton
                duration={3}
                onClick={selectMatch}
                selected={matchSelected === 3}
              />
              <DurationButton
                duration={5}
                onClick={selectMatch}
                selected={matchSelected === 5}
              />
            </div>
            <div className="flex w-full gap-4">
              <button
                onClick={closeMatchModal}
                className="text-background flex-1 rounded-xl border-2 border-gray-200 bg-gray-200 px-6 py-3 font-[roboto] text-lg hover:border-gray-400 hover:bg-gray-300 md:text-xl lg:text-2xl"
              >
                Cancel
              </button>
              <button
                onClick={startMatchSearch}
                className="text-foreground cursor-fist flex-1 rounded-xl border-2 border-blue-600 bg-blue-600 px-6 py-3 font-[roboto] text-lg hover:border-blue-500 hover:bg-blue-700 md:text-xl lg:text-2xl"
              >
                Start
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
