import React from 'react';
import './SimpleTemplate.css';

const SimpleTemplate = ({ profile }) => {
  if (!profile) {
    return <p>プロフィールが読み込まれていません。</p>;
  }

  return (
    <div className="simple-template">
      <h1>{profile.username}</h1>
      <p>{profile.jobTitle}</p>
      <p>{profile.company}</p>
      <p>{profile.email}</p>
    </div>
  );
};

export default SimpleTemplate;