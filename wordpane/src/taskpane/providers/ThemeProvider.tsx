import React from "react";
import { createTheme, ThemeProvider as MUIThemeProvider } from "@mui/material/styles";

const ThemeProvider = ({ children }) => {
  const theme = createTheme({
    palette: {
      primary: {
        main: "#F5861999",
      },
      grey: {
        "100": "#D3D3D3",
      },
    },
    typography: {
      button: {
        textTransform: "none",
      },
      fontFamily: "calc(--font-family)",
      subtitle1: {
        color: "#F5861999",
        fontSize: "14px",
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            "&.MuiButton-root.Mui-disabled": {
              borderColor: "#F4F4F4",
              color: "#C2C2C2",
            },
            "&.MuiButton-colorInfo": {
              backgroundColor: "#F4F4F4",
              color: "#000000",
              borderColor: "#C2C2C2",
            },
            "&.MuiButton-colorInherit": {
              borderColor: "#C2C2C2",
            },
          },
        },
      },
    },
  });

  return <MUIThemeProvider theme={theme}>{children}</MUIThemeProvider>;
};

export default ThemeProvider;
