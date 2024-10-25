import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useAuthUser } from "react-auth-kit";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import "./Log.css";

const FLog = () => {
  const [logs, setLogs] = useState([]);
  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true); // Start loading
      try {
        const response = await axios.post(
          `http${HTTP_PREFIX}://${API_URL}/get_feedback/`,
          {},
          {
            headers: {
              Authorization: `Bearer ${tokenRef.current}`
            }
          }
        );

        if (response.data && response.data.length > 0) {
          setLogs(response.data);
          setColumns(Object.keys(response.data[0]));
        }
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setIsLoading(false); // Stop loading whether success or error
      }
    };

    fetchLogs();
  }, []);

  const handleDelete = async (entryId) => {
    // Confirmation pop-up
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        // Using FormData to send data
        const formData = new FormData();
        formData.append("entry_id", entryId);

        await axios.post(
          `http${HTTP_PREFIX}://${API_URL}/delete_feedback`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${tokenRef.current}`,
              "Content-Type": "multipart/form-data" // This header is important for FormData
            }
          }
        );

        // Remove the deleted log from the state
        setLogs(logs.filter((log) => log._id !== entryId));
      } catch (error) {
        console.error("Error deleting log:", error);
      }
    }
  };

  return (
    <div className="log-table">
      {isLoading ? (
        <div className="loading-spinner">Loading...</div> // Display loading spinner
      ) : (
        <table>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index}>{column}</th>
              ))}
              <th>Delete</th> {/* Header for delete actions */}
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index}>
                {columns.map((column, cellIndex) => (
                  <td key={cellIndex}>{log[column]}</td>
                ))}
                <td>
                  {/* <button onClick={() => handleDelete(log._id)}>X</button>{" "} */}
                  {/* Delete button */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default FLog;
