import axios from "axios";
import "bootstrap/dist/css/bootstrap.css";
import { useEffect, useRef, useState } from "react";
import { useAuthHeader, useAuthUser } from "react-auth-kit";
import {
  API_URL,
  HTTP_PREFIX
} from "../helper/Constants";
import withAuthAdmin from "../routes/withAuthAdmin";
import "./AdminPannel.css";

interface IAttributesConfig {
  active: string;
  login: string;
  password: string;
  prompt1: string;
  prompt2: string;
  prompt3: string;
  selectedModelType: string;
}

const defaultAttributesConfig: IAttributesConfig = {
  active: "On",
  selectedModelType: "GPT-4",
};

const AdminPannel = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");
  const email = auth?.email || "default";

  const getAuthHeader = useAuthHeader();
  const authHeader = getAuthHeader();
  // console.log(authHeader);  // Outputs: 'Bearer your_token_here'

  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [data, setData] = useState<IAttributesConfig>(defaultAttributesConfig);

  // Function to display Bootstrap alerts
  const displayAlert = (message, type) => {
    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert-${type} fixed-bottom text-center mb-0 rounded-0`;
    alertDiv.innerHTML = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
  };

  const saveUser = () => {
    console.log(data);
    axios
      .post(
        `http${HTTP_PREFIX}://${API_URL}/save_user`,
        { generic_dict: data },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }
      )

      .then((response) => {
        // console.log("Response from server:", response.data);
        load_available_users();
        loadUser(data.login);
        displayAlert("User successfully saved", "success");
      })
      .catch((error) => {
        console.error("Error saving user:", error);
        displayAlert("Failed to save user", "danger");
      });
  };

  const load_available_users = () => {
    axios
      .post(
        `http${HTTP_PREFIX}://${API_URL}/get_users`,
        {},
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }
      )
      .then((res) => {
        setAvailableUsers(res.data.users || []);
        // console.log('Available users:', res.data.users);
        setData(defaultAttributesConfig);
      })
      .catch((error) => {
        console.error("Error fetching strategies:", error);
      });
  };

  useEffect(() => {
    load_available_users();
  }, []);

  const loadUser = (strat) => {
    const userToLoad = typeof strat === "string" ? strat : selectedUser;
    setSelectedUser(userToLoad);
    // console.log("Loading Strategy:", strategyToLoad);  // Debug log

    // Initialize data with defaultAttributesConfig
    setData(defaultAttributesConfig);

    axios
      .post(
        `http${HTTP_PREFIX}://${API_URL}/load_user`,
        { username: userToLoad },
        { headers: { Authorization: `Bearer ${tokenRef.current}` } }
      )

      .then((res) => {
        // Merge the default attributes with the loaded strategy data
        const mergedData = { ...defaultAttributesConfig, ...res.data };

        // Update the state to re-render your component
        setData(mergedData);
      })
      .catch((error) => {
        console.error("Error loading user:", error);
        displayAlert("Failed to load user", "danger");
      });
  };

  const deleteUser = () => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setSelectedUser(selectedUser);

      axios
        .post(
          `http://${API_URL}/delete_user`,
          { username: selectedUser },
          {
            headers: {
              Authorization: `Bearer ${tokenRef.current}`,
            },
          }
        )
        .then((res) => {
          setAvailableUsers([]);
          load_available_users();
          displayAlert("Strategy successfully deleted", "success");
        })
        .catch((error) => {
          console.error("Error loading strategy:", error);
          displayAlert("Failed to load strategy", "danger");
        });
    } else {
      displayAlert("User deletion cancelled", "warning");
    }
  };

  const handleChange = (attr: keyof IAttributesConfig, value: any) => {
    setData((prevConfig) => ({ ...prevConfig, [attr]: value }));
  };

  // Render
  return (
    <div className="strategy-form">
      <h2>User Configuration</h2>

      {/* Load existing strategy */}
      <div className="selections-box">
        <label>Select User:</label>
        <div className="selections">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="" disabled>
              Select a user
            </option>{" "}
            {/* This option is added */}
            {availableUsers.map((strategy) => (
              <option key={strategy} value={strategy}>
                {strategy}
              </option>
            ))}
          </select>
          <button onClick={loadUser}>Load</button>
          <button
            style={{ backgroundColor: "red", color: "white" }}
            onClick={deleteUser}
          >
            Del
          </button>
        </div>
      </div>

      {/* username Name
      <div className="strategy-name">
        <label>Update / Create User:</label>
        <input type="text" value={data.login} onChange={(e) => handleChange('login', e.target.value)} />
      </div> */}

      {/* status */}
      <div className="selection-box d-flex">
        <label>User status:</label>
        <div className="selections">
          <select
            value={data.active}
            onChange={(e) => handleChange("active", e.target.value)}
          >
            <option value="off">Active</option>
          </select>
        </div>
      </div>

      {/* Model selection */}
      <label>Select LLM Model</label>
      <div className="sport-type">
        <select
          value={data.selectedModelType}
          onChange={(e) => handleChange("selectedModelType", e.target.value)}
        >
          <option value="gpt-3.5-turbo-16k">gpt-3.5-turbo-16k (£0.02 / request)</option>
          <option value="gpt-4-1106-preview">gpt-4-1106-preview-128k (£0.50 / request)</option>
        </select>
      </div>

      <div className="login">
        <label>login:</label>
        <input
          rows="5"
          disabled
          value={data.login}
          onChange={(e) => handleChange("login", e.target.value)}
        />
      </div>

      <div className="login">
        <label>Password:</label>
        <input
          value={data.password}
          disabled
          type="password"
          onChange={(e) => handleChange("password", e.target.value)}
        />
      </div>

      <div className="prompt">
        <label>Prompt1: (Copilot)</label>
        <textarea
          value={data.prompt1}
          onChange={(e) => handleChange("prompt1", e.target.value)}
        />
      </div>
      <div className="prompt">
        <label>Prompt2 (Q/A pairs) </label>
        <textarea
          value={data.prompt2}
          onChange={(e) => handleChange("prompt2", e.target.value)}
        />
      </div>
      <div className="prompt">
        <label>Prompt3 (PDF/Text Questioning)</label>
        <textarea
          value={data.prompt3}
          onChange={(e) => handleChange("prompt3", e.target.value)}
        />
      </div>

      {/* Submit button */}
      <div className="submit-btn">
        <button onClick={saveUser}>Save</button>{" "}
        {/* Invoke saveStrategy when clicked */}
      </div>
    </div>
  );
};

export default withAuthAdmin(AdminPannel);
