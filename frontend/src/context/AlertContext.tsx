"use client";

import { createContext, useContext } from "react";

type AlertType = {
  alert: {
    status: string;
    text: string;
    show: boolean;
  };
  showAlert: (status: string, text: string, duration?: number) => void;
};

export const AlertContext = createContext<AlertType | null>(null); // Context to store alert

// Function to access the alert
export default function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}
