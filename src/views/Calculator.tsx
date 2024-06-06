import React, { useState } from 'react';
import SideBarSmall from "../routes/SidebarSmall.tsx";
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';
import "./Calculator.css";

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

  const totalScore = calculateTotalScore();

  return (
    <div className="chatpage">
      <SideBarSmall />
      <div className="lib-container">
        <div className="mb-2">
          <h1 className='heavy'>Bid Qualification Matrix</h1>
        </div>
        <p className='score-text'>Score each question out of 5 where 0 = low/no and 5 = excellent/yes/not applicable</p>
        <div className="bidCardsContainer">
          {categories.map((category, catIndex) => (
            <div key={catIndex}>
              <div className="category-card">
                <div className="card-effect-category">
                  <h5 className='category-header'>{category.name}</h5>
                  {category.questions.map((question, quesIndex) => (
                    <div key={quesIndex} className="question-container">
                      <label className="question-label">{question}</label>
                      <input
                        className="question-input"
                        type="number"
                        min="0"
                        max="5"
                        value={scores[catIndex * category.questions.length + quesIndex]}
                        onChange={(e) => handleScoreChange(catIndex * category.questions.length + quesIndex, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className='result-card'>
          <div className='result-text'>
            <h1 className='heavy'>Your Total Score:</h1>
            <p className='score-text'>(recommendation is do not bid unless score is higher than 60%)</p>
          </div>
          <div className="gauge-container">
            <Gauge
              value={parseFloat(totalScore)}  // Ensure the value is a number
              startAngle={-110}
              endAngle={110}
              valueMax={100}
              color="orange"
              sx={{
                [`& .${gaugeClasses.valueText}`]: {
                  fontSize: 40,
                  fontWeight: 600,
                  transform: 'translate(0px, 0px)',
                },
              }}
              text={({ value, valueMax }) => `${value} / ${valueMax}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BidQualificationMatrix;
