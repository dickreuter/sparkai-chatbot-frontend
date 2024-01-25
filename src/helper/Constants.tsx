export const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'app.mytender.io:7860';
export const HTTP_PREFIX = import.meta.env.VITE_REACT_APP_API_URL_PREFIX_HTTPS? '' : 's';

export const placeholder_upload=`
Enter your QUESTION/ANSWER text here. Separate questions and answers with a new line. For example:
    Question: How do I best win new clients?
    Answer: Provide a great service.
    
Provide feedback previous answers. For example:
    Question: How do I best win new clients?
    Feedback: Make sure the question is answered in only 3 words.

Simple text:
    Any text that can be helpful for answereing questions in plain text format.
    `