// Modal.js

import React from 'react';
import './Modal2.css';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null; // モーダルが開いていない場合は何も表示しない

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✖</button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
