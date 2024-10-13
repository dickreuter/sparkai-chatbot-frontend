import React, { useState } from 'react';
import './Signin.css';
import { Alert, Button, Snackbar, TextField, Modal } from '@mui/material';
import useAuthSignIn from './UseAuthsignIn';
import AuthState from './AuthState';
import axios from 'axios';
import { API_URL, HTTP_PREFIX } from '../../helper/Constants';

const FullScreenTwoCards = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { submitSignIn, isLoading } = useAuthSignIn();
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "warning" | "info">("success");
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState<boolean>(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState<string>('');

  const onSubmit = async (e: any) => {
    e.preventDefault();
    console.log(formData);
    console.log("submitted");
    if (!formData.email || !formData.password) {
      setSnackbarMessage('Username and Password are required');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      console.log("submit signin");
      const { success, message } = await submitSignIn(formData);
      setSnackbarMessage(success ? message : 'Incorrect Username or Password');
      setSnackbarSeverity(success ? 'success' : 'error');
    } catch (error) {
      setSnackbarMessage('Incorrect Username or Password');
      setSnackbarSeverity('error');
    }
    setSnackbarOpen(true);
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit(e);
    }
  };

  const handleForgotPassword = async () => {
    try {
      const response = await axios.post(`http${HTTP_PREFIX}://${API_URL}/forgot_password`, { email: forgotPasswordEmail });
      setSnackbarMessage('Password reset email sent successfully');
      setSnackbarSeverity('success');
    } catch (err) {
      setSnackbarMessage('Failed to send password reset email. Please try again.');
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
      setForgotPasswordOpen(false);
    }
  };

  const inputProps = {
    style: {
      WebkitBoxShadow: '0 0 0 1000px white inset',
      WebkitTextFillColor: '#000',
    } as React.CSSProperties,
  };
  const labelProps = {
    shrink: true,
  };

  return (
    <div className="cards-container">
      <div className="cardmini">
        <div className="cardmini-text">
          <h2>Login</h2>

          <div className="input-field">
            <TextField
              id="email-input"
              fullWidth
              label="Enter your username"
              variant="outlined"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onKeyPress={handleKeyPress}
              InputProps={inputProps}
              InputLabelProps={labelProps}
              autoComplete="username"
            />
          </div>
          <div className="input-field">
            <TextField
              id="password-input"
              fullWidth
              label="Password"
              variant="outlined"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onKeyPress={handleKeyPress}
              InputProps={inputProps}
              InputLabelProps={labelProps}
              autoComplete="current-password"
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
          <p style={{ cursor: 'pointer' }} onClick={() => setForgotPasswordOpen(true)}>
            Forgot your password?
          </p>
        </div>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          style={{
            position: 'fixed',
            bottom: '-25%',
            marginBottom: '15px'
          }}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
            {snackbarMessage}
          </Alert>
        </Snackbar>

        <Modal open={forgotPasswordOpen} onClose={() => setForgotPasswordOpen(false)}>
          <div className="modal-container">
            <h2>Forgot Password</h2>
            <p>Enter your email address and we'll send you a link to reset your password.</p>
            <TextField
              autoFocus
              margin="dense"
              label="Email Address"
              type="email"
              fullWidth
              value={forgotPasswordEmail}
              onChange={(e) => setForgotPasswordEmail(e.target.value)}
            />
            <div className="modal-actions">
              <Button onClick={() => setForgotPasswordOpen(false)} color="primary">
                Cancel
              </Button>
              <Button onClick={handleForgotPassword} color="primary">
                Send Email
              </Button>
            </div>
          </div>
        </Modal>

        <AuthState />
      </div>
    </div>
  );
};

export default FullScreenTwoCards;
