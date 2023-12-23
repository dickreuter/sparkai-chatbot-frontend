
import React, { useState } from 'react';
import './FullPageTwoCards.css'; // Make sure to import the CSS file
import { Alert, Button, Snackbar, TextField, Box, Grid, Card, CardContent, Typography  } from '@mui/material';
import useAuthSignIn from './UseAuthsignIn';
import AuthState from './AuthState';

const FullScreenTwoCards = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { submitSignIn, isLoading, error } = useAuthSignIn();  // Using the custom hook
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "warning" | "info">("success");
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

  const onSubmit = async (e: any) => {
    e.preventDefault();

    // Simple form validation
    if (!formData.email || !formData.password) {
      setSnackbarMessage('Email and Password are required');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    // Use custom hook for signing in
    const { success, message } = await submitSignIn(formData);
    
    setSnackbarMessage(message);
    setSnackbarSeverity(success ? 'success' : 'error');
    setSnackbarOpen(true);
  };


  return (
    <div className="cards-container">
        <div className="cardcustom light-grey ">
          <div className="content-wrapper">
          <img src="https://drive.google.com/uc?export=view&id=1euxPXCtPAXmPby7vWBnQomcQTkby2GIO" alt="Your Image Description" className="card-image"/>

            <div className="card-text">
            <h1>MyTender.io</h1>
            <p>All in one tender management</p>
          </div>
          </div>
        </div>

        <div className="cardcustom off-white">
          <div className="mb-3">
            <div className="cardmini">
                <div className="cardmini-text">
                  <h2>Login</h2>
                
                <div className="input-field">
                  <TextField
                    fullWidth
                    label="Enter your account number"
                    variant="outlined"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="input-field">
                  <TextField
                    fullWidth
                    label="Password"
                    variant="outlined"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                <Button
                  className="login-button"
                  variant="contained"
                  onClick={onSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Login'}
                </Button>
                <p>Forgot your password?</p>
                </div>


                <Snackbar
                  open={snackbarOpen}
                  autoHideDuration={3000}
                  onClose={() => setSnackbarOpen(false)}
                >
                  <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
                    {snackbarMessage}
                  </Alert>
                </Snackbar>

                <AuthState />


            </div>
          </div>
        </div>
    </div>
  );
};
export default FullScreenTwoCards;


