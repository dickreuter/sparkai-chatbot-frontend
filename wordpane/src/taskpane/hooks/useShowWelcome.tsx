import React, { useEffect, useState } from "react";

export default function useShowWelcome() {
  const [showWelcome, setShowWelcome] = useState<boolean>(localStorage.getItem("showWelcome") === "true");

  useEffect(() => {
    localStorage.setItem("showWelcome", showWelcome.toString());
  }, [showWelcome]);

  return { showWelcome, setShowWelcome };
}
