import * as React from "react";
import { createMemoryRouter, RouterProvider, Outlet } from "react-router-dom";
import { AuthProvider } from "react-auth-kit";
import { makeStyles } from "@fluentui/react-components";
import WordpaneCopilot from "./WordpaneCopilot";
import SignInComponent from "../components/auth/SignIn";
import SignOut from "../components/auth/SignOutButton";
import "../resources/clash-display.css";
import "./App.css";
import "./Proposal.css";
import "./Upload.css";
import "bootstrap/dist/css/bootstrap.css";

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
  return (
    <div className="content-scaler">
      <div className="main-content">
        <Outlet />
      </div>
    </div>
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
