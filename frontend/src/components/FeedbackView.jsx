import React from 'react';

export default function FeedbackView({ feedback }) {
  return (
    <div className="bg-gray-100 p-4 rounded">
      <h2 className="text-xl font-semibold mb-2">Feedback</h2>
      <pre className="whitespace-pre-wrap">{feedback}</pre>
    </div>
  );
}
