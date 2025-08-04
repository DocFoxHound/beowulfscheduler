import React from "react";
import { Emoji } from "../types/emoji";

interface EmojiPickerProps {
  emojis: Emoji[];
  selectedEmoji?: Emoji | null;
  onSelect: (emoji: Emoji) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ emojis, selectedEmoji, onSelect }) => {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 120, overflowY: "auto", background: "#181818", borderRadius: 8, padding: 6, border: "1px solid #3bbca9", minWidth: 60, alignItems: "center", justifyContent: "center" }}>
      {emojis.length === 0 ? (
        <span style={{ color: "#aaa", width: "100%", textAlign: "center" }}>No emojis available</span>
      ) : (
        emojis.map((emoji) => (
          <button
            key={emoji.id}
            type="button"
            onClick={() => onSelect(emoji)}
            style={{
              border: "none",
              borderRadius: 6,
              padding: 2,
              cursor: "pointer",
              outline: selectedEmoji?.id === emoji.id ? "2px solid #3bbca9" : "none",
              boxShadow: selectedEmoji?.id === emoji.id ? "0 0 4px #3bbca9" : "none",
            }}
            title={emoji.name}
          >
            <img src={emoji.url} alt={emoji.name} style={{ width: 32, height: 32, borderRadius: 4 }} />
          </button>
        ))
      )}
    </div>
  );
};

export default EmojiPicker;
