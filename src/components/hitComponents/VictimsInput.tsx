import React from "react";

interface VictimsInputProps {
  victimInput: string;
  setVictimInput: React.Dispatch<React.SetStateAction<string>>;
  victimsArray: string[];
  setVictimsArray: React.Dispatch<React.SetStateAction<string[]>>;
  isSubmitting: boolean;
}

const VictimsInput: React.FC<VictimsInputProps> = ({
  victimInput,
  setVictimInput,
  victimsArray,
  setVictimsArray,
  isSubmitting,
}) => {
  const [showInput, setShowInput] = React.useState(false);

  // Helper to add victim
  const addVictim = () => {
    const trimmed = victimInput.trim();
    if (trimmed && !victimsArray.includes(trimmed)) {
      setVictimsArray(arr => [...arr, trimmed]);
    }
    setVictimInput("");
    setShowInput(false);
  };

  return (
    <div>

      {/* Chips or empty indicator */}
      {victimsArray.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0" }}>
          {victimsArray.map((name, idx) => (
            <span
              key={idx}
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "#181a1b",
                color: "#fff",
                borderRadius: 16,
                padding: "4px 12px",
                fontSize: 14,
              }}
            >
              {name}
              <button
                type="button"
                onClick={() => setVictimsArray(arr => arr.filter((_, i) => i !== idx))}
                style={{
                  marginLeft: 8,
                  color: "#ff6b6b",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                }}
                aria-label={`Remove ${name}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div style={{
          margin: "12px 0",
          color: "#aaa",
          fontStyle: "italic",
          background: "#23272e",
          borderRadius: 8,
          padding: "10px 16px",
          textAlign: "center"
        }}>
          No victims added yet
        </div>
      )}

      {/* Add button or input */}
      {!showInput ? (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          style={{
            background: "#2d7aee",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            padding: "6px 18px",
            fontSize: 16,
            cursor: "pointer",
            fontWeight: 500
          }}
          aria-label="Add Victim"
        >
          + Add Victim
        </button>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <input
            type="text"
            value={victimInput}
            onChange={e => setVictimInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && victimInput.trim()) {
                e.preventDefault();
                addVictim();
              } else if (e.key === "Escape") {
                setShowInput(false);
                setVictimInput("");
              }
            }}
            disabled={isSubmitting}
            autoComplete="off"
            style={{ width: 220, fontSize: 16, padding: "6px 10px", borderRadius: 4, border: "1px solid #353a40", background: "#181a1b", color: "#fff" }}
            placeholder="Type a victim name"
            autoFocus
          />
          <button
            type="button"
            onClick={addVictim}
            disabled={isSubmitting || !victimInput.trim()}
            style={{
              background: "#2d7aee",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "6px 14px",
              fontSize: 15,
              cursor: isSubmitting || !victimInput.trim() ? "not-allowed" : "pointer",
              fontWeight: 500
            }}
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setShowInput(false); setVictimInput(""); }}
            style={{
              background: "#444",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              padding: "6px 12px",
              fontSize: 15,
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default VictimsInput;
