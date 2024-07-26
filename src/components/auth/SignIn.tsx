import React, { useState } from 'react';
import './Signin.css'; // Make sure to import the CSS file
import { Alert, Button, Snackbar, TextField } from '@mui/material';
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
      setSnackbarMessage('Username and Password are required');
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit(e);
    }
  };

  return (
    <div className="cards-container">
      <div className="cardmini">
        <div className="cardmini-text">
          <h2>Login</h2>

          <div className="input-field">
            <TextField
              fullWidth
              label="Enter your username"
              variant="outlined"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onKeyPress={handleKeyPress}
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
              onKeyPress={handleKeyPress}
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
  );
};

export default FullScreenTwoCards;
