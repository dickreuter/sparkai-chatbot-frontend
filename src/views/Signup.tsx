import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Form, Button, Row, Col, Card, Alert } from 'react-bootstrap';
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import "./Signup.css";

const Signup = () => {
  const [tokenValid, setTokenValid] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    company: '',
    jobRole: '',
    email: '',
    region: '',
    subscriptionType: '',
  });
  const [error, setError] = useState(null);
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await axios.post(`http${HTTP_PREFIX}://${API_URL}/validate_signup_token`, { token });
        if (response.data.valid) {
          setTokenValid(true);
          setFormData(prevFormData => ({
            ...prevFormData,
            email: response.data.email || '',
            region: response.data.region || '',
            subscriptionType: response.data.product_name || '',
          }));
        } else {
          setTokenValid(false);
        }
      } catch (error) {
        console.error('Error validating token:', error);
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
    setError(null);  // Clear previous errors
    if (!tokenValid) return;

    try {
      const response = await axios.post(`http${HTTP_PREFIX}://${API_URL}/update_user_details`, { ...formData, token });
      console.log('Signup successful:', response.data);
      window.location.href = '/login';  // Redirect to the login page
    } catch (error) {
      console.error('Error during signup:', error);
      if (error.response && error.response.data) {
        setError(error.response.data.detail);  // Show the error message returned by the backend
      } else {
        setError('An error occurred during signup. Please try again or contact support.');  // Set generic error message
      }
    }
  };

  if (tokenValid === null) {
    return <p>Validating...</p>;
  }

  if (!tokenValid) {
    return <p>Invalid or expired token. Please contact support or try again.</p>;
  }

  return (
    <div style={{ overflow: "auto", height: "100vh" }}>
      <div className="mt-5 create-account-container">
        <Card className="p-4">
          <Card.Body>
            <Card.Title className="text-center mb-4 create-account-title">Create Account</Card.Title>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Form.Group as={Col} controlId="username">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="custom-input"
                  />
                </Form.Group>
              </Row>

              <Row className="mb-3">
                <Form.Group as={Col} controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="custom-input"
                  />
                </Form.Group>
              </Row>

              <Row className="mb-3">
                <Form.Group as={Col} controlId="company">
                  <Form.Label>Company</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="custom-input"
                  />
                </Form.Group>
              </Row>

              <Row className="mb-3">
                <Form.Group as={Col} controlId="jobRole">
                  <Form.Label>Job Role</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your job role"
                    name="jobRole"
                    value={formData.jobRole}
                    onChange={handleChange}
                    className="custom-input"
                  />
                </Form.Group>
              </Row>

              <Row className="mb-3">
                <Form.Group as={Col} controlId="email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter your email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}  // Allow user to modify email if needed
                    defaultValue={formData.email}  // Display the default email from the token validation response
                    className="custom-input"
                  />
                </Form.Group>
              </Row>

              <Row className="mb-3">
                <Form.Group as={Col} controlId="region">
                  <Form.Label>Region</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Region"
                    name="region"
                    value={formData.region}
                    readOnly
                    className="custom-input"
                  />
                </Form.Group>
              </Row>

              <Row className="mb-3">
                <Form.Group as={Col} controlId="subscriptionType">
                  <Form.Label>Subscription Type</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Subscription Type"
                    name="subscriptionType"
                    value={formData.subscriptionType}
                    readOnly
                    className="custom-input"
                  />
                </Form.Group>
              </Row>

              <Button variant="primary" type="submit" className="custom-button">
                Save all
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
