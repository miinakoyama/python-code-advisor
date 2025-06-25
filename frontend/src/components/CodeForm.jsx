import React, { useState } from 'react';
import axios from 'axios';

export default function CodeForm({ onResult }) {
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState('');

  const submit = async () => {
    const res = await axios.post('/submit-code', {
      code,
      challenge_id: challengeId,
    });
    onResult(res.data.feedback);
  };

  return (
    <div className="mb-4">
      <input
        className="border p-2 mb-2 w-full"
        placeholder="Challenge ID"
        value={challengeId}
        onChange={(e) => setChallengeId(e.target.value)}
      />
      <textarea
        className="border p-2 w-full"
        rows={10}
        placeholder="Paste your Python code here"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button className="bg-blue-500 text-white px-4 py-2 mt-2" onClick={submit}>
        Submit
      </button>
    </div>
  );
}
