import React, { useState } from 'react';
import CodeForm from './components/CodeForm';
import FeedbackView from './components/FeedbackView';
import './index.css';

export default function App() {
  const [feedback, setFeedback] = useState(null);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Challenge Advisor</h1>
      <CodeForm onResult={setFeedback} />
      {feedback && <FeedbackView feedback={feedback} />}
    </div>
  );
}
