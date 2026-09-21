import { useEffect, useLayoutEffect, useRef, useState } from "react";
import YoutubeChannel from "./YoutubeChannel.jsx";
import PodbbangChannel from "./PodbbangChannel.jsx";
import SpotifyChannel from "./SpotifyChannel.jsx";
import CustomChannel from "./CustomChannel.jsx";

const TABS = [
  {
    id: "youtube",
    label: "Youtube",
    accent: "#ff0000",
    Component: YoutubeChannel,
  },
  {
    id: "podbbang",
    label: "팟빵",
    accent: "#00c73c",
    Component: PodbbangChannel,
  },
  {
    id: "spotify",
    label: "Spotify",
    accent: "#1db954",
    Component: SpotifyChannel,
  },
  {
    id: "custom",
    label: "커스텀",
    accent: "#6f4ddb",
    Component: CustomChannel,
  },
];

function ChannelTabs() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const tabBarRef = useRef(null);
  const tabRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({});

  function positionIndicator() {
    const bar = tabBarRef.current;
    const btn = tabRefs.current[activeTab];
    if (!bar || !btn) return;

    const barRect = bar.getBoundingClientRect();
    const rect = btn.getBoundingClientRect();
    setIndicatorStyle({
      left: rect.left - barRect.left,
      width: rect.width,
      background: TABS.find((tab) => tab.id === activeTab)?.accent,
    });
  }

  useLayoutEffect(() => {
    positionIndicator();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    window.addEventListener("resize", positionIndicator);
    return () => window.removeEventListener("resize", positionIndicator);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="register-card">
      <div className="tab-bar" role="tablist" ref={tabBarRef}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className="tab-btn"
            ref={(el) => (tabRefs.current[tab.id] = el)}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <span className="tab-indicator" style={indicatorStyle} />
      </div>

      <div className="tab-panels">
        {TABS.map((tab) => {
          const Component = tab.Component;
          return (
            <div
              key={tab.id}
              className="tab-panel"
              hidden={activeTab !== tab.id}
              role="tabpanel"
            >
              <Component />
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ChannelTabs;
