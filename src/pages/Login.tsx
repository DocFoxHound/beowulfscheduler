/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IS_LIVE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

import "./Login.css"; // Create this file for custom styles

export default function Login() {
  const handleLogin = () => {
    window.location.href = import.meta.env.VITE_IS_LIVE === "true" ? import.meta.env.VITE_LIVE_LOGIN_URL : import.meta.env.VITE_TEST_LOGIN_URL;
  };

  return (
    <div className="login-container">
      {/* <video
        className="background-video"
        autoPlay
        loop
        muted
        playsInline
        src="https://www.youtube.com/watch?v=xvFtfd70o50" // Place your video in the public folder as background.mp4
      /> */}
      <div className="login-content">
        <h1>Welcome to IronPoint</h1>
        <button onClick={handleLogin}>Login with Discord</button>
      </div>
    </div>
  );
}