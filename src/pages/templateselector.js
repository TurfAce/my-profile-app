// TemplateSelector.js
import React from 'react';

const TemplateSelector = ({ templates, selectedTemplateId, onSelectTemplate }) => {
  return (
    <div className="template-selector">
      <h2>Select a Card Template</h2>
      <div className="template-list">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`template-item ${selectedTemplateId === template.id ? 'selected' : ''}`}
            onClick={() => onSelectTemplate(template.id)}
          >
            <img src={template.imageUrl} alt={template.name} />
            <p>{template.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;