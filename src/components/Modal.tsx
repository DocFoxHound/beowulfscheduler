import React, { ReactNode } from "react";

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ onClose, children }) => {
  return (
    <div className="modal-backdrop">
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        {children}
      </div>
      <style>{`
        .modal-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }
        .modal-content {
          background: #23272e;
          color: #f1f3f6;
          padding: 2rem 2.5rem 2rem 2.5rem;
          border-radius: 14px;
          min-width: 600px;
          max-width: 600px;
          width: 100%;
          position: relative;
          box-shadow: 0 8px 32px rgba(0,0,0,0.32), 0 1.5px 6px rgba(0,0,0,0.18);
          border: 1px solid #353a40;
          animation: modal-pop 0.18s cubic-bezier(.4,1.4,.6,1) both;
          max-height: 90vh;           /* NEW: limit modal height to 90% of viewport */
          overflow-y: auto;           /* NEW: enable vertical scrolling */
          box-sizing: border-box;     /* NEW: include padding in height */
        }
        @keyframes modal-pop {
          from { transform: scale(0.96) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .modal-close {
          position: absolute;
          top: 0.7rem;
          right: 0.9rem;
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: #b0b8c1;
          transition: color 0.15s;
        }
        .modal-close:hover {
          color: #2d7aee;
        }
        .modal-content input, .modal-content label, .modal-content button {
          color: inherit;
        }
        .modal-content input {
          background: #181a1b;
          border: 1px solid #353a40;
          color: #f1f3f6;
          border-radius: 4px;
          padding: 0.5em;
          margin-top: 0.25em;
          margin-bottom: 1em;
          width: 100%;
        }
        .modal-content button[type="submit"] {
          background: #2d7aee;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0.5em 1.5em;
          margin-right: 0.5em;
          cursor: pointer;
        }
        .modal-content button[type="button"] {
          background: #444;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0.5em 1.5em;
          cursor: pointer;
        }
        .modal-content button[type="submit"]:hover {
          background: #1a5bb8;
        }
        .modal-content button[type="button"]:hover {
          background: #666;
        }
      `}</style>
    </div>
  );
};

export default Modal;