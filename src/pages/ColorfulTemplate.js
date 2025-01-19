import React from 'react';
import './ColorfulTemplate.css';

const ColorfulTemplate = ({ profile }) => {
  return (
    <div className="colorful-template">
      <h1>{profile.username}</h1>
      <p>{profile.jobTitle}</p>
      <p>{profile.company}</p>
      <p>{profile.email}</p>
    </div>
  );
};

export default ColorfulTemplate;