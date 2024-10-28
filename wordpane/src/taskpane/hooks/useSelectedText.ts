import { useEffect, useState } from "react";

export interface UseSelectedTextProps {
  onChange?: (selectedText: string | null) => void;
}

const useSelectedText = ({ onChange }: UseSelectedTextProps) => {
  const [selectedText, setSelectedText] = useState<string | null>(null);
  useEffect(() => {
    const handleSelectionChange = async () => {
      await Word.run(async (context) => {
        const selection = context.document.getSelection();
        selection.load("text");
        await context.sync();
        setSelectedText(selection.text.trim());
        if (onChange) {
          onChange(selection.text.trim());
        }
      });
    };

    Office.context.document.addHandlerAsync(Office.EventType.DocumentSelectionChanged, handleSelectionChange);

    return () => {
      Office.context.document.removeHandlerAsync(Office.EventType.DocumentSelectionChanged, {
        handler: handleSelectionChange,
      });
    };
  }, []);

  return { selectedText };
};

export default useSelectedText;
