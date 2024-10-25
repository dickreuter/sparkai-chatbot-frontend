import * as React from "react";
import { useState } from "react";
import {
  Button,
  Field,
  Textarea,
  tokens,
  makeStyles,
  Dropdown,
  Option,
  SelectionEvents,
  OptionOnSelectData,
} from "@fluentui/react-components";

/* global HTMLTextAreaElement */

interface TextInsertionProps {
  insertText: (text: string) => void;
}

const useStyles = makeStyles({
  instructions: {
    fontWeight: tokens.fontWeightSemibold,
    marginTop: "20px",
    marginBottom: "10px",
  },
  textPromptAndInsertion: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  textAreaField: {
    marginLeft: "20px",
    marginTop: "30px",
    marginBottom: "20px",
    marginRight: "20px",
    maxWidth: "50%",
  },
  dropdown: {
    marginBottom: "20px",
    width: "200px",
  },
});

const TextInsertion: React.FC<TextInsertionProps> = (props: TextInsertionProps) => {
  const [text, setText] = useState<string>("Some text.");
  const [selectedBid, setSelectedBid] = useState<string>("bid1");

  const handleTextInsertion = async () => {
    await props.insertText(text);
  };

  const handleTextChange = async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  const handleBidChange = (_event: SelectionEvents, data: OptionOnSelectData) => {
    if (data.optionValue) {
      setSelectedBid(data.optionValue);
    }
  };

  const styles = useStyles();

  return (
    <div className={styles.textPromptAndInsertion}>
      <Field className={styles.textAreaField} size="large" label="Enter text to be inserted into the document.">
        <Textarea size="large" value={text} onChange={handleTextChange} />
      </Field>
      <Dropdown
        className={styles.dropdown}
        placeholder="Select a bid"
        value={selectedBid}
        onOptionSelect={handleBidChange}
      >
        <Option value="bid1">Bid 1</Option>
        <Option value="bid2">Bid 2</Option>
        <Option value="bid3">Bid 3</Option>
      </Dropdown>
      <Field className={styles.instructions}>Click the button to insert text.</Field>
      <Button appearance="primary" disabled={false} size="large" onClick={handleTextInsertion}>
        Insert text
      </Button>
    </div>
  );
};

export default TextInsertion;
