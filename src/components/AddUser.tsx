import axios from "axios";
import "bootstrap/dist/css/bootstrap.css";
import { useRef, useState } from "react";
import { useAuthHeader, useAuthUser } from "react-auth-kit";
import {
  API_URL,
  HTTP_PREFIX,
} from "../helper/Constants";
import withAuthAdmin from "../routes/withAuthAdmin";
import "./AdminPannel.css";

interface IAttributesConfig {
  login: string;
  password: string;
}

const defaultAttributesConfig: IAttributesConfig = {
  login: "",
  password: "",
};

const AddUser = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  const email = auth?.email || "default";

  const getAuthHeader = useAuthHeader();
  const authHeader = getAuthHeader();
  // console.log(authHeader);  // Outputs: 'Bearer your_token_here'

  const [data, setData] = useState<IAttributesConfig>(defaultAttributesConfig);

  // Function to display Bootstrap alerts
  const displayAlert = (message, type) => {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} fixed-bottom text-center mb-0 rounded-0`;
    alertDiv.innerHTML = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
  };

  const handleChange = (attr: keyof IAttributesConfig, value: any) => {
    setData((prevConfig) => ({ ...prevConfig, [attr]: value }));
  };

  const saveUser = () => {
    if (!/^[a-zA-Z0-9@]{3,}$/.test(data.login)) {
      displayAlert(
        "Enter a username name under which to save the configuration. Min 3 characters and only alphanumberic or email",
        "danger"
      );
      return;
    }

    if (!data.password) {
      displayAlert(
        "Enter a password name under which to save the configuration",
        "danger"
      );
      return;
    }
    console.log({ login: "nd", password: "nd" });
    axios
      .post(
        `http${HTTP_PREFIX}://${API_URL}/add_user`,
        { generic_dict: data },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }
      )

      .then((response) => {
        // console.log("Response from server:", response.data);
        displayAlert("User successfully saved", "success");
      })
      .catch((error) => {
        console.error("Error saving user:", error);
        displayAlert("Failed to save user", "danger");
      });
  };

  // Render
  return (
    <div className="strategy-form">
      <h2>Add User</h2>

      {/* username Name */}
      <div className="strategy-name">
        <label>Username:</label>
        <input
          type="text"
          value={data.login}
          onChange={(e) => handleChange("login", e.target.value)}
        />
      </div>
      <div className="strategy-name">
        <label>Password:</label>
        <input
          type="text"
          value={data.password}
          onChange={(e) => handleChange("password", e.target.value)}
        />
      </div>

      {/* Submit button */}
      <div className="submit-btn">
        <button onClick={saveUser}>Add new user</button>{" "}
        {/* Invoke saveStrategy when clicked */}
      </div>
    </div>
  );
};

export default withAuthAdmin(AddUser);
