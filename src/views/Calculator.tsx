import React, { useState } from 'react';
import "./Chatbot.css";
import SideBarSmall from "../routes/SidebarSmall.tsx";

const categories = [
  { name: "STRATEGY", importance: 30, questions: [
      "The solution fits our strategy?",
      "The project is definitely going to happen?",
      "We have the budget and exec sponsorship to proceed?",
      "We have the ability and resources to deliver the solution?",
      "This is a new growth opportunity for us?",
      "This is a similar service to our current core business?"
    ]
  },
  { name: "CUSTOMER", importance: 50, questions: [
      "We have a good relationship with this customer?",
      "This is an existing customer?",
      "If an existing customer, they are satisfied with our service?",
      "If not a customer, they are unhappy with existing supplier?",
      "We know the decision criteria for the bid?",
      "We know the decision-makers for the bid?",
      "We know the client's problems?",
      "We know what the client seeks to achieve?"
    ]
  },
  { name: "COMPETITORS", importance: 10, questions: [
      "We know who we're competing against?",
      "The requirements fit us, it's not wired for a competitor?",
      "We have a clear competitive advantage?"
    ]
  },
  { name: "RISKS", importance: 10, questions: [
      "There is no risk to us e.g. health & safety; reputational; financial, etc.?",
      "We can deliver the bid on time and within budget?",
      "We can mitigate the risks?"
    ]
  }
];

const BidQualificationMatrix = () => {
  const [scores, setScores] = useState(Array(20).fill(0));

  const handleScoreChange = (index, value) => {
    const newScores = [...scores];
    newScores[index] = parseInt(value);
    setScores(newScores);
  };

  const calculateTotalScore = () => {
    let totalScore = 0;
    let totalImportance = 0;
    let scoreIndex = 0;

    categories.forEach(category => {
      let categoryScore = 0;
      category.questions.forEach(() => {
        categoryScore += scores[scoreIndex];
        scoreIndex++;
      });
      totalScore += (categoryScore / (category.questions.length * 5)) * category.importance;
      totalImportance += category.importance;
    });

    return ((totalScore / totalImportance) * 100).toFixed(2);
  };

  return (

    <div>

      <SideBarSmall />

      <h1>Bid Qualification Matrix</h1>
      <p>Score each question out of 5 where 0 = low/no and 5 = excellent/yes/not applicable</p>
      {categories.map((category, catIndex) => (
        <div key={catIndex}>
          <h2>{category.name}</h2>
          {category.questions.map((question, quesIndex) => (
            <div key={quesIndex}>
              <label>{question}</label>
              <input
                type="number"
                min="0"
                max="5"
                value={scores[catIndex * category.questions.length + quesIndex]}
                onChange={(e) => handleScoreChange(catIndex * category.questions.length + quesIndex, e.target.value)}
              />
            </div>
          ))}
        </div>
      ))}
      <h2>Your Total Score: {calculateTotalScore()}%</h2>
      <p>(recommendation is do not bid unless score is higher than 60%)</p>
    </div>
  );
};

export default BidQualificationMatrix;
