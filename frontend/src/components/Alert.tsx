"use client";

import styles from "../styles/Alert.module.css";
import useAlert from "@/context/AlertContext";

const Alert = () => {
  const { alert } = useAlert();

  return (
    <div
      className={`${styles.alert} ${styles[`alert-${alert.status}`]} ${
        alert.show ? "" : styles.hide
      }`}
      role="alert"
    >
      {alert.text}
    </div>
  );
};

export default Alert;
