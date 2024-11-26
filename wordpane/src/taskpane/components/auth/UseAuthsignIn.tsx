// useAuthSignIn.js
import { useState } from "react";
import axios from "axios";
import { useSignIn } from "react-auth-kit";
import { useNavigate } from "react-router-dom";
import { apiURL } from "../../helper/urls";
import posthog from "posthog-js";

const useAuthSignIn = () => {
  const signIn = useSignIn();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any | null>(null);

  const submitSignIn = async (formData) => {
    setIsLoading(true);
    posthog.capture("sign_in_attempt", {
      email: formData.email,
    });
    console.log("auth submit signin");
    try {
      const res = await axios.post(apiURL(`login`), formData);
      setIsLoading(false);
      console.log(res.status);
      console.log("posted signin");
      if (
        res.status === 200 &&
        signIn({
          token: res.data.token,
          expiresIn: 3600 * 48,
          tokenType: "Bearer",
          authState: {
            email: res.data.email,
            token: res.data.access_token,
          },
        })
      ) {
        navigate("/");
        posthog.identify(formData.email, {
          email: formData.email,
          $initial_referrer: document.referrer,
        });
        posthog.capture("user_signed_in");
        return { success: true, message: "Log in successful!" };
      } else {
        setError("Log in unsuccessful");
        console.log("log in unsuccessful");
        return { success: false, message: "Log in unsuccessful" };
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.message || "An error occurred. Please try again.");
      console.log(err.message);
      posthog.capture("sign_in_error", {
        error: err.message,
        email: formData.email,
      });
      return { success: false, message: err.message || "An error occurred. Please try again." };
    }
  };

  return {
    submitSignIn,
    isLoading,
    error,
  };
};

export default useAuthSignIn;
