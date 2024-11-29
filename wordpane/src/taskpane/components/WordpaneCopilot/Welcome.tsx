import React, { useEffect, useRef } from "react";
import Typewriter from "typewriter-effect/dist/core";

const Welcome = () => {
  const welcomeRef = useRef(null);
  useEffect(() => {
    if (!welcomeRef.current) return;
    var typewriter = new Typewriter(welcomeRef.current, {
      loop: false,
      delay: 75,
    });

    typewriter
      .pauseFor(500)
      .typeString('<img src="/assets/logo.png" alt="logo" height="48px" />')
      .pauseFor(300)
      .typeString("<h5>Welcome to mytender.io!</h5>")
      .start();
  }, [welcomeRef]);

  return <div className="welcome" ref={welcomeRef}></div>;
};

export default Welcome;
