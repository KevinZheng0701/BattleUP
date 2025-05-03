"use client";

import { useState, useRef, ReactNode } from "react";
import { AlertContext } from "./AlertContext";

type AlertProvider = {
  children: ReactNode;
};

type AlertState = {
  status: string;
  text: string;
  show: boolean;
};

const AlertProvider = ({ children }: AlertProvider) => {
  const [alert, setAlert] = useState<AlertState>({
    status: "",
    text: "",
    show: false,
  });
  const timeRef = useRef<NodeJS.Timeout | null>(null);

  // Function to show the alert for a certain amount of time
  function showAlert(status: string, message: string, duration = 3000) {
    // Clear previous alert if they're still showing
    if (timeRef.current) {
      clearTimeout(timeRef.current);
    }
    setAlert({ status: status, text: message, show: true });
    timeRef.current = setTimeout(() => {
      // Hide the alert so the fading animation plays
      setAlert((prevAlert) => ({ ...prevAlert, show: false }));
      // After half a second hide the alert completely
      setTimeout(() => {
        setAlert({ status: "", text: "", show: false });
        timeRef.current = null;
      }, 500);
    }, duration);
  }

  return (
    <AlertContext.Provider value={{ alert, showAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export default AlertProvider;
