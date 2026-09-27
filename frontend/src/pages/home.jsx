import React from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage({ onRegister, onLogin, onGuest }) {
 
  return (
    <div style={styles.page}>
      <style>{`
        html, body, #root {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: none !important;
          min-height: 100vh;
          text-align: left !important;
          display: block !important;
          place-items: unset !important;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .homepage-globe { animation: none !important; }
        }
        @media (max-width: 860px) {
          .homepage-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .homepage-bubbles { justify-content: center !important; margin: 0 auto; }
          .homepage-globe-wrap { order: -1; margin-bottom: 1rem; }
          .homepage-buttons { align-items: stretch !important; }
        }
        .homepage-btn:focus-visible {
          outline: 3px solid #ffe29a;
          outline-offset: 2px;
        }
        .homepage-btn-primary:hover { background: #74c5ff; }
        .homepage-btn-secondary:hover { background: rgba(255,255,255,0.14); }
      `}</style>

      <div style={styles.grid} className="homepage-grid">
        {/* Left: copy + bubbles + buttons */}
        <div style={styles.left}>
          <h1 style={styles.headline}>
            Bored?
            <br />
            Someone&apos;s probably bored too.
          </h1>

          <div style={styles.bubbleRow} className="homepage-bubbles">
            <ChatBubble fill="#f4b8ab" style={{ marginRight: -28, zIndex: 1 }} />
            <ChatBubble fill="#bfe0e6" style={{ zIndex: 2 }} />
          </div>

          <div style={styles.buttons} className="homepage-buttons">
            <button
              className="homepage-btn homepage-btn-primary"
              style={styles.btnPrimary}
              onClick={onGuest}
              
            >
              Chat as a guest
            </button>
            <button
              className="homepage-btn homepage-btn-secondary"
              style={styles.btnSecondary}
              onClick={onRegister}
            >
              Register
            </button>
            <button
              className="homepage-btn homepage-btn-secondary"
              style={styles.btnSecondary}
              onClick={onLogin}
            >
              Login
            </button>
          </div>
        </div>

        {/* Right: globe */}
        <div style={styles.globeWrap} className="homepage-globe-wrap">
          <img
            src="src/assets/globe.png"
            alt="Globe"
            className="homepage-globe"
            width="450"
            height="450"
            style={{ animation: "float 5s ease-in-out infinite" }}
          />
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ fill, style }) {
  return (
    <svg
      width="140"
      height="130"
      viewBox="0 0 140 130"
      style={style}
      aria-hidden="true"
    >
      <path
        d="M70 5C33 5 5 29 5 60c0 17 9 32 24 42l-4 20 22-13c7 2 15 3 23 3 37 0 65-24 65-55S107 5 70 5z"
        fill={fill}
      />
      <circle cx="46" cy="60" r="6" fill="#0f1f4d" />
      <circle cx="70" cy="60" r="6" fill="#0f1f4d" />
      <circle cx="94" cy="60" r="6" fill="#0f1f4d" />
    </svg>
  );
}



const navy = "#0f2a6e";
const navyDeep = "#0a1b4a";

const styles = {
  page: {
    minHeight: "100vh",
    width: "100vw",
    background: `radial-gradient(circle at 55% 40%, ${navy} 0%, ${navyDeep} 70%)`,
    fontFamily: "'Fredoka', 'Segoe UI', sans-serif",
    display: "flex",
    alignItems: "center",
    padding: "4rem 6vw",
    boxSizing: "border-box",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    alignItems: "center",
    gap: "2rem",
    width: "100%",
    maxWidth: 1200,
    margin: "0 auto",
  },
  left: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  headline: {
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
    lineHeight: 1.25,
    margin: "0 0 2.5rem 0",
  },
  bubbleRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: "2.5rem",
  },
  buttons: {
    display: "flex",
    flexDirection: "column",
    gap: "0.9rem",
    width: "100%",
    maxWidth: 320,
  },
  btnPrimary: {
    fontFamily: "inherit",
    fontWeight: 600,
    fontSize: "1.15rem",
    color: "#0f1f4d",
    background: "#8fd0ff",
    border: "none",
    borderRadius: 18,
    padding: "1.1rem 1.5rem",
    cursor: "pointer",
    boxShadow: "0 6px 0 rgba(0,0,0,0.15)",
    transition: "background 0.15s ease, transform 0.1s ease",
  },
  btnSecondary: {
    fontFamily: "inherit",
    fontWeight: 500,
    fontSize: "1.05rem",
    color: "#ffffff",
    background: "rgba(255,255,255,0.08)",
    border: "1.5px solid rgba(255,255,255,0.35)",
    borderRadius: 18,
    padding: "0.85rem 1.5rem",
    cursor: "pointer",
    transition: "background 0.15s ease",
  },
  globeWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
};