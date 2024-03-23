import ReactGA from "react-ga4";


const handleGAEvent = (category, action, label) => {
    ReactGA.event({
      category: category,
      action: action,
      label: label,
    });
  };

export default handleGAEvent;
