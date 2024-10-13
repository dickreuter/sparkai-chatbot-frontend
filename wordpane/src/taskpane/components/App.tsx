import * as React from "react";
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router-dom';
import { AuthProvider } from 'react-auth-kit';
import { makeStyles } from "@fluentui/react-components";
import NavBar from '../routes/NavBar';
import SignInComponent from '../components/auth/SignIn';
import SignOut from "../components/auth/SignOutButton";
import WordpaneCopilot from './WordpaneCopilot';
import '../resources/clash-display.css';


interface AppProps {
  title: string;
}

const useStyles = makeStyles({
  root: {
    minHeight: "100vh",
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
  
  const router = createMemoryRouter([
    {
      path: "/",
      element: <Layout title={title} />,
      children: [
        {
          path: "/",
          element: <WordpaneCopilot />
        },
        {
          path: "/login",
          element: <SignInComponent />
        },
        {
          path: "/logout",
          element: <SignOut />
        },
        {
          path: "*",
          element: <WordpaneCopilot />
        }
      ]
    }
  ], {
    initialEntries: ['/'],
    initialIndex: 0
  });

  return (
    <div className={styles.root}>
      <AuthProvider authType={"localstorage"} authName={"sparkaichatbot"}>
        <RouterProvider router={router} />
      </AuthProvider>
    </div>
  );
};

export default App;