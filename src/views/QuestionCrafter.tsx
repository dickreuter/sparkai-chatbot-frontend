import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from "../helper/Constants";
import axios from "axios";
import withAuth from "../routes/withAuth";
import { useAuthUser } from "react-auth-kit";
import SideBarSmall from "../routes/SidebarSmall.tsx";
import handleGAEvent from "../utilities/handleGAEvent";
import {
  Button,
  Col,
  Dropdown,
  Form,
  Modal,
  Row,
  Spinner
} from "react-bootstrap";
import BidNavbar from "../routes/BidNavbar.tsx";
import "./QuestionsCrafter.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faChevronLeft,
  faChevronRight,
  faPaperPlane
} from "@fortawesome/free-solid-svg-icons";
import FolderLogic from "../components/Folders.tsx";
import {
  Editor,
  EditorState,
  Modifier,
  SelectionState,
  convertToRaw,
  ContentState,
  RichUtils
} from "draft-js";
import "draft-js/dist/Draft.css";
import { BidContext } from "./BidWritingStateManagerView.tsx";
import { displayAlert } from "../helper/Alert.tsx";
import QuestionCrafterWizard from "../wizards/QuestionCrafterWizard.tsx";
import SelectFolder from "../components/SelectFolder.tsx";
import SelectFolderModal from "../components/SelectFolderModal.tsx";
import SaveQASheet from "../modals/SaveQASheet.tsx";

const QuestionCrafter = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const { sharedState, setSharedState, getBackgroundInfo } =
    useContext(BidContext);
  const { contributors } = sharedState;

  const backgroundInfo = getBackgroundInfo();

  const [dataset, setDataset] = useState("default");
  const [availableCollections, setAvailableCollections] = useState([]);
  const [folderContents, setFolderContents] = useState({});
  const [isAppended, setIsAppended] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState("-1");

  const [isCopilotVisible, setIsCopilotVisible] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [tempText, setTempText] = useState("");
  const [copilotOptions, setCopilotOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [copilotLoading, setCopilotLoading] = useState(false);

  const [inputText, setInputText] = useState(
    localStorage.getItem("inputText") || ""
  );
  const [responseEditorState, setResponseEditorState] = useState(
    EditorState.createWithContent(
      ContentState.createFromText(localStorage.getItem("response") || "")
    )
  );
  const [contentLoaded, setContentLoaded] = useState(true); // Set to true initially
  const [selectionRange, setSelectionRange] = useState({
    start: null,
    end: null
  });

  const responseBoxRef = useRef(null); // Ref for the response box
  const promptsContainerRef = useRef(null); // Ref for the prompts container
  const editorRef = useRef(null);

  const [selectedDropdownOption, setSelectedDropdownOption] =
    useState("library-chat");
  const bidPilotRef = useRef(null);

  const [selectedDocument, setSelectedDocument] = useState(null); // Default to the first document

  const currentUserPermission = contributors[auth.email] || "viewer"; // Default to 'viewer' if not found
  const canUserEdit =
    currentUserPermission === "admin" || currentUserPermission === "editor";

  const [selectedFolders, setSelectedFolders] = useState(["default"]);

  const handleSaveSelectedFolders = (folders) => {
    console.log("Received folders in parent:", folders);
    setSelectedFolders(folders);
  };
  useEffect(() => {
    console.log(
      "selectedFolders state in QuestionCrafter updated:",
      selectedFolders
    );
  }, [selectedFolders]);

  useEffect(() => {
    localStorage.setItem(
      "response",
      convertToRaw(responseEditorState.getCurrentContent())
        .blocks.map((block) => block.text)
        .join("\n")
    );
  }, [responseEditorState]);

  const styleMap = {
    ORANGE: {
      backgroundColor: "orange"
    }
  };

  const handleClearMessages = () => {
    setMessages([
      {
        type: "bot",
        text: "Welcome to Bid Pilot! Ask questions about your company library data or search the internet for up to date information. Select text in the response box to use copilot and refine the response."
      }
    ]);
    localStorage.removeItem("messages");

    setIsCopilotVisible(false);

    if (showOptions == true) {
      resetEditorState();
    }
    setShowOptions(false);
  };

  const askCopilot = async (copilotInput, instructions, copilot_mode) => {
    setQuestionAsked(true);
    localStorage.setItem("questionAsked", "true");
    handleGAEvent("Chatbot", "Copilot Input", copilotInput);
    setCopilotLoading(true);
    setStartTime(Date.now()); // Set start time for the timer

    try {
      const requests = [
        axios.post(
          `http${HTTP_PREFIX}://${API_URL}/copilot`,
          {
            input_text: copilotInput,
            extra_instructions: instructions,
            copilot_mode: copilot_mode,
            datasets: [],
            bid_id: sharedState.object_id
          },
          {
            headers: {
              Authorization: `Bearer ${tokenRef.current}`
            }
          }
        )
      ];

      const results = await Promise.all(requests);
      const options = results.map((result) => result.data);
      setCopilotOptions(options);
    } catch (error) {
      console.error("Error sending question:", error);
    }
    setCopilotLoading(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      console.log("click outside");
      if (
        responseBoxRef.current &&
        promptsContainerRef.current &&
        bidPilotRef.current &&
        !responseBoxRef.current.contains(event.target) &&
        !promptsContainerRef.current.contains(event.target) &&
        !bidPilotRef.current.contains(event.target)
      ) {
        setIsCopilotVisible(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showOptions, isCopilotVisible]);

  const optionsContainerRef = useRef(null); // Ref for the options container

  const [originalEditorState, setOriginalEditorState] =
    useState(responseEditorState);

  const resetEditorState = () => {
    const contentState = originalEditorState.getCurrentContent();
    const blocks = contentState.getBlockMap();

    let newContentState = contentState;

    // Remove ORANGE style from all blocks
    blocks.forEach((block) => {
      const blockKey = block.getKey();
      const length = block.getLength();
      const blockSelection = SelectionState.createEmpty(blockKey).merge({
        anchorOffset: 0,
        focusOffset: length
      });

      newContentState = Modifier.removeInlineStyle(
        newContentState,
        blockSelection,
        "ORANGE"
      );
    });

    const newEditorState = EditorState.createWithContent(newContentState);
    setResponseEditorState(newEditorState);
    setIsCopilotVisible(false);
    setSelectedText("");
  };

  //only hide options if show Options equals true and the user clicks somewhere else in the response box. So clicking on an option and the selected text changing should not trigger this
  useEffect(() => {
    const handleClickOutsideOptions = (event) => {
      if (
        responseBoxRef.current &&
        optionsContainerRef.current &&
        responseBoxRef.current.contains(event.target) &&
        !optionsContainerRef.current.contains(event.target) &&
        showOptions
      ) {
        setShowOptions(false);
        // Clear the orange style and reset the text
        resetEditorState();
      }
    };

    document.addEventListener("click", handleClickOutsideOptions);
    return () => {
      document.removeEventListener("click", handleClickOutsideOptions);
    };
  }, [showOptions, responseEditorState]);

  const handleTick = () => {
    const contentState = responseEditorState.getCurrentContent();
    const blocks = contentState.getBlockMap();

    let newContentState = contentState;

    // Remove ORANGE style from all blocks
    blocks.forEach((block) => {
      const blockKey = block.getKey();
      const length = block.getLength();
      const blockSelection = SelectionState.createEmpty(blockKey).merge({
        anchorOffset: 0,
        focusOffset: length
      });

      newContentState = Modifier.removeInlineStyle(
        newContentState,
        blockSelection,
        "ORANGE"
      );
    });

    let newEditorState = EditorState.push(
      responseEditorState,
      newContentState,
      "change-inline-style"
    );

    // Clear the selection
    const firstBlockKey = newEditorState
      .getCurrentContent()
      .getFirstBlock()
      .getKey();
    const emptySelection = SelectionState.createEmpty(firstBlockKey);
    newEditorState = EditorState.forceSelection(newEditorState, emptySelection);

    setResponseEditorState(newEditorState);
    setShowOptions(false);
    setIsCopilotVisible(false);
    setSelectedText("");
    setSelectedOptionIndex(null);

    console.log("handleTick - clearedText");
  };

  const handleEditorChange = (editorState) => {
    const selectionState = editorState.getSelection();
    const currentContent = editorState.getCurrentContent();
    const anchorKey = selectionState.getAnchorKey();
    const focusKey = selectionState.getFocusKey();
    const anchorOffset = selectionState.getAnchorOffset();
    const focusOffset = selectionState.getFocusOffset();
    const isBackward = selectionState.getIsBackward();

    const startKey = isBackward ? focusKey : anchorKey;
    const endKey = isBackward ? anchorKey : focusKey;
    const startOffset = isBackward ? focusOffset : anchorOffset;
    const endOffset = isBackward ? anchorOffset : focusOffset;

    const startBlock = currentContent.getBlockForKey(startKey);
    const endBlock = currentContent.getBlockForKey(endKey);

    let selectedText = "";

    if (startBlock === endBlock) {
      selectedText = startBlock.getText().slice(startOffset, endOffset);
    } else {
      const startText = startBlock.getText().slice(startOffset);
      const endText = endBlock.getText().slice(0, endOffset);
      const middleText = currentContent
        .getBlockMap()
        .skipUntil((block) => block.getKey() === startKey)
        .skip(1)
        .takeUntil((block) => block.getKey() === endKey)
        .map((block) => block.getText())
        .join("\n");

      selectedText = [startText, middleText, endText]
        .filter(Boolean)
        .join("\n");
    }

    console.log("handleEditorChange - selectedText:", selectedText);

    setSelectedText(selectedText);
    setSelectionRange({
      anchorKey: selectionState.getAnchorKey(),
      anchorOffset: selectionState.getAnchorOffset(),
      focusKey: selectionState.getFocusKey(),
      focusOffset: selectionState.getFocusOffset()
    });

    setResponseEditorState(editorState); // Always update the state
  };

  useEffect(() => {
    if (selectedText.trim() && selectedText.trim().length > 0) {
      // added extra check because sometimes an empty string would be passed to the copilot
      console.log(selectedText);
      setIsCopilotVisible(true);
    } else {
      setIsCopilotVisible(false);
    }
  }, [selectedText, responseEditorState]);

  // Dummy state to force re-render of the editor component
  const [dummyState, setDummyState] = useState(false);

  const [highlightedRange, setHighlightedRange] = useState(null);

  const handleLinkClick = (linkName) => (e) => {
    e.preventDefault();
    const copilot_mode = linkName.toLowerCase().replace(/\s+/g, "_");
    const instructions = "";

    setOriginalEditorState(responseEditorState);

    const contentState = responseEditorState.getCurrentContent();
    const selection = responseEditorState.getSelection();
    const startKey = selection.getStartKey();
    const endKey = selection.getEndKey();
    const startOffset = selection.getStartOffset();
    const endOffset = selection.getEndOffset();

    let newContentState = contentState;

    // Store the highlighted range
    setHighlightedRange({
      startKey,
      endKey,
      startOffset,
      endOffset
    });

    // Apply ORANGE style (rest of the function remains the same)
    if (startKey === endKey) {
      const blockSelection = SelectionState.createEmpty(startKey).merge({
        anchorOffset: startOffset,
        focusOffset: endOffset
      });
      newContentState = Modifier.applyInlineStyle(
        newContentState,
        blockSelection,
        "ORANGE"
      );
    } else {
      // If the selection spans multiple blocks
      const blocks = contentState.getBlockMap();
      let isWithinSelection = false;

      newContentState = blocks.reduce((updatedContent, block, blockKey) => {
        if (blockKey === startKey) {
          isWithinSelection = true;
          const blockSelection = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: startOffset,
            focusOffset: block.getLength()
          });
          return Modifier.applyInlineStyle(
            updatedContent,
            blockSelection,
            "ORANGE"
          );
        } else if (blockKey === endKey) {
          isWithinSelection = false;
          const blockSelection = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: 0,
            focusOffset: endOffset
          });
          return Modifier.applyInlineStyle(
            updatedContent,
            blockSelection,
            "ORANGE"
          );
        } else if (isWithinSelection) {
          const blockSelection = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: 0,
            focusOffset: block.getLength()
          });
          return Modifier.applyInlineStyle(
            updatedContent,
            blockSelection,
            "ORANGE"
          );
        }
        return updatedContent;
      }, newContentState);
    }

    let newEditorState = EditorState.push(
      responseEditorState,
      newContentState,
      "change-inline-style"
    );
    newEditorState = EditorState.forceSelection(newEditorState, selection);

    setResponseEditorState(newEditorState);

    setTimeout(() => {
      askCopilot(selectedText, instructions, "1" + copilot_mode);
      setShowOptions(true);
      setIsCopilotVisible(false);
    }, 0);
  };

  const handleOptionSelect = (option, index) => {
    console.log("handleOptionSelect called", {
      option,
      index,
      highlightedRange
    });
    if (!highlightedRange) {
      console.log("No highlighted range, exiting");
      return;
    }

    const contentState = responseEditorState.getCurrentContent();
    const { startKey, endKey, startOffset, endOffset } = highlightedRange;

    console.log("Creating highlight selection", {
      startKey,
      endKey,
      startOffset,
      endOffset
    });
    const highlightSelection = SelectionState.createEmpty(startKey).merge({
      anchorOffset: startOffset,
      focusKey: endKey,
      focusOffset: endOffset
    });

    console.log("Removing highlighted text");
    let newContentState = Modifier.removeRange(
      contentState,
      highlightSelection,
      "backward"
    );

    console.log("Inserting new option text");
    newContentState = Modifier.insertText(
      newContentState,
      highlightSelection.merge({
        focusKey: startKey,
        focusOffset: startOffset
      }),
      option
    );

    console.log("Applying ORANGE style to new text");
    const styledSelection = SelectionState.createEmpty(startKey).merge({
      anchorOffset: startOffset,
      focusOffset: startOffset + option.length
    });
    newContentState = Modifier.applyInlineStyle(
      newContentState,
      styledSelection,
      "ORANGE"
    );

    console.log("Creating new editor state");
    let newEditorState = EditorState.push(
      responseEditorState,
      newContentState,
      "insert-fragment"
    );
    newEditorState = EditorState.forceSelection(
      newEditorState,
      styledSelection
    );

    console.log("Setting new editor state");
    setResponseEditorState(newEditorState);
    setTempText(option);
    setSelectedOption(option);
    setSelectedOptionIndex(index);
    setShowOptions(true);

    console.log("Clearing highlighted range");
    setHighlightedRange(null);

    setDummyState((prev) => !prev);
  };

  const handleCustomPromptFocus = () => {
    console.log("handleCustomPromptFocus called");
    setOriginalEditorState(responseEditorState);

    const contentState = responseEditorState.getCurrentContent();
    const selection = responseEditorState.getSelection();
    const startKey = selection.getStartKey();
    const endKey = selection.getEndKey();
    const startOffset = selection.getStartOffset();
    const endOffset = selection.getEndOffset();

    console.log("Current selection", {
      isCollapsed: selection.isCollapsed(),
      startKey,
      endKey,
      startOffset,
      endOffset
    });

    // Always set the highlighted range, even if the selection is collapsed
    setHighlightedRange({
      startKey,
      endKey,
      startOffset,
      endOffset
    });

    let newContentState = contentState;

    // Apply ORANGE style
    if (startKey === endKey) {
      const blockSelection = SelectionState.createEmpty(startKey).merge({
        anchorOffset: startOffset,
        focusOffset: endOffset
      });
      newContentState = Modifier.applyInlineStyle(
        newContentState,
        blockSelection,
        "ORANGE"
      );
    } else {
      // If the selection spans multiple blocks
      const blocks = contentState.getBlockMap();
      let isWithinSelection = false;

      newContentState = blocks.reduce((updatedContent, block, blockKey) => {
        if (blockKey === startKey) {
          isWithinSelection = true;
          const blockSelection = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: startOffset,
            focusOffset: block.getLength()
          });
          return Modifier.applyInlineStyle(
            updatedContent,
            blockSelection,
            "ORANGE"
          );
        } else if (blockKey === endKey) {
          isWithinSelection = false;
          const blockSelection = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: 0,
            focusOffset: endOffset
          });
          return Modifier.applyInlineStyle(
            updatedContent,
            blockSelection,
            "ORANGE"
          );
        } else if (isWithinSelection) {
          const blockSelection = SelectionState.createEmpty(blockKey).merge({
            anchorOffset: 0,
            focusOffset: block.getLength()
          });
          return Modifier.applyInlineStyle(
            updatedContent,
            blockSelection,
            "ORANGE"
          );
        }
        return updatedContent;
      }, newContentState);
    }

    console.log("Applying ORANGE style");
    const newEditorState = EditorState.push(
      responseEditorState,
      newContentState,
      "change-inline-style"
    );
    setResponseEditorState(newEditorState);

    console.log("Set highlighted range", {
      startKey,
      endKey,
      startOffset,
      endOffset
    });
  };

  let isSubmitButtonClicked = false;

  const handleMouseDownOnSubmit = () => {
    isSubmitButtonClicked = true;
  };

  const handleCustomPromptBlur = () => {
    if (!isSubmitButtonClicked) {
      const contentState = responseEditorState.getCurrentContent();
      const blocks = contentState.getBlockMap();

      // Remove ORANGE style from all blocks
      let newContentState = contentState;
      blocks.forEach((block) => {
        const blockKey = block.getKey();
        const length = block.getLength();
        const blockSelection = SelectionState.createEmpty(blockKey).merge({
          anchorOffset: 0,
          focusOffset: length
        });

        newContentState = Modifier.removeInlineStyle(
          newContentState,
          blockSelection,
          "ORANGE"
        );
      });

      const newEditorState = EditorState.push(
        responseEditorState,
        newContentState,
        "change-inline-style"
      );
      setResponseEditorState(newEditorState);

      // Clear the highlighted range
      //setHighlightedRange(null);
    }
    isSubmitButtonClicked = false; // Reset flag after handling
  };

  const handleCustomPromptSubmit = () => {
    console.log("handleCustomPromptSubmit called", {
      inputValue: inputValue.trim()
    });
    if (inputValue.trim()) {
      isSubmitButtonClicked = true;

      const copilot_mode = inputValue.toLowerCase().replace(/\s+/g, "_");
      const instructions = "";

      const contentState = responseEditorState.getCurrentContent();

      let selectedText;
      if (highlightedRange) {
        const { startKey, endKey, startOffset, endOffset } = highlightedRange;
        console.log("Using highlighted range", {
          startKey,
          endKey,
          startOffset,
          endOffset
        });

        selectedText = getTextFromRange(responseEditorState, highlightedRange);
      } else {
        console.log("No highlighted range, using full content");
        selectedText = contentState.getPlainText();
      }

      console.log("Selected text", { selectedText });

      setTimeout(() => {
        console.log("Calling askCopilot");
        askCopilot(selectedText, instructions, "4" + copilot_mode);
        setShowOptions(true);
        setSelectedDropdownOption("internet-search");
      }, 0);

      setInputValue("");
      setIsCopilotVisible(false);
    }
  };

  // Helper function to get text from a range
  const getTextFromRange = (editorState, range) => {
    const contentState = editorState.getCurrentContent();
    const startBlock = contentState.getBlockForKey(range.startKey);
    const endBlock = contentState.getBlockForKey(range.endKey);
    let text = "";

    if (startBlock === endBlock) {
      text = startBlock.getText().slice(range.startOffset, range.endOffset);
    } else {
      const blockMap = contentState.getBlockMap();
      const blocksInRange = blockMap
        .skipUntil((_, k) => k === range.startKey)
        .takeUntil((_, k) => k === range.endKey)
        .concat(Map([[range.endKey, endBlock]]));

      blocksInRange.forEach((block, blockKey) => {
        let blockText = block.getText();
        if (blockKey === range.startKey) {
          blockText = blockText.slice(range.startOffset);
        }
        if (blockKey === range.endKey) {
          blockText = blockText.slice(0, range.endOffset);
        }
        text += blockText + "\n";
      });
    }

    return text.trim();
  };

  /////////////////////////////////////////////////////////////////////////////////////////////

  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("messages");
    console.log("Saved messages:", savedMessages);

    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages);
      if (parsedMessages.length > 0) {
        return parsedMessages;
      }
    }

    return [
      {
        type: "bot",
        text: "Welcome to Bid Pilot! Ask questions about your company library data or search the internet for up to date information. Select text in the response box to use copilot and refine the response."
      }
    ];
  });

  useEffect(() => {
    // Save messages to localStorage whenever they change
    localStorage.setItem("messages", JSON.stringify(messages));
  }, [messages]);

  const [inputValue, setInputValue] = useState("");

  const [bidPilotchoice, setBidPilotChoice] = useState("2");
  const [bidPilotbroadness, setBidPilotBroadness] = useState("4");
  const [isBidPilotLoading, setIsBidPilotLoading] = useState(false);

  const [choice, setChoice] = useState("3");
  const [broadness, setBroadness] = useState("4");

  const [isLoading, setIsLoading] = useState(false);
  const [questionAsked, setQuestionAsked] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState([]);
  const [apiChoices, setApiChoices] = useState([]);
  const [wordAmounts, setWordAmounts] = useState({});

  useEffect(() => {
    localStorage.setItem("inputText", inputText);
  }, [inputText]);

  useEffect(() => {
    let interval = null;
    if (isLoading && startTime) {
      interval = setInterval(() => {
        setElapsedTime((Date.now() - startTime) / 1000); // Update elapsed time in seconds
      }, 100);
    } else if (!isLoading) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isLoading, startTime]);

  const handleSendMessage = () => {
    console.log("handleMessage");
    if (inputValue.trim() !== "") {
      if (showOptions == true) {
        resetEditorState();
      }

      setIsCopilotVisible(false);
      setShowOptions(false);
      setMessages([...messages, { type: "user", text: inputValue }]);
      sendQuestion(inputValue);
      setInputValue("");
    }
  };

  const handleInternetSearch = () => {
    // Implement your internet search logic here
    console.log("Internet Search function called");
    if (inputValue.trim() !== "") {
      if (showOptions == true) {
        resetEditorState();
      }

      setIsCopilotVisible(false);
      setShowOptions(false);
      setMessages([...messages, { type: "user", text: inputValue }]);
      sendInternetQuestion(inputValue);
      setInputValue("");
    }
  };

  const sendInternetQuestion = async (question) => {
    handleGAEvent("Chatbot", "Submit Question", "Submit Button");
    setQuestionAsked(true);
    setIsBidPilotLoading(true);
    setStartTime(Date.now()); // Set start time for the timer
    console.log(dataset);
    // Add a temporary bot message with loading dots
    setMessages((prevMessages) => [
      ...prevMessages,
      { type: "bot", text: "loading" }
    ]);

    try {
      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/perplexity`,
        {
          input_text: question + "Respond in a full sentence format.",
          dataset: "default"
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`
          }
        }
      );

      // Replace the temporary loading message with the actual response
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        { type: "bot", text: result.data }
      ]);
    } catch (error) {
      console.error("Error sending question:", error);
      // Replace the temporary loading message with the error message
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        {
          type: "bot",
          text:
            error.response?.status === 400
              ? "Message failed, please contact support..."
              : error.message
        }
      ]);
    }
    setIsBidPilotLoading(false);
  };

  useEffect(() => {
    if (showOptions) {
      setSelectedDropdownOption("internet-search");
    }
  }, [selectedDropdownOption]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isBidPilotLoading) {
      if (selectedDropdownOption === "internet-search") {
        handleInternetSearch();
      } else if (
        selectedDropdownOption === "custom-prompt" &&
        isCopilotVisible
      ) {
        handleCustomPromptSubmit();
      } else {
        handleSendMessage();
      }
    }
  };

  useEffect(() => {
    if (isCopilotVisible) {
      setSelectedDropdownOption("custom-prompt");
    } else {
      setSelectedDropdownOption("internet-search");
    }
  }, [isCopilotVisible]);

  const formatResponse = (response) => {
    // Handle numbered lists
    response = response.replace(/^\d+\.\s(.+)$/gm, "<li>$1</li>");
    if (response.includes("<li>")) {
      response = `<ol>${response}</ol>`;
    }

    // Handle bullet points
    response = response.replace(/^[-•]\s(.+)$/gm, "<li>$1</li>");
    if (response.includes("<li>") && !response.includes("<ol>")) {
      response = `<ul>${response}</ul>`;
    }

    // Handle bold text
    response = response.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Handle italic text
    response = response.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Handle newlines for better readability
    response = response.replace(/\n/g, "<br>");

    return response;
  };

  const sendQuestion = async (question) => {
    handleGAEvent("Chatbot", "Submit Question", "Submit Button");
    setQuestionAsked(true);
    setIsBidPilotLoading(true);
    setStartTime(Date.now()); // Set start time for the timer

    // Add a temporary bot message with loading dots
    setMessages((prevMessages) => [
      ...prevMessages,
      { type: "bot", text: "loading" }
    ]);

    const chatHistory = messages
      .map((msg) => `${msg.type}: ${msg.text}`)
      .join("\n");
    console.log(chatHistory);
    console.log(bidPilotbroadness);
    console.log(bidPilotchoice);

    try {
      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/question`,
        {
          choice: bidPilotchoice,
          broadness: bidPilotbroadness,
          input_text: question,
          extra_instructions: chatHistory,
          datasets: ["default"],
          bid_id: sharedState.object_id
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`
          }
        }
      );

      // Replace the temporary loading message with the actual response
      const formattedResponse = formatResponse(result.data);

      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        { type: "bot", text: formattedResponse }
      ]);
    } catch (error) {
      console.error("Error sending question:", error);
      // Replace the temporary loading message with the error message
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        {
          type: "bot",
          text:
            error.response?.status === 400
              ? "Message failed, please contact support..."
              : error.message
        }
      ]);
    }
    setIsBidPilotLoading(false);
  };

  const sendQuestionToChatbot = async () => {
    handleGAEvent("Chatbot", "Submit Question", "Submit Button");
    setQuestionAsked(true);
    localStorage.setItem("questionAsked", "true");
    console.log(backgroundInfo);
    setResponseEditorState(EditorState.createEmpty());
    setIsLoading(true);
    setStartTime(Date.now()); // Set start time for the timer
    console.log("DATASET");
    console.log(selectedFolders);
    try {
      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/question`,
        {
          choice: choice === "3" ? "3a" : choice,
          broadness: broadness,
          input_text: inputText,
          extra_instructions: backgroundInfo,
          datasets: selectedFolders,
          bid_id: sharedState.object_id
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`
          }
        }
      );
      if (choice != "3") {
        const contentState = ContentState.createFromText(result.data);
        setResponseEditorState(EditorState.createWithContent(contentState));
      }
      if (choice === "3") {
        let choicesArray = [];
        console.log(result.data);

        try {
          // First, try splitting by semicolons
          if (result.data && result.data.includes(";")) {
            choicesArray = result.data
              .split(";")
              .map((choice) => choice.trim());
          }

          // If semicolon splitting didn't work, try parsing as a numbered list
          if (choicesArray.length === 0 && typeof result.data === "string") {
            choicesArray = result.data
              .split("\n")
              .filter((line) => /^\d+\./.test(line.trim()))
              .map((line) => line.replace(/^\d+\.\s*/, "").trim());
          }

          // If we still don't have any choices, throw an error
          if (choicesArray.length === 0) {
            throw new Error("Failed to parse API response into choices");
          }
        } catch (error) {
          console.error("Error processing API response:", error);
          // Optionally, you could set an error state here to display to the user
          // setError("Failed to process the response. Please try again.");
        }

        setApiChoices(choicesArray);
      }
    } catch (error) {
      console.error("Error sending question:", error);
      const contentState = ContentState.createFromText(error.message);
      setResponseEditorState(EditorState.createWithContent(contentState));
    }
    setIsLoading(false);
  };

  const handleChoiceSelection = (selectedChoice) => {
    if (selectedChoices.includes(selectedChoice)) {
      setSelectedChoices(
        selectedChoices.filter((choice) => choice !== selectedChoice)
      );
      setWordAmounts((prevWordAmounts) => {
        const newWordAmounts = { ...prevWordAmounts };
        delete newWordAmounts[selectedChoice];
        return newWordAmounts;
      });
    } else {
      setSelectedChoices([...selectedChoices, selectedChoice]);
      setWordAmounts((prevWordAmounts) => ({
        ...prevWordAmounts,
        [selectedChoice]: 250 // Default word amount
      }));
    }
  };

  const renderChoices = () => {
    return (
      <div className="choices-container">
        {apiChoices
          .filter((choice) => choice && choice.trim() !== "") // Filter out empty or whitespace-only choices
          .map((choice, index) => (
            <div key={index} className="choice-item d-flex align-items-center">
              <Form.Check
                type="checkbox"
                checked={selectedChoices.includes(choice)}
                onChange={() => handleChoiceSelection(choice)}
              />
              {selectedChoices.includes(choice) ? (
                <Form.Control
                  type="text"
                  value={choice}
                  onChange={(e) => handleChoiceEdit(index, e.target.value)}
                  className="ml-2 editable-choice"
                  style={{ width: "70%", marginLeft: "10px" }}
                />
              ) : (
                <span
                  onClick={() => handleChoiceSelection(choice)}
                  style={{ cursor: "pointer" }}
                >
                  {choice}
                </span>
              )}
              {selectedChoices.includes(choice) && (
                <Form.Control
                  type="number"
                  value={wordAmounts[choice] || 250}
                  onChange={(e) =>
                    setWordAmounts({
                      ...wordAmounts,
                      [choice]: parseInt(e.target.value, 10)
                    })
                  }
                  min={1}
                  className="ml-2"
                  placeholder="250"
                  style={{ width: "120px", marginLeft: "10px" }}
                />
              )}
            </div>
          ))}
      </div>
    );
  };

  const handleChoiceEdit = (index, newValue) => {
    const updatedChoices = [...apiChoices];
    updatedChoices[index] = newValue;
    setApiChoices(updatedChoices);

    // Update selectedChoices and wordAmounts if the edited choice was selected
    if (selectedChoices.includes(apiChoices[index])) {
      const updatedSelectedChoices = selectedChoices.map((choice) =>
        choice === apiChoices[index] ? newValue : choice
      );
      setSelectedChoices(updatedSelectedChoices);

      const updatedWordAmounts = { ...wordAmounts };
      if (updatedWordAmounts[apiChoices[index]]) {
        updatedWordAmounts[newValue] = updatedWordAmounts[apiChoices[index]];
        delete updatedWordAmounts[apiChoices[index]];
      }
      setWordAmounts(updatedWordAmounts);
    }
  };

  const submitSelections = async () => {
    setIsLoading(true);
    setStartTime(Date.now()); // Set start time for the timer
    try {
      console.log(selectedFolders);
      const word_amounts = selectedChoices.map((choice) =>
        String(wordAmounts[choice] || "100")
      );
      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/question_multistep`,
        {
          choice: "3b",
          broadness: broadness,
          input_text: inputText,
          extra_instructions: backgroundInfo,
          selected_choices: selectedChoices,
          datasets: selectedFolders,
          word_amounts,
          bid_id: sharedState.object_id
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`
          }
        }
      );
      const contentState = ContentState.createFromText(result.data);
      setResponseEditorState(EditorState.createWithContent(contentState));
      setApiChoices([]); // Clear choices
      setSelectedChoices([]); // Clear selected choices
      setWordAmounts({}); // Clear word amounts
      setContentLoaded(true);
    } catch (error) {
      console.error("Error submitting selections:", error);
      let errorMessage = "";

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
        errorMessage = `Error ${error.response.status}: ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        // The request was made but no response was received
        console.error("Request:", error.request);
        errorMessage = "No response received from server";
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", error.message);
        errorMessage = `Error: ${error.message}`;
      }

      const contentState = ContentState.createFromText(errorMessage);
      setResponseEditorState(EditorState.createWithContent(contentState));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (contentLoaded) {
      makeReferencesBold();
      setContentLoaded(false);
    }
  }, [contentLoaded, responseEditorState]);

  const makeReferencesBold = () => {
    const contentState = responseEditorState.getCurrentContent();
    const blockMap = contentState.getBlockMap();

    let newContentState = contentState;

    blockMap.forEach((block) => {
      const text = block.getText();
      const key = block.getKey();

      // Pattern to match [Extracted...] sections
      const pattern = /\[(?=.*Extracted).*?\]/g;

      let matchArray;
      while ((matchArray = pattern.exec(text)) !== null) {
        const start = matchArray.index;
        const end = start + matchArray[0].length;

        const selectionState = SelectionState.createEmpty(key).merge({
          anchorOffset: start,
          focusOffset: end
        });

        newContentState = Modifier.applyInlineStyle(
          newContentState,
          selectionState,
          "BOLD"
        );
      }
    });

    if (newContentState !== contentState) {
      const newEditorState = EditorState.push(
        responseEditorState,
        newContentState,
        "change-inline-style"
      );
      setResponseEditorState(newEditorState);
    }
  };

  const removeReferences = () => {
    const contentState = responseEditorState.getCurrentContent();
    const blockMap = contentState.getBlockMap();

    let newContentState = contentState;

    // Pattern to match [Extracted...] sections
    const pattern = /\[(?=.*Extracted).*?\]/g;

    blockMap.forEach((block) => {
      const text = block.getText();
      const key = block.getKey();

      let match;
      let lastIndex = 0;
      const ranges = [];

      // Find all matches in the current block
      while ((match = pattern.exec(text)) !== null) {
        ranges.push({
          start: match.index,
          end: pattern.lastIndex
        });
      }

      // Remove ranges in reverse order to maintain correct indices
      for (let i = ranges.length - 1; i >= 0; i--) {
        const { start, end } = ranges[i];
        const selectionState = SelectionState.createEmpty(key).merge({
          anchorOffset: start,
          focusOffset: end
        });

        newContentState = Modifier.removeRange(
          newContentState,
          selectionState,
          "backward"
        );
      }
    });

    const newEditorState = EditorState.push(
      responseEditorState,
      newContentState,
      "remove-range"
    );
    setResponseEditorState(newEditorState);
  };

  return (
    <div className="chatpage">
      <SideBarSmall />

      <div className="lib-container">
        <div className="scroll-container">
          <BidNavbar />

          <div>
            <Row
              className="justify-content-md-center"
              style={{ visibility: "hidden", height: 0, overflow: "hidden" }}
            >
              <FolderLogic
                tokenRef={tokenRef}
                setAvailableCollections={setAvailableCollections}
                setFolderContents={setFolderContents}
                availableCollections={availableCollections}
                folderContents={folderContents}
              />
            </Row>

            <Col md={12}>
              <h1 className="heavy mb-3">Q&A Generator</h1>
              <div className="proposal-header mb-2">
                <h1 className="lib-title" id="question-section">
                  Question
                </h1>
                <div className="dropdown-container">
                  <SelectFolderModal
                    onSaveSelectedFolders={handleSaveSelectedFolders}
                    initialSelectedFolders={selectedFolders}
                  />
                </div>
              </div>

              <div className="question-answer-box">
                <textarea
                  className="card-textarea"
                  placeholder="Enter question here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={!canUserEdit}
                ></textarea>
              </div>
              <div className="text-muted mt-2">
                Word Count: {inputText.split(/\s+/).filter(Boolean).length}
              </div>
              <Button
                className="upload-button mt-1"
                onClick={sendQuestionToChatbot}
                disabled={inputText.trim() === ""}
              >
                Submit
              </Button>

              <Row>
                <div className="" style={{ textAlign: "left" }}>
                  {isLoading && (
                    <div className="my-3">
                      <Spinner animation="border" />
                      <div>Elapsed Time: {elapsedTime.toFixed(1)}s</div>
                    </div>
                  )}
                  {choice === "3" && apiChoices.length > 0 && (
                    <div>
                      {renderChoices()}
                      <Button
                        variant="primary"
                        onClick={submitSelections}
                        className="upload-button mt-3"
                        disabled={selectedChoices.length === 0}
                      >
                        Generate answers for selected subsections
                      </Button>
                    </div>
                  )}
                </div>
              </Row>
            </Col>

            <Row className="mt-2">
              <Col lg={7} md={12}>
                <div className="proposal-header">
                  <h1 id="answer-section" className="lib-title mt-4 mb-3">
                    Answer
                  </h1>
                  <Button className="upload-button" onClick={removeReferences}>
                    Remove References
                  </Button>
                </div>

                <div className="response-box draft-editor" ref={responseBoxRef}>
                  <div className="editor-container" ref={editorRef}>
                    <Editor
                      editorState={responseEditorState}
                      placeholder="Your response will be generated here..."
                      onChange={handleEditorChange}
                      customStyleMap={{
                        ...styleMap,
                        BOLD: { fontWeight: "bold" }
                      }}
                      readOnly={!canUserEdit}
                    />
                  </div>
                </div>

                <div className="text-muted mt-2">
                  Word Count:{" "}
                  {
                    convertToRaw(responseEditorState.getCurrentContent())
                      .blocks.map((block) => block.text)
                      .join("\n")
                      .split(/\s+/)
                      .filter(Boolean).length
                  }
                </div>

                <SaveQASheet
                  inputText={inputText}
                  responseEditorState={responseEditorState}
                />
              </Col>
              <Col lg={5} md={12}>
                <div className="input-header">
                  <div className="proposal-header mb-2">
                    <h1
                      className="lib-title"
                      style={{ color: "white" }}
                      id="bid-pilot-section"
                    >
                      Bid Pilot
                    </h1>
                    <div className="dropdown-container"></div>
                  </div>
                </div>

                <div className="bid-pilot-container">
                  {showOptions ? (
                    <div
                      className="options-container"
                      ref={optionsContainerRef}
                    >
                      {copilotLoading ? (
                        <div className="spinner-container">
                          <Spinner animation="border" />
                          <p>Generating Options...</p>
                        </div>
                      ) : (
                        copilotOptions.map((option, index) => (
                          <div key={index} className="option">
                            <div className="option-content">
                              <Button
                                onClick={() =>
                                  handleOptionSelect(option, index)
                                }
                                className={`upload-button ${selectedOptionIndex === index ? "selected" : ""}`}
                                style={{
                                  backgroundColor:
                                    selectedOptionIndex === index
                                      ? "orange"
                                      : "#262626",
                                  color:
                                    selectedOptionIndex === index
                                      ? "black"
                                      : "#fff",
                                  fontSize: "16px"
                                }}
                              >
                                <span>Option {index + 1}</span>
                              </Button>
                              {selectedOptionIndex === index && (
                                <Button
                                  onClick={handleTick}
                                  className="tick-button"
                                >
                                  <FontAwesomeIcon
                                    icon={faCheck}
                                    className="tick-icon"
                                  />
                                </Button>
                              )}
                            </div>
                            <div className="option-item mt-2">
                              <p>{option}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : isCopilotVisible ? (
                    <div
                      className={`prompts-container ${!isCopilotVisible ? "fade-out" : ""}`}
                      ref={promptsContainerRef}
                    >
                      <div className="prompts">
                        <Button
                          className="prompt-button"
                          style={{ borderTop: "2px solid #555555" }}
                          onClick={handleLinkClick("Summarise")}
                        >
                          Summarise
                        </Button>
                        <Button
                          className="prompt-button"
                          onClick={handleLinkClick("Expand")}
                        >
                          Expand
                        </Button>
                        <Button
                          className="prompt-button"
                          onClick={handleLinkClick("Rephrase")}
                        >
                          Rephrase
                        </Button>
                        <Button
                          className="prompt-button"
                          onClick={handleLinkClick("Inject Company Voice")}
                        >
                          Inject Company Voice
                        </Button>
                        <Button
                          className="prompt-button"
                          onClick={handleLinkClick("Inject Tender Context")}
                        >
                          Inject Tender Context
                        </Button>
                        <Button
                          className="prompt-button"
                          onClick={handleLinkClick("Improve Grammar")}
                        >
                          Improve Grammar
                        </Button>
                        <Button
                          className="prompt-button"
                          onClick={handleLinkClick("Add Statistics")}
                        >
                          Add Statistic
                        </Button>
                        <Button
                          className="prompt-button"
                          onClick={handleLinkClick("For Example")}
                        >
                          For Example
                        </Button>
                        <Button
                          className="prompt-button"
                          onClick={handleLinkClick("Translate to English")}
                        >
                          Translate to English
                        </Button>
                        <Button
                          className="prompt-button"
                          onClick={handleLinkClick("We will Active Voice")}
                        >
                          We will
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mini-messages">
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          className={`message-bubble-small ${message.type}`}
                        >
                          {message.text === "loading" ? (
                            <div className="loading-dots">
                              <span>. </span>
                              <span>. </span>
                              <span>. </span>
                            </div>
                          ) : (
                            <div
                              dangerouslySetInnerHTML={{ __html: message.text }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="input-console">
                    <div className="dropdown-clear-container mb-3">
                      <Dropdown
                        onSelect={(key) => setSelectedDropdownOption(key)}
                        className="chat-dropdown"
                        id="bid-pilot-options"
                      >
                        <Dropdown.Toggle
                          className="upload-button"
                          style={{
                            backgroundColor:
                              selectedDropdownOption === "custom-prompt"
                                ? "orange"
                                : "#383838",
                            color:
                              selectedDropdownOption === "custom-prompt"
                                ? "black"
                                : "white"
                          }}
                        >
                          {selectedDropdownOption === "internet-search"
                            ? "Internet Search"
                            : selectedDropdownOption === "custom-prompt"
                              ? "Custom Prompt"
                              : "Library Chat"}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item eventKey="internet-search">
                            Internet Search
                          </Dropdown.Item>
                          <Dropdown.Item eventKey="library-chat">
                            Library Chat
                          </Dropdown.Item>
                          {/* Removed the Custom Prompt option */}
                        </Dropdown.Menu>
                      </Dropdown>
                      <Button
                        className="option-button"
                        onClick={handleClearMessages}
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="bid-input-bar" ref={bidPilotRef}>
                      <input
                        type="text"
                        placeholder={
                          selectedDropdownOption === "internet-search"
                            ? "Please type your question in here..."
                            : selectedDropdownOption === "custom-prompt"
                              ? "Type in a custom prompt here..."
                              : "Please type your question in here..."
                        }
                        value={inputValue}
                        onFocus={
                          selectedDropdownOption === "custom-prompt"
                            ? handleCustomPromptFocus
                            : null
                        }
                        onBlur={handleCustomPromptBlur}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={!canUserEdit}
                        style={{
                          color:
                            selectedDropdownOption === "custom-prompt"
                              ? "white"
                              : "lightgray"
                        }}
                      />
                      <button
                        onMouseDown={handleMouseDownOnSubmit}
                        onClick={
                          !isBidPilotLoading
                            ? selectedDropdownOption === "internet-search"
                              ? handleInternetSearch
                              : selectedDropdownOption === "custom-prompt" &&
                                  isCopilotVisible
                                ? handleCustomPromptSubmit
                                : handleSendMessage
                            : null
                        }
                        disabled={isBidPilotLoading}
                      >
                        <FontAwesomeIcon icon={faPaperPlane} />
                      </button>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </div>
      <QuestionCrafterWizard />
    </div>
  );
};

export default withAuth(QuestionCrafter);
