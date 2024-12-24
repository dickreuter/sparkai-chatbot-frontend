import { useSignOut } from "react-auth-kit";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const SignOut = () => {
  const navigate = useNavigate();
  const signOut = useSignOut();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performSignOut = async () => {
      try {
        // Perform sign out
        const success = signOut();

        if (!success) {
          setError("Failed to sign out properly");
          return;
        }

        // Add a small delay to ensure signOut completes
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Navigate to login page
        navigate("/login");
      } catch (err) {
        setError("An error occurred during sign out");
        console.error("SignOut error:", err);
      }
    };

    performSignOut();
  }, []); // Empty dependency array means this runs once on mount

  if (error) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "#e74c3c"
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        textAlign: "center"
      }}
    >
      Signing out...
    </div>
  );
};

export default SignOut;
