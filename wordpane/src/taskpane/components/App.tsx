import * as React from "react";
import { createMemoryRouter, RouterProvider, Outlet } from "react-router-dom";
import { AuthProvider, useAuthUser } from "react-auth-kit";
import { makeStyles } from "@fluentui/react-components";
import WordpaneCopilot from "./WordpaneCopilot/WordpaneCopilot";
import SignInComponent from "../components/auth/SignIn";
import SignOut from "../components/auth/SignOutButton";
import "../resources/clash-display.css";
import "./App.css";
import "./Proposal.css";
import "./Upload.css";
import "bootstrap/dist/css/bootstrap.css";
import ThemeProvider from "../providers/ThemeProvider";
import posthog from "posthog-js";

// Initialize PostHog with Word Add-in specific configuration
posthog.init("phc_bdUxtNoJmZWNnu1Ar29zUtusFQ4bvU91fZpLw5v4Y3e", {
  api_host: "https://eu.i.posthog.com",
  person_profiles: "identified_only",
  bootstrap: {
    distinctID: "unknown_user",
    isIdentifiedID: false,
    featureFlags: {},
    featureFlagPayloads: {},
  },
  autocapture: false,
  loaded: (posthog) => {
    // Check for authenticated user immediately after loading
    const authState = JSON.parse(localStorage.getItem("_auth_state") || "{}");
    if (authState.email) {
      posthog.identify(authState.email, {
        email: authState.email,
        app_type: "word_add_in",
        platform: "microsoft_office",
        client: "word",
      });
    } else {
      // Only register default properties if user is not identified
      posthog.register({
        app_type: "word_add_in",
        platform: "microsoft_office",
        client: "word",
      });
    }
  },
});

interface AppProps {
  title: string;
}

const useStyles = makeStyles({
  root: {
    minHeight: "100vh",
    transform: "scale(0.8)",
    transformOrigin: "top left",
    width: "125%",
    height: "125%",
  },
});

const Layout: React.FC<{ title: string }> = ({ title }) => {
  const getAuth = useAuthUser();
  const auth = getAuth();

  // Track when the add-in is loaded and identify user if logged in
  React.useEffect(() => {
    if (auth?.email) {
      posthog.identify(auth.email, {
        email: auth.email,
        app_type: "word_add_in",
        platform: "microsoft_office",
        client: "word",
      });
    }

    posthog.capture("word_addin_loaded", {
      title,
      environment: "microsoft_word",
      email: auth?.email || "unknown_user",
    });
  }, [auth?.email]);

  return (
    <ThemeProvider>
      <div className="content-scaler">
        <div className="main-content">
          <Outlet />
        </div>
      </div>
    </ThemeProvider>
  );
};

const App: React.FC<AppProps> = ({ title }) => {
  const styles = useStyles();

  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <Layout title={title} />,
        children: [
          {
            path: "/",
            element: <WordpaneCopilot />,
          },
          {
            path: "/login",
            element: <SignInComponent />,
          },
          {
            path: "/logout",
            element: <SignOut />,
          },
          {
            path: "*",
            element: <WordpaneCopilot />,
          },
        ],
      },
    ],
    {
      initialEntries: ["/"],
      initialIndex: 0,
    }
  );

  return (
    <div className={styles.root}>
      <AuthProvider authType={"localstorage"} authName={"sparkaichatbot"}>
        <RouterProvider router={router} />
      </AuthProvider>
    </div>
  );
};

export default App;
