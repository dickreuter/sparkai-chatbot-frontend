import ReactGA from "react-ga4";

const handleGAEvent = (category: string, action: string, label: string) => {
  ReactGA.event({
    category: category,
    action: action,
    label: label
  });
};

export default handleGAEvent;
