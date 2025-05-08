import { useState } from "react";
import ModalBackdrop from "./ModalBackdrop";
import DurationButton from "./DurationButton";
import useAlert from "@/context/AlertContext";

type MatchSelectorModalProp = {
  onStart: (duration: number) => Promise<void>;
  onClose: () => void;
};

export default function MatchSelectorModal({
  onStart,
  onClose,
}: MatchSelectorModalProp) {
  const [durationSelected, setDurationSelected] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { showAlert } = useAlert();

  // Select the duration of the match
  function selectMatch(duration: number) {
    setDurationSelected(duration);
  }

  // Close the modal and reset the selected match
  function closeModal() {
    setDurationSelected(0);
    onClose();
  }

  // Start the search for a match up
  async function startMatchSearch() {
    if (durationSelected === 0) {
      showAlert(
        "warning",
        "Please choose a duration for the match first.",
        3000,
      );
      return;
    }
    setIsLoading(true);
    try {
      await onStart(durationSelected);
    } catch (error) {
      setIsLoading(false);
      if (error instanceof Error) {
        showAlert(
          "warning",
          "Error: " + error.message || "Unknown error occurred.",
          5000,
        );
      } else {
        console.log(error);
      }
    }
  }

  return (
    <>
      <ModalBackdrop onClick={closeModal} />
      <div className="text-foreground fixed top-1/2 z-2 flex max-w-9/10 min-w-1/2 -translate-y-1/2 flex-col items-center justify-center gap-5 rounded-xl bg-gradient-to-tr from-purple-900 via-indigo-800 to-slate-700 p-4 shadow-xl">
        <h1 className="text-xl font-bold md:text-2xl lg:text-3xl">
          Choose Match Duration
        </h1>
        <p className="text-base font-semibold text-blue-500">
          {isLoading ? "Finding a match..." : ""}
        </p>
        <div className="flex w-full justify-center gap-3">
          <DurationButton
            duration={1}
            onClick={selectMatch}
            disabled={isLoading}
            selected={durationSelected === 1}
          />
          <DurationButton
            duration={3}
            onClick={selectMatch}
            disabled={isLoading}
            selected={durationSelected === 3}
          />
          <DurationButton
            duration={5}
            onClick={selectMatch}
            disabled={isLoading}
            selected={durationSelected === 5}
          />
        </div>
        <div className="flex w-full gap-4">
          <button
            onClick={closeModal}
            disabled={isLoading}
            className="text-background flex-1 rounded-xl border-2 border-gray-200 bg-gray-200 px-6 py-3 font-[roboto] text-lg hover:border-gray-400 hover:bg-gray-300 md:text-xl lg:text-2xl"
          >
            Cancel
          </button>
          <button
            onClick={startMatchSearch}
            disabled={isLoading}
            className="text-foreground cursor-fist flex-1 rounded-xl border-2 border-blue-600 bg-blue-600 px-6 py-3 font-[roboto] text-lg hover:border-blue-500 hover:bg-blue-700 md:text-xl lg:text-2xl"
          >
            Start
          </button>
        </div>
      </div>
    </>
  );
}
