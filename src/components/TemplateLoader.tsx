// TemplateLoader.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Dropdown } from "react-bootstrap";
import { API_URL, HTTP_PREFIX } from "../helper/Constants.tsx";

const TemplateLoader = ({ token, handleSelect }) => {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    axios
      .post(
        `http${HTTP_PREFIX}://${API_URL}/get_templates_for_user`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      .then((res) => {
        setTemplates(res.data.templates || []);
      })
      .catch((error) => {
        console.error("Error fetching templates:", error);
      });
  }, [token]);

  return (
    <Dropdown onSelect={handleSelect}>
      <Dropdown.Toggle
        className="upload-button"
        style={{ backgroundColor: "orange", color: "black" }}
        id="dropdown-basic"
      >
        Select Template
      </Dropdown.Toggle>

      <Dropdown.Menu>
        {templates.map((template, index) => (
          <Dropdown.Item key={index} eventKey={template.text}>
            {template.profile_name}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default TemplateLoader;
