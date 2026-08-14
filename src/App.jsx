import "./App.css";
import { ChannelProvider } from "./context/ChannelContext.jsx";
import YoutubeChannel from "./feature/YoutubeChannel.jsx";
import PodbbangChannel from "./feature/PodbbangChannel.jsx";
import SpotifyChannel from "./feature/SpotifyChannel.jsx";
import ChannelCard from "./feature/ChannelCard.jsx";
import { useState, useEffect } from "react";
import Maker from "./feature/Maker.jsx";

function App() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  return (
    <ChannelProvider>
      <div className="app">
        <header className="app-header">
          <div className="header-text">
            <h1>RSS 피드 생성기</h1>
            <p>YouTube, 팟빵, Spotify를 RSS 피드로 변환 & RSS 생성</p>
          </div>
          <button onClick={() => setIsDark(!isDark)} className="theme-toggle">
            {isDark ? "☀️" : "🌙 "}
          </button>
        </header>
        <main>
          <YoutubeChannel />
          <PodbbangChannel />
          <SpotifyChannel />
          <Maker />
          <ChannelCard />
        </main>
      </div>
    </ChannelProvider>
  );
}

export default App;
