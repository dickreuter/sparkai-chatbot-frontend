import React, { useEffect, useState } from "react";

export default function useShowWelcome() {
  const [showWelcome, _setShowWelcome] = useState<boolean>(
    localStorage.getItem("showWelcome") === "false" ? false : true
  );

  useEffect(() => {
    localStorage.setItem("showWelcome", showWelcome.toString());
  }, [showWelcome]);

  const setShowWelcome = (show: boolean) => {
    _setShowWelcome(show);
    localStorage.setItem("showWelcome", show.toString());
  };

  return { showWelcome, setShowWelcome };
}
