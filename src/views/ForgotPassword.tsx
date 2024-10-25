import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { Form, Button, Row, Col, Card, Alert } from "react-bootstrap";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";

const ForgotPassword = () => {
  const [tokenValid, setTokenValid] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token");

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await axios.post(
          `http${HTTP_PREFIX}://${API_URL}/validate_reset_token`,
          { token }
        );
        if (response.data.valid) {
          setTokenValid(true);
          setFormData((prevFormData) => ({
            ...prevFormData,
            username: response.data.email || "" // Prefill username/email if available
          }));
        } else {
          setTokenValid(false);
        }
      } catch (error) {
        console.error("Error validating token:", error);
        setTokenValid(false);
      }
    };

    validateToken();
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/forgot_password_update`,
        { ...formData, token }
      );
      console.log("Password reset successful:", response.data);
      setLoading(false);
      window.location.href = "/login"; // Redirect to the login page
    } catch (error) {
      console.error("Error during password reset:", error);
      setLoading(false);
      if (error.response && error.response.data) {
        setError(error.response.data.detail); // Show the error message returned by the backend
      } else {
        setError(
          "An error occurred during password reset. Please try again or contact support."
        ); // Set generic error message
      }
    }
  };

  if (tokenValid === null) {
    return <p>Validating...</p>;
  }

  if (!tokenValid) {
    return (
      <p>Invalid or expired token. Please contact support or try again.</p>
    );
  }

  return (
    <div style={{ overflow: "auto", height: "125vh" }}>
      <div className="mt-5 create-account-container">
        <Card className="p-4">
          <Card.Body>
            <Card.Title className="text-center mb-4 create-account-title">
              Reset Password
            </Card.Title>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Form.Group as={Col} controlId="username">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your email"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="custom-input"
                    readOnly // Make the username read-only since it comes from the token
                  />
                </Form.Group>
              </Row>

              <Row className="mb-3">
                <Form.Group as={Col} controlId="password">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your new password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="custom-input"
                  />
                </Form.Group>
              </Row>

              <Row className="mb-3">
                <Form.Group as={Col} controlId="confirmPassword">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Confirm your new password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="custom-input"
                  />
                </Form.Group>
              </Row>

              <Button
                variant="primary"
                type="submit"
                className="custom-button"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save New Password"}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
