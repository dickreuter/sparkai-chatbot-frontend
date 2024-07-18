import React, { useState, useEffect } from "react";
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import SideBarSmall from '../routes/SidebarSmall.tsx';
import { Form, Button, Row, Col } from 'react-bootstrap';
import './Profile.css';

const ProfilePage = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthday: '',
    gender: '',
    email: '',
    phone: '',
    address: '',
    number: '',
    city: '',
    state: '',
    zip: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log(formData);
  };

  return (
    <div className="chatpage">
      <SideBarSmall />
      <div className="lib-container">
        <h1 className="heavy mb-3">Profile</h1>
        <div className="card-effect-category ">
              <Form onSubmit={handleSubmit}>
               
                <Row className="profile-form-row">
                  <Col>
                    <Form.Group controlId="formFirstName">
                      <Form.Label className="profile-form-label">First Name</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Enter your first name" 
                        name="firstName" 
                        value={formData.firstName} 
                        onChange={handleChange} 
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group controlId="formLastName">
                      <Form.Label className="profile-form-label">Last Name</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Also your last name" 
                        name="lastName" 
                        value={formData.lastName} 
                        onChange={handleChange} 
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="profile-form-row">
                <Col>
                    <Form.Group controlId="formCompany">
                      <Form.Label className="profile-form-label">Company</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Enter your company" 
                        name="company" 
                        value={formData.company} 
                        onChange={handleChange} 
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                  <Form.Group controlId="formJobRole">
                      <Form.Label className="profile-form-label">Job Role</Form.Label>
                      <Form.Control 
                        type="text" 
                        placeholder="Enter your job role" 
                        name="jobRole" 
                        value={formData.jobRole} 
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row className="profile-form-row">
                  <Col>
                  <Form.Group controlId="formEmail">
                      <Form.Label className="profile-form-label">Email</Form.Label>
                      <Form.Control 
                        type="email" 
                        placeholder="name@company.com" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                  <Form.Group controlId="formBirthday">
                      <Form.Label className="profile-form-label">Birthday</Form.Label>
                      <Form.Control 
                        type="date" 
                        placeholder="dd/mm/yyyy" 
                        name="birthday" 
                        value={formData.birthday} 
                        onChange={handleChange} 
                      />
                    </Form.Group>
                  </Col>
                </Row>
              
                <Button className="upload-button " type="submit">
                  Save all
                </Button>
              </Form>
        </div>
      </div>
    </div>
  );
}

export default withAuth(ProfilePage);
