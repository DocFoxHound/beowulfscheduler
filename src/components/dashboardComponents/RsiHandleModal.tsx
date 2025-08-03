import React, { useState, useEffect } from "react";
import { editUser, getUserById } from "../../api/userService";
import { verifyUser } from "../../api/verifyUserApi";

interface RsiHandleModalProps {
  dbUser: any;
  onClose: () => void;
}

const generateVerificationCode = () => Date.now().toString();

const RsiHandleModal: React.FC<RsiHandleModalProps> = ({ dbUser, onClose }) => {
  const [inputValue, setInputValue] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [verificationCode, setVerificationCode] = useState<string>(dbUser?.verification_code || "");
  const [localDbUser, setLocalDbUser] = useState<any>(dbUser);

  useEffect(() => {
    // If dbUser does not have a verification_code, generate and save it
    if (!localDbUser?.verification_code) {
      const newCode = generateVerificationCode();
      setVerificationCode(newCode);
      // Save to backend
      (async () => {
        try {
          await editUser(localDbUser.id, { verification_code: newCode });
          // Refresh dbUser from backend
          const refreshed = await getUserById(localDbUser.id);
          setLocalDbUser(refreshed);
        } catch (err) {
          setError("Failed to set verification code.");
        }
      })();
    } else {
      setVerificationCode(localDbUser.verification_code);
    }
  }, [localDbUser]);

  const [success, setSuccess] = useState(false);

  const extractHandle = (input: string) => {
    // If input is a link, extract last part
    try {
      const urlMatch = input.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        const url = new URL(urlMatch[0]);
        const parts = url.pathname.split("/").filter(Boolean);
        return parts[parts.length - 1];
      }
    } catch {}
    // Otherwise, return as is
    return input.trim();
  };

  const handleVerify = async () => {
    setVerifying(true);
    setError("");
    const handle = extractHandle(inputValue);
    try {
      const result = await verifyUser(localDbUser.id, handle);
      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="rsi-modal-overlay">
      <div className="rsi-modal">
        <h2>RSI Handle Verification</h2>
        <p>
          Please go to <a href="https://robertsspaceindustries.com/en/account/profile" target="_blank" rel="noopener noreferrer">'https://robertsspaceindustries.com/en/account/profile'</a> and place the following code in your 'Bio' section, save, and then click Verify:
        </p>
        <div className="verification-code-box">{verificationCode}</div>
        <input
          id="rsi-handle-input"
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="RSI handle or link to Dossier"
          style={{ width: "100%", marginBottom: 12 }}
        />
        {error && <div className="error-message">{error}</div>}
        {success && <div style={{ color: '#4caf50', marginBottom: 8 }}>Verification successful!</div>}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} disabled={verifying}>Cancel</button>
          <button onClick={handleVerify} disabled={verifying || !inputValue}>Verify</button>
        </div>
      </div>
      <style>{`
        .rsi-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        .rsi-modal {
          background: #23272f;
          color: #f5f5f5;
          padding: 24px;
          border-radius: 8px;
          min-width: 320px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.2);
        }
        .verification-code-box {
          background: #1c1c1cff;
          padding: 8px 12px;
          border-radius: 4px;
          font-family: monospace;
          margin-bottom: 16px;
          display: block;
          text-align: center;
          margin-left: auto;
          margin-right: auto;
        }
        .error-message {
          color: #c00;
          margin-bottom: 8px;
        }
      `}</style>
    </div>
  );
};

export default RsiHandleModal;
