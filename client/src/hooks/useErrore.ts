import { useState, useEffect } from "react";

export function useErrore() {
  const [errore, setErrore] = useState("");
  useEffect(() => {
    if (errore !== "") {
      const timer = setTimeout(() => setErrore(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [errore]);
  return { errore, setErrore };
}