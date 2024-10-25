import React from "react";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import Tooltip from "@mui/material/Tooltip";
import axios from "axios";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";

const FolderLogic = ({
  tokenRef,
  setAvailableCollections,
  setFolderContents,
  availableCollections,
  folderContents
}) => {
  const get_collections = () => {
    axios
      .post(
        `http${HTTP_PREFIX}://${API_URL}/get_collections`,
        {},
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`
          }
        }
      )
      .then((res) => {
        setAvailableCollections(res.data.collections || []);
      })
      .catch((error) => {
        console.error("Error fetching collections:", error);
      });
  };

  React.useEffect(() => {
    get_collections();
  }, []);

  const addNewFolder = async (folderName) => {
    try {
      await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/add_folder`,
        { folder_name: folderName },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`
          }
        }
      );
      get_collections(); // Refresh the list of collections
    } catch (error) {
      console.error("Error adding new folder:", error);
    }
  };

  const handleAddNewFolderClick = () => {
    const newFolderName = window.prompt("Enter the name for the new folder:");
    if (newFolderName) {
      addNewFolder(newFolderName);
    }
  };

  const fetchFolderFilenames = async (folderName) => {
    try {
      const response = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/get_folder_filenames`,
        { collection_name: folderName },
        { headers: { Authorization: `Bearer ${tokenRef.current}` } }
      );

      setFolderContents({ ...folderContents, [folderName]: response.data });
    } catch (error) {
      console.error("Error fetching folder filenames:", error);
    }
  };

  return (
    <div className="dataset-folders">
      {availableCollections.map((collection, index) => (
        <Tooltip
          key={index}
          title={
            Array.isArray(folderContents[collection])
              ? folderContents[collection].join("\n")
              : ""
          }
          onOpen={() => fetchFolderFilenames(collection)}
        >
          <div className="dataset-folder">
            <CreateNewFolderIcon />
            <span>{collection}</span>
          </div>
        </Tooltip>
      ))}
      <div
        className="dataset-folder add-new-folder"
        onClick={handleAddNewFolderClick}
      >
        <span>Add Folder</span>
      </div>
    </div>
  );
};

export default FolderLogic;
