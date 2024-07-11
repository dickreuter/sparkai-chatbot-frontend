import React, { useContext, useEffect, useRef, useState } from "react";
import { API_URL, HTTP_PREFIX } from '../helper/Constants';
import axios from 'axios';
import withAuth from '../routes/withAuth';
import { useAuthUser } from 'react-auth-kit';
import SideBarSmall from '../routes/SidebarSmall.tsx';
import handleGAEvent from '../utilities/handleGAEvent';
import { Button, Col, Dropdown, Form, Row, Spinner } from "react-bootstrap";
import BidNavbar from "../routes/BidNavbar.tsx";
import "./QuestionsCrafter.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faChevronLeft, faChevronRight, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import FolderLogic from "../components/Folders.tsx";
import { Editor, EditorState, Modifier, SelectionState, convertToRaw, ContentState, RichUtils } from 'draft-js';
import 'draft-js/dist/Draft.css';
import { BidContext } from "./BidWritingStateManagerView.tsx";

const QuestionCrafter = () => {
  const getAuth = useAuthUser();
  const auth = getAuth();
  const tokenRef = useRef(auth?.token || "default");

  const { sharedState, setSharedState, getBackgroundInfo } = useContext(BidContext);
  const { editorState, questions } = sharedState;

  const backgroundInfo = getBackgroundInfo();

  const [bids, setBids] = useState([]);
  const [selectedBid, setSelectedBid] = useState(null);

  const [dataset, setDataset] = useState("default");
  const [availableCollections, setAvailableCollections] = useState([]);
  const [folderContents, setFolderContents] = useState({});
  const [isAppended, setIsAppended] = useState(false);
  const [appendResponse, setAppendResponse] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState("-1");

  const [isCopilotVisible, setIsCopilotVisible] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [tempText, setTempText] = useState('');
  const [copilotOptions, setCopilotOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [copilotLoading, setCopilotLoading] = useState(false);

  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  
  const [inputText, setInputText] = useState(localStorage.getItem('inputText') || '');
  const [responseEditorState, setResponseEditorState] = useState(
    EditorState.createWithContent(
      ContentState.createFromText(localStorage.getItem('response') || '')
    )
  );
  const [selectionRange, setSelectionRange] = useState({ start: null, end: null });
  const [isInternetSearch, setIsInternetSearch] = useState(true);

  const cursorPositionRef = useRef(null);

  const [showModal, setShowModal] = useState(false);

  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => setShowModal(true);

  const responseBoxRef = useRef(null); // Ref for the response box
  const promptsContainerRef = useRef(null); // Ref for the prompts container
  const editorRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('response', convertToRaw(responseEditorState.getCurrentContent()).blocks.map(block => block.text).join('\n'));
  }, [responseEditorState]);

  const styleMap = {
    ORANGE: {
      backgroundColor: 'orange',
    },
  };

  const handleDatasetChange = (e) => {
    const newDataset = e.target.value;
    setDataset(newDataset);
    handleGAEvent('Chatbot', 'Dataset Selection', 'Select Dataset Button');
  };

  const handleSelect = (eventKey) => {
    handleDatasetChange({ target: { value: eventKey } });
  };

  const parsedQuestions = questions.trim() ? questions.split(',') : [];

  const handleSelectQuestion = (eventKey) => {
    const selectedQuestion = parsedQuestions[eventKey];
    if (selectedQuestion) {
      setInputText(selectedQuestion);
    }
  };

  const handleClearMessages = () => {
    setMessages([{ type: 'bot', text: 'Welcome to Bid Pilot! Ask questions about your company library data or search the internet for up to date information. Select text in the response box to use copilot and refine the response.' }]);
    localStorage.removeItem('messages');
    
    setIsCopilotVisible(false);
    
    if (showOptions == true){
      resetEditorState();
    }
    setShowOptions(false);
    
  };
  

  const handleAppendResponseToEditor = () => {
    handleGAEvent('Chatbot', 'Append Response', 'Add to Proposal Button');
    setSelectedQuestionId("-1");

    setTimeout(() => {
      const currentContent = editorState.getCurrentContent();
      const lastBlock = currentContent.getBlockMap().last();
      const lengthOfLastBlock = lastBlock.getLength();
      const selectionState = SelectionState.createEmpty(lastBlock.getKey()).merge({
        anchorOffset: lengthOfLastBlock,
        focusOffset: lengthOfLastBlock,
      });

      const contentStateWithNewText = Modifier.insertText(
        currentContent,
        selectionState,
        `\nQuestion:\n${inputText}\n\nAnswer:\n${convertToRaw(responseEditorState.getCurrentContent()).blocks.map(block => block.text).join('\n')}\n\n`
      );

      const newEditorState = EditorState.push(editorState, contentStateWithNewText, 'insert-characters');

      setSharedState((prevState) => ({
        ...prevState,
        editorState: newEditorState
      }));

      setIsAppended(true);
      setTimeout(() => setIsAppended(false), 3000);
    }, 100);
  };

  const askCopilot = async (copilotInput, instructions, copilot_mode) => {
    setQuestionAsked(true);
    localStorage.setItem('questionAsked', 'true');
    handleGAEvent('Chatbot', 'Copilot Input', copilotInput);
    setCopilotLoading(true);
    setStartTime(Date.now()); // Set start time for the timer

    console.log({
      input_text: copilotInput,
      extra_instructions: instructions,
      copilot_mode: copilot_mode,
      dataset,
    });

    try {
      const requests = [
        axios.post(
          `http${HTTP_PREFIX}://${API_URL}/copilot`,
          {
            input_text: copilotInput,
            extra_instructions: instructions,
            copilot_mode: copilot_mode,
            dataset,
          },
          {
            headers: {
              Authorization: `Bearer ${tokenRef.current}`,
            },
          }
        ),
        axios.post(
          `http${HTTP_PREFIX}://${API_URL}/copilot`,
          {
            input_text: copilotInput,
            extra_instructions: instructions,
            copilot_mode: copilot_mode,
            dataset,
          },
          {
            headers: {
              Authorization: `Bearer ${tokenRef.current}`,
            },
          }
        )
      ];

      const results = await Promise.all(requests);
      const options = results.map(result => result.data);
      setCopilotOptions(options);
    } catch (error) {
      console.error("Error sending question:", error);
      
    }
    setCopilotLoading(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      console.log("click outside")
      if (
        responseBoxRef.current &&
        promptsContainerRef.current &&
        !responseBoxRef.current.contains(event.target) &&
        !promptsContainerRef.current.contains(event.target)
      ) {
       
        setIsCopilotVisible(false);
      }
    };
  
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showOptions, isCopilotVisible]);
  
  
  
  const optionsContainerRef = useRef(null); // Ref for the options container

  const [originalEditorState, setOriginalEditorState] = useState(responseEditorState);


  const resetEditorState = () => {
    const contentState = originalEditorState.getCurrentContent();
    const blocks = contentState.getBlockMap();
  
    let newContentState = contentState;
  
    // Remove ORANGE style from all blocks
    blocks.forEach(block => {
      const blockKey = block.getKey();
      const length = block.getLength();
      const blockSelection = SelectionState.createEmpty(blockKey).merge({
        anchorOffset: 0,
        focusOffset: length
      });
  
      newContentState = Modifier.removeInlineStyle(newContentState, blockSelection, 'ORANGE');
    });
  
    const newEditorState = EditorState.createWithContent(newContentState);
    setResponseEditorState(newEditorState);
    setIsCopilotVisible(false);
    setSelectedText('');
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
  
    document.addEventListener('click', handleClickOutsideOptions);
    return () => {
      document.removeEventListener('click', handleClickOutsideOptions);
    };
  }, [showOptions, responseEditorState]);
  
  
  const handleTick = () => {
    const contentState = responseEditorState.getCurrentContent();
    const blocks = contentState.getBlockMap();
  
    let newContentState = contentState;
  
    // Remove ORANGE style from all blocks
    blocks.forEach(block => {
      const blockKey = block.getKey();
      const length = block.getLength();
      const blockSelection = SelectionState.createEmpty(blockKey).merge({
        anchorOffset: 0,
        focusOffset: length
      });
  
      newContentState = Modifier.removeInlineStyle(newContentState, blockSelection, 'ORANGE');
    });
  
    let newEditorState = EditorState.push(responseEditorState, newContentState, 'change-inline-style');
  
    // Clear the selection
    const firstBlockKey = newEditorState.getCurrentContent().getFirstBlock().getKey();
    const emptySelection = SelectionState.createEmpty(firstBlockKey);
    newEditorState = EditorState.forceSelection(newEditorState, emptySelection);
  
    setResponseEditorState(newEditorState);
    setShowOptions(false);
    setIsCopilotVisible(false);
    setSelectedText('');
  
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

    let selectedText = '';

    if (startBlock === endBlock) {
      selectedText = startBlock.getText().slice(startOffset, endOffset);
    } else {
      const startText = startBlock.getText().slice(startOffset);
      const endText = endBlock.getText().slice(0, endOffset);
      const middleText = currentContent
        .getBlockMap()
        .skipUntil(block => block.getKey() === startKey)
        .skip(1)
        .takeUntil(block => block.getKey() === endKey)
        .map(block => block.getText())
        .join('\n');

      selectedText = [startText, middleText, endText].filter(Boolean).join('\n');
    }

    console.log("handleEditorChange - selectedText:", selectedText);

    setSelectedText(selectedText);
    setSelectionRange({
      anchorKey: selectionState.getAnchorKey(),
      anchorOffset: selectionState.getAnchorOffset(),
      focusKey: selectionState.getFocusKey(),
      focusOffset: selectionState.getFocusOffset(),
    });

    setResponseEditorState(editorState); // Always update the state
};

useEffect(() => {
  if (selectedText && selectedText.length > 0) {
    // added extra check because sometimes an empty string would be passed to the copilot
    const contentState = responseEditorState.getCurrentContent();
    const selectionState = responseEditorState.getSelection();

    const start = selectionState.getStartOffset();
    const end = selectionState.getEndOffset();
    const anchorKey = selectionState.getAnchorKey();
    const currentContentBlock = contentState.getBlockForKey(anchorKey);
    const highlightedText = currentContentBlock.getText().slice(start, end);
    if (highlightedText && highlightedText.length > 0) {
      setIsCopilotVisible(true);
    }
  } else {
    setIsCopilotVisible(false);
  }
}, [selectedText]);

  
const handleOptionSelect = (option) => {

  const contentState = responseEditorState.getCurrentContent();
  const { anchorKey, anchorOffset, focusKey, focusOffset } = selectionRange;

  // Log the initial state
  console.log("handleOptionSelect - Initial Content State:", convertToRaw(contentState));
  console.log("handleOptionSelect - Initial Selection Range:", selectionRange);

  // Create a new selection state that covers the entire range
  const newSelectionState = SelectionState.createEmpty(anchorKey).merge({
    anchorOffset: Math.min(anchorOffset, focusOffset),
    focusKey: focusKey,
    focusOffset: Math.max(anchorOffset, focusOffset),
  });

  // Log the new selection state
  console.log("handleOptionSelect - New Selection State:", newSelectionState.toJS());

  // Remove any existing text within the selection range
  const clearedContentState = Modifier.removeRange(contentState, newSelectionState, 'backward');

  // Log the cleared content state
  console.log("handleOptionSelect - Cleared Content State:", convertToRaw(clearedContentState));

  // Collapse the selection to the start of the cleared range
  const collapsedSelection = SelectionState.createEmpty(anchorKey).merge({
    anchorOffset: newSelectionState.getStartOffset(),
    focusOffset: newSelectionState.getStartOffset(),
  });

  // Log the collapsed selection state
  console.log("handleOptionSelect - Collapsed Selection State:", collapsedSelection.toJS());

  // Insert new option text at the collapsed selection
  const newContentState = Modifier.insertText(
    clearedContentState,
    collapsedSelection,
    option
  );

  // Log the new content state after insertion
  console.log("handleOptionSelect - New Content State After Insertion:", convertToRaw(newContentState));

  // Apply the ORANGE style to the new text
  const finalSelectionState = collapsedSelection.merge({
    focusOffset: collapsedSelection.getStartOffset() + option.length,
  });

  // Log the final selection state
  console.log("handleOptionSelect - Final Selection State:", finalSelectionState.toJS());

  const newContentStateWithStyle = Modifier.applyInlineStyle(
    newContentState,
    finalSelectionState,
    'ORANGE'
  );

  let newEditorState = EditorState.push(responseEditorState, newContentStateWithStyle, 'change-inline-style');

  // Force the selection to the end of the newly inserted text
  newEditorState = EditorState.forceSelection(newEditorState, finalSelectionState);

  // Log the final content state with style
  console.log("handleOptionSelect - Final Content State With Style:", convertToRaw(newContentStateWithStyle));

  setResponseEditorState(newEditorState);

  setTempText(option);
  setSelectedOption(option);
  setShowOptions(true); // Ensure options remain visible

  // Log the final text in the editor
  console.log("handleOptionSelect - finalText:", convertToRaw(newContentStateWithStyle).blocks.map(block => block.text).join('\n'));

  // Force re-render of the editor component by updating a dummy state
  setDummyState((prev) => !prev);
};

  // Dummy state to force re-render of the editor component
  const [dummyState, setDummyState] = useState(false);
  
  // Example of logging for additional context (if needed)
  const handleLinkClick = (linkName) => (e) => {
    e.preventDefault();
    const copilot_mode = linkName.toLowerCase().replace(/\s+/g, '_');
    const instructions = '';
  
    const contentState = responseEditorState.getCurrentContent();
    const selectionState = responseEditorState.getSelection();
  
    const start = selectionState.getStartOffset();
    const end = selectionState.getEndOffset();
    const anchorKey = selectionState.getAnchorKey();
    const currentContentBlock = contentState.getBlockForKey(anchorKey);
    const highlightedText = currentContentBlock.getText().slice(start, end);
  
    console.log("handleLinkClick - highlightedText:", highlightedText);
  
    // Store the original state before making any changes
    setOriginalEditorState(responseEditorState);
  
    // Apply ORANGE style to highlighted text
    const newContentState = Modifier.applyInlineStyle(
      contentState,
      selectionState,
      'ORANGE'
    );
  
    const newEditorState = EditorState.push(responseEditorState, newContentState, 'change-inline-style');
    setResponseEditorState(newEditorState);
  
    setOriginalText(highlightedText);
  
    // Correcting selection range
    const correctedSelectionRange = {
      anchorKey: selectionState.getAnchorKey(),
      anchorOffset: Math.min(selectionState.getAnchorOffset(), selectionState.getFocusOffset()),
      focusKey: selectionState.getFocusKey(),
      focusOffset: Math.max(selectionState.getAnchorOffset(), selectionState.getFocusOffset()),
    };
    setSelectionRange(correctedSelectionRange);
  
    console.log("handleLinkClick - setSelectionRange:", correctedSelectionRange);
  
    setTimeout(() => {
      askCopilot(highlightedText, instructions, copilot_mode);
      setShowOptions(true);
    }, 0);
  };
  
  const [customPrompt, setCustomPrompt] = useState('');

  const handleCustomPromptInputChange = (event) => {
    setCustomPrompt(event.target.value);
  };

  const handleCustomPromptSubmit = () => {
    // Handle custom prompt submission
    if (customPrompt.trim()) {
      console.log(`Custom Prompt: ${customPrompt}`);
      // Add your logic here to handle the custom prompt
     
      const copilot_mode = customPrompt.toLowerCase().replace(/\s+/g, '_');
      const instructions = '';
    
      const contentState = responseEditorState.getCurrentContent();
      const selectionState = responseEditorState.getSelection();
    
      const start = selectionState.getStartOffset();
      const end = selectionState.getEndOffset();
      const anchorKey = selectionState.getAnchorKey();
      const currentContentBlock = contentState.getBlockForKey(anchorKey);
      const highlightedText = currentContentBlock.getText().slice(start, end);
    
      console.log("handleLinkClick - highlightedText:", highlightedText);
    
      // Store the original state before making any changes
      setOriginalEditorState(responseEditorState);
    
      // Apply ORANGE style to highlighted text
      const newContentState = Modifier.applyInlineStyle(
        contentState,
        selectionState,
        'ORANGE'
      );
    
      const newEditorState = EditorState.push(responseEditorState, newContentState, 'change-inline-style');
      setResponseEditorState(newEditorState);
    
      setOriginalText(highlightedText);
    
      // Correcting selection range
      const correctedSelectionRange = {
        anchorKey: selectionState.getAnchorKey(),
        anchorOffset: Math.min(selectionState.getAnchorOffset(), selectionState.getFocusOffset()),
        focusKey: selectionState.getFocusKey(),
        focusOffset: Math.max(selectionState.getAnchorOffset(), selectionState.getFocusOffset()),
      };
      setSelectionRange(correctedSelectionRange);
    
      console.log("handleLinkClick - setSelectionRange:", correctedSelectionRange);
    
      setTimeout(() => {
        askCopilot(highlightedText, instructions, copilot_mode);
        setShowOptions(true);
      }, 0);

      setCustomPrompt(''); // Clear the input field
    }
  };
  
  

  


/////////////////////////////////////////////////////////////////////////////////////////////


const [messages, setMessages] = useState(() => {
  const savedMessages = localStorage.getItem('messages');
  console.log('Saved messages:', savedMessages);

  if (savedMessages) {
    const parsedMessages = JSON.parse(savedMessages);
    if (parsedMessages.length > 0) {
      return parsedMessages;
    }
  }

  return [{ type: 'bot', text: 'Welcome to Bid Pilot! Ask questions about your company library data or search the internet for up to date information. Select text in the response box to use copilot and refine the response.' }];
});




useEffect(() => {
  // Save messages to localStorage whenever they change
  localStorage.setItem('messages', JSON.stringify(messages));
}, [messages]);


  const [inputValue, setInputValue] = useState("");

  const [bidPilotchoice, setBidPilotChoice] = useState("2");
  const [bidPilotbroadness, setBidPilotBroadness] = useState("2");
  const [isBidPilotLoading, setIsBidPilotLoading] = useState(false);

  const [choice, setChoice] = useState("3");
  const [broadness, setBroadness] = useState("2");

  const [isLoading, setIsLoading] = useState(false);
  const [questionAsked, setQuestionAsked] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedChoices, setSelectedChoices] = useState([]);
  const [apiChoices, setApiChoices] = useState([]);
  const [wordAmounts, setWordAmounts] = useState({});

  useEffect(() => {
    localStorage.setItem('inputText', inputText);
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
      if (showOptions == true){
        resetEditorState();
      }
      
      setIsCopilotVisible(false);
      setShowOptions(false);
      setMessages([...messages, { type: 'user', text: inputValue }]);
      sendQuestion(inputValue);
      setInputValue("");
    }
  };

  const handleInternetSearch = () => {
    // Implement your internet search logic here
    console.log("Internet Search function called");
    if (inputValue.trim() !== "") {
      if (showOptions == true){
        resetEditorState();
      }
      
      setIsCopilotVisible(false);
      setShowOptions(false);
      setMessages([...messages, { type: 'user', text: inputValue }]);
      sendInternetQuestion(inputValue);
      setInputValue("");
    }
  };

  const sendInternetQuestion = async (question) => {
    handleGAEvent('Chatbot', 'Submit Question', 'Submit Button');
    setQuestionAsked(true);
    setIsBidPilotLoading(true);
    setStartTime(Date.now()); // Set start time for the timer
    console.log(dataset);
    // Add a temporary bot message with loading dots
    setMessages((prevMessages) => [
      ...prevMessages,
      { type: 'bot', text: 'loading' }
    ]);

    try {
      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/perplexity`,
        {
          input_text: question,
          dataset: 'default',
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }
      );

      // Replace the temporary loading message with the actual response
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        { type: 'bot', text: result.data }
      ]);
    } catch (error) {
      console.error("Error sending question:", error);
      // Replace the temporary loading message with the error message
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        { type: 'bot', text: error.response?.status === 400 ? 'Message failed, please contact support...' : error.message }
      ]);
    }
    setIsBidPilotLoading(false);
  };

  

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isBidPilotLoading) {
      isInternetSearch ? handleInternetSearch() : handleSendMessage();
    }
  };


  const sendQuestion = async (question) => {
    handleGAEvent('Chatbot', 'Submit Question', 'Submit Button');
    setQuestionAsked(true);
    setIsBidPilotLoading(true);
    setStartTime(Date.now()); // Set start time for the timer

    // Add a temporary bot message with loading dots
    setMessages((prevMessages) => [
      ...prevMessages,
      { type: 'bot', text: 'loading' }
    ]);

    try {
      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/question`,
        {
          choice: bidPilotchoice,
          broadness: bidPilotbroadness,
          input_text: question,
          extra_instructions: ' ',
          dataset,
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }
      );

      // Replace the temporary loading message with the actual response
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        { type: 'bot', text: result.data }
      ]);
    } catch (error) {
      console.error("Error sending question:", error);
      // Replace the temporary loading message with the error message
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        { type: 'bot', text: error.response?.status === 400 ? 'Message failed, please contact support...' : error.message }
      ]);
    }
    setIsBidPilotLoading(false);
  };

  const sendQuestionToChatbot = async () => {
    handleGAEvent('Chatbot', 'Submit Question', 'Submit Button');
    setQuestionAsked(true);
    localStorage.setItem('questionAsked', 'true');
    console.log(backgroundInfo);
    setResponseEditorState(EditorState.createEmpty());
    setIsLoading(true);
    setStartTime(Date.now()); // Set start time for the timer
    
    try {
      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/question`,
        {
          choice: choice === "3" ? "3a" : choice,
          broadness: broadness,
          input_text: inputText,
          extra_instructions: backgroundInfo,
          dataset,
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }
      );
      if (choice != "3") {
        const contentState = ContentState.createFromText(result.data);
        setResponseEditorState(EditorState.createWithContent(contentState));
      }
      if (choice === "3") {
        let choicesArray = [];

        // Check if result.data contains comma-separated values
        if (result.data && result.data.includes(",")) {
          choicesArray = result.data.split(",").map((choice) => choice.trim());
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
        [selectedChoice]: 300 // Default word amount
      }));
    }
  };

  const renderChoices = () => {
    return (
      <div className="choices-container">
        {apiChoices.map((choice, index) => (
          <div key={index} className="choice-item d-flex align-items-center">
            <Form.Check
              type="checkbox"
              label={choice}
              checked={selectedChoices.includes(choice)}
              onChange={() => handleChoiceSelection(choice)}
            />
            {selectedChoices.includes(choice) && (
              <Form.Control
                type="number"
                value={wordAmounts[choice] || 300}
                onChange={(e) => setWordAmounts({
                  ...wordAmounts,
                  [choice]: parseInt(e.target.value, 10)
                })}
                min={1}
                className="ml-2"
                placeholder="300"
                style={{ width: '120px', marginLeft: '10px' }}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const submitSelections = async () => {
    setIsLoading(true);
    setStartTime(Date.now()); // Set start time for the timer
    try {
      const word_amounts = selectedChoices.map((choice) => wordAmounts[choice] || 100);
      const result = await axios.post(
        `http${HTTP_PREFIX}://${API_URL}/question_multistep`,
        {
          choice: "3b",
          broadness: broadness,
          input_text: inputText,
          extra_instructions: backgroundInfo,
          selected_choices: selectedChoices,
          dataset,
          word_amounts
        },
        {
          headers: {
            Authorization: `Bearer ${tokenRef.current}`,
          },
        }
      );
      const contentState = ContentState.createFromText(result.data);
      setResponseEditorState(EditorState.createWithContent(contentState));
      setApiChoices([]); // Clear choices
      setSelectedChoices([]); // Clear selected choices
      setWordAmounts({}); // Clear word amounts
    } catch (error) {
      console.error("Error submitting selections:", error);
      const contentState = ContentState.createFromText(error.message);
      setResponseEditorState(EditorState.createWithContent(contentState));
    }
    setIsLoading(false);
  };


  

  return (
    <div className="chatpage">
      <SideBarSmall />

      <div className="lib-container">
        <BidNavbar />
        
        <div>
          <Row className="justify-content-md-center" style={{ visibility: 'hidden', height: 0, overflow: 'hidden'  }}>
            <FolderLogic
              tokenRef={tokenRef}
              setAvailableCollections={setAvailableCollections}
              setFolderContents={setFolderContents}
              availableCollections={availableCollections}
              folderContents={folderContents}
            />
          </Row>

          
            <Col md={12}>
              <h1 className='heavy'>Bid Creator</h1>
              <div className="proposal-header mb-2">
                <h1 className="lib-title">Question</h1>
                <div className="dropdown-container">
                  <Dropdown onSelect={handleSelect} className="w-100 mx-auto chat-dropdown">
                    <Dropdown.Toggle className="upload-button" style={{backgroundColor: 'orange', color: 'black'}} id="dropdown-basic">
                      {dataset || "Select a dataset"}
                    </Dropdown.Toggle>

                    <Dropdown.Menu className="w-100">
                      {availableCollections.map((collection) => (
                        <Dropdown.Item key={collection} eventKey={collection}>
                          {collection}
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown>
                  <Dropdown onSelect={handleSelectQuestion} className="w-100 mx-auto chat-dropdown">
                    <Dropdown.Toggle className="upload-button custom-dropdown-toggle" id="dropdown-basic">
                      Select a Question
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="w-100">
                      {parsedQuestions.length > 0 ? (
                        parsedQuestions.map((question, index) => (
                          <Dropdown.Item key={index} eventKey={index.toString()}>
                            {question}
                          </Dropdown.Item>
                        ))
                      ) : (
                        <Dropdown.Item eventKey="none" disabled>
                          Upload some questions to get started
                        </Dropdown.Item>
                      )}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>

              <div className="question-answer-box">
                <textarea
                  className="card-textarea"
                  placeholder="Enter question here..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                ></textarea>
              </div>
              <div className="text-muted mt-2">
                Word Count: {inputText.split(/\s+/).filter(Boolean).length}
              </div>
              <Button
                className="upload-button mt-1"
                onClick={sendQuestionToChatbot}
                disabled={inputText.trim() === ''}
              >
                Submit
              </Button>

              <Row>
                <div className="" style={{textAlign: "left"}}>
                  {isLoading && (
                    <div className="my-3">
                      <Spinner animation="border"/>
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

              
          <Col md={7}>
              <h1 className="lib-title mt-4 mb-3">Response</h1>
              <div className="response-box draft-editor" ref={responseBoxRef}>
              <div className="editor-container" ref={editorRef}>
            <Editor
              editorState={responseEditorState}
              placeholder="Your response will be generated here..."
              onChange={handleEditorChange}
              customStyleMap={styleMap}
            />
          </div>
</div>



            

              <div className="text-muted mt-2">
                Word Count: {convertToRaw(responseEditorState.getCurrentContent()).blocks.map(block => block.text).join('\n').split(/\s+/).filter(Boolean).length}
              </div>
              <Button
                variant={isAppended ? 'success' : 'primary'}
                className="upload-button mt-1 mb-4"
                onClick={handleAppendResponseToEditor}
                disabled={isLoading || isAppended || convertToRaw(responseEditorState.getCurrentContent()).blocks.map(block => block.text).join('\n').trim() === ''}
              >
                {isAppended ? 'Added' : 'Add to Proposal'}
              </Button>
            </Col>
            <Col md={5}>
              <div className="input-header">
                <div className="proposal-header mb-2">
                  <h1 className="lib-title" style={{ color: "white" }}>Bid Pilot</h1>
                  <div className="dropdown-container">
                   
                  </div>
                </div>
              </div>

              <div className="bid-pilot-container">
                <div className="chatResponse-container">
                  {showOptions ? (
                   <div className="options-container" ref={optionsContainerRef}>
                   {copilotLoading ? (
                        <div className="spinner-container">
                          <Spinner animation="border" />
                          <p>Generating Options...</p>
                        </div>
                      ) : (
                        copilotOptions.map((option, index) => (
                     <div key={index} className="option">
                       <Button
                         onClick={() => handleOptionSelect(option)}
                         className={`upload-button mb-2 ${selectedOption === option ? 'selected' : ''}`}
                         style={{
                           backgroundColor: selectedOption === option ? 'orange' : '#262626',
                           color: selectedOption === option ? 'black' : '#fff',
                         }}
                       >
                         <span>Option {index + 1}</span>
                       </Button>
                       {selectedOption === option && (
                         <FontAwesomeIcon 
                           icon={faCheck} 
                           className="tick-icon" 
                           onClick={handleTick}
                         />
                       )}
                       <div className="option-item">
                         <p>{option}</p>
                       </div>
                     </div>
                   )))}
                 </div>
                 
                  ) : isCopilotVisible ? (
                    <div className={`prompts-container ${!isCopilotVisible ? 'fade-out' : ''}`} ref={promptsContainerRef}>
                      <div className="prompts">
                        <Button className="prompt-button" style={{ borderTop: '2px solid #555555' }} onClick={handleLinkClick('Summarise')}>Summarise</Button>
                        <Button className="prompt-button" onClick={handleLinkClick('Expand')}>Expand</Button>
                        <Button className="prompt-button" onClick={handleLinkClick('Rephrase')}>Rephrase</Button>
                        <Button className="prompt-button" onClick={handleLinkClick('Translate to English')}>Translate to English</Button>
                        <Button className="prompt-button" onClick={handleLinkClick('We will Active Voice')}>We will</Button>
                        <Button className="prompt-button" onClick={handleLinkClick('Improve Grammar')}>Improve Grammar</Button>
                        <Button className="prompt-button" onClick={handleLinkClick('Word cutting adjectives')}>Word cutting adjectives</Button>
                        <Button className="prompt-button" onClick={handleLinkClick('Word cutting adverbs')}>Word cutting adverbs</Button>
                        <Button className="prompt-button" onClick={handleLinkClick('Add Statistics')}>Add Statistic</Button>
                        <Button className="prompt-button" onClick={handleLinkClick('For Example')}>For Example</Button>
                      </div>

                      <div className="custom-prompt-container">
                      <h2 className="lib-title" style={{ color: "white" }}>Custom Prompt</h2>
                        <input
                          type="text"
                          value={customPrompt}
                          onChange={handleCustomPromptInputChange}
                          placeholder="Enter Custom Prompt"
                          className="custom-prompt-input "
                        />
                        <Button className="custom-prompt-button" onClick={handleCustomPromptSubmit}>Submit</Button>
                      </div>
                    </div>

                     

                  ) : (
                    <div className="mini-messages">
                      {messages.map((message, index) => (
                        <div key={index} className={`message-bubble-small ${message.type}`}>
                          {message.text === 'loading' ? (
                            <div className="loading-dots">
                              <span>. </span>
                              <span>. </span>
                              <span>. </span>
                            </div>
                          ) : (
                            message.text
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="input-console">
                  <div className="dropdown-clear-container mb-3">
        <Dropdown onSelect={(key) => setIsInternetSearch(key === 'internet-search')} className="chat-dropdown">
          <Dropdown.Toggle className="upload-button" style={{ backgroundColor: '#383838', color: 'white' }}>
            {isInternetSearch ? 'Internet Search' : 'Library Chat'}
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item eventKey="internet-search">Internet Search</Dropdown.Item>
            <Dropdown.Item eventKey="library-chat">Library Chat</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        <Button className="option-button" onClick={handleClearMessages}>Clear</Button>
      </div>
                    <div className="bid-input-bar">
                        <input
                          type="text"
                          placeholder="Please type your question in here..."
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                        />
                          <button onClick={!isBidPilotLoading ? (isInternetSearch ? handleInternetSearch : handleSendMessage) : null} disabled={isBidPilotLoading}>
          <FontAwesomeIcon icon={faPaperPlane} />
        </button>
                      </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
          
        </div>
      </div>
    </div>
  );
}

export default withAuth(QuestionCrafter);
