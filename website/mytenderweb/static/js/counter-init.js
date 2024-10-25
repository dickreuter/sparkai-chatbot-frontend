// counter-init.js
document.addEventListener("DOMContentLoaded", function () {
  // Function to start a single counter
  function startCounter(element) {
    const target = parseInt(element.getAttribute("data-count"));
    const options = {
      startVal: 0,
      duration: 2.5,
      useEasing: true,
      useGrouping: true,
      separator: ",",
      decimal: "."
    };

    const countUp = new CountUp(element, target, options);

    if (!countUp.error) {
      countUp.start();
    } else {
      console.error("CountUp error:", countUp.error);
    }
  }

  // Function to handle intersection observer callback
  function handleIntersection(entries, observer) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Start all counters in the section
        const counters = entry.target.querySelectorAll(".counter-value");
        counters.forEach((counter) => {
          startCounter(counter);
        });
        // Unobserve after starting
        observer.unobserve(entry.target);
      }
    });
  }

  // Create the intersection observer
  const observer = new IntersectionObserver(handleIntersection, {
    threshold: 0.1,
    rootMargin: "50px"
  });

  // Start observing the counter section
  const counterSection = document.getElementById("counter");
  if (counterSection) {
    observer.observe(counterSection);

    // Fallback: If the section is already visible, start counters immediately
    if (counterSection.getBoundingClientRect().top < window.innerHeight) {
      const counters = counterSection.querySelectorAll(".counter-value");
      counters.forEach((counter) => {
        startCounter(counter);
      });
    }
  }
});
