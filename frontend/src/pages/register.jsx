import React, { useState } from "react";
import { Link } from "react-router-dom";
export default function RegisterPage({ onSubmit }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    onSubmit?.({ username, email, password });
  }

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
          .authpage-bubble { animation: none !important; }
        }
        @media (max-width: 480px) {
          .authpage-card { padding: 2rem 1.5rem !important; }
        }
        .authpage-input:focus {
          outline: none;
          border-color: #8fd0ff;
          background: rgba(255,255,255,0.14);
        }
        .authpage-btn-primary:hover { background: #74c5ff; }
        .authpage-link:hover { text-decoration: underline; }
      `}</style>

      <ChatBubble fill="#bfe0e6" style={styles.bubbleTopLeft} className="authpage-bubble" />
      <ChatBubble fill="#f4b8ab" style={styles.bubbleBottomRight} className="authpage-bubble" />

      <div style={styles.card} className="authpage-card">
        <h1 style={styles.headline}>Join in</h1>
        <p style={styles.subtext}>Someone's already waiting to chat.</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label} htmlFor="reg-username">
            Username
          </label>
          <input
            id="reg-username"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="What should we call you?"
            className="authpage-input"
            style={styles.input}
          />

          <label style={styles.label} htmlFor="reg-email">
            Email
          </label>
          <input
            id="reg-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="authpage-input"
            style={styles.input}
          />

          <label style={styles.label} htmlFor="reg-password">
            Password
          </label>
          <input
            id="reg-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="authpage-input"
            style={styles.input}
          />

          <label style={styles.label} htmlFor="reg-confirm-password">
            Confirm password
          </label>
          <input
            id="reg-confirm-password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="authpage-input"
            style={styles.input}
          />

          {error && <p style={styles.errorText}>{error}</p>}

          <button type="submit" className="authpage-btn-primary" style={styles.btnPrimary}>
            Create account
          </button>
        </form>

        <p style={styles.footerText}>
          Already have an account?{" "}
          <Link to="/login" className="authpage-link" style={styles.link}>
            Log in
          </Link>
        </p>
        <p style={styles.footerText}>
          <Link to="/" className="authpage-link" style={styles.link}>
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

function ChatBubble({ fill, style, className }) {
  return (
    <svg
      width="120"
      height="112"
      viewBox="0 0 140 130"
      style={style}
      className={className}
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
    justifyContent: "center",
    padding: "4rem 1.5rem",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },
  bubbleTopLeft: {
    position: "absolute",
    top: "8%",
    left: "6%",
    opacity: 0.9,
    animation: "float 6s ease-in-out infinite",
  },
  bubbleBottomRight: {
    position: "absolute",
    bottom: "10%",
    right: "8%",
    opacity: 0.9,
    animation: "float 5s ease-in-out infinite 0.5s",
  },
  card: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 400,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 24,
    padding: "2.75rem 2.5rem",
    boxSizing: "border-box",
    backdropFilter: "blur(6px)",
  },
  headline: {
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "2rem",
    margin: "0 0 0.5rem 0",
  },
  subtext: {
    color: "#b8c4d9",
    fontSize: "1rem",
    margin: "0 0 2rem 0",
    fontWeight: 400,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    color: "#ffffff",
    fontSize: "0.9rem",
    fontWeight: 500,
    marginTop: "0.75rem",
  },
  input: {
    fontFamily: "inherit",
    fontSize: "1rem",
    color: "#ffffff",
    background: "rgba(255,255,255,0.08)",
    border: "1.5px solid rgba(255,255,255,0.25)",
    borderRadius: 14,
    padding: "0.8rem 1rem",
    outline: "none",
    boxSizing: "border-box",
    transition: "background 0.15s ease, border-color 0.15s ease",
  },
  errorText: {
    color: "#ff9a9a",
    fontSize: "0.85rem",
    margin: "0.5rem 0 0 0",
  },
  btnPrimary: {
    fontFamily: "inherit",
    fontWeight: 600,
    fontSize: "1.1rem",
    color: "#0f1f4d",
    background: "#8fd0ff",
    border: "none",
    borderRadius: 18,
    padding: "0.95rem 1.5rem",
    cursor: "pointer",
    boxShadow: "0 6px 0 rgba(0,0,0,0.15)",
    marginTop: "1.5rem",
    transition: "background 0.15s ease",
  },
  footerText: {
    color: "#b8c4d9",
    fontSize: "0.9rem",
    textAlign: "center",
    margin: "1rem 0 0 0",
  },
  link: {
    color: "#8fd0ff",
    fontWeight: 500,
    textDecoration: "none",
  },
};