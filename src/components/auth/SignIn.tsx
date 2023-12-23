// SignInComponent.js
import React, { useState } from 'react';
import { Alert, Button, Snackbar, TextField } from '@mui/material';
import useAuthSignIn from './useAuthSignIn';  // Make sure to import your custom hook here
import AuthState from './AuthState';

const SignInComponent = () => {
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
    <>
    <div>
    <iframe src="https://app.colossyan.com/embed/b22c8857-c73a-4980-a864-993bef9975f4" width="560" height="315" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
    </div>
      <div className="mb-3">
        <div className="col">
          <TextField
            label="Login"
            variant="outlined"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="mb-3">
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>
        <Button
          variant="contained"
          color="primary"
          onClick={onSubmit}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Login'}
        </Button>

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
    </>
  );
};

export default SignInComponent;
