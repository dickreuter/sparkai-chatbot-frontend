export const API_URL = import.meta.env.VITE_REACT_APP_API_URL || '44.208.84.199:7860';
export const HTTP_PREFIX = import.meta.env.VITE_REACT_APP_HTTP_PREFIX || '';


export const prompt1_default = `
This is the background that you should consider when answering the question. Make sure to tailor your response accordingly:
{extra_instructions}

*** This is a pair of template question and answer.
{context}

*** Continue the question by strongly considering the answer from the context.
Answer that needs to be continued is below. If a sentence is started, make sure to just continue it: 
{question}

Continuation:
`

export const prompt2_default= `
This is the background that you should consider when answering the question. Make sure to tailor your response accordingly:
{extra_instructions}

*** This is a pair of template question and answer.
{context}

*** Given the following question respond as same as possible to the template answer if the template question matches the asked question. 
Only adjust the answer accordingly if the asked question differs from the template question. 
Don't be creative at all and only reference this pair of question and answer. Add appropriate formatting and structure to the answer.
Question: {question}
Helpful Answer:
`

export const prompt3_default = `
This is the background that you should consider when answering the question. Make sure to tailor your response accordingly:
{extra_instructions}

*** This is the most relevant context retrieved from the database that you need to use to answer the question:
{context}

***
This is the question you need to answer: 
Question: {question}

Helpful Answer:
`


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