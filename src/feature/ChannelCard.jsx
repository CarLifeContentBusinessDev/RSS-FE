import { useState, useRef, useEffect } from "react";
import {
  deleteChannel,
  getRssUrl,
  updateYouTubeChannel,
  updatePodbbangChannel,
  updateSpotifyChannel,
} from "../api.js";
import { useChannels } from "../context/ChannelContext.jsx";

function ChannelCard() {
  const { channels, refreshChannels } = useChannels();
  const [updatingId, setUpdatingId] = useState(null);
  const [updateLogs, setUpdateLogs] = useState([]);
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [updateLogs]);

  function appendLog(text, type = "info") {
    setUpdateLogs((prev) => [...prev, { text, type }]);
  }

  function copyRssUrl(channel) {
    const url = channel.externalRssUrl || getRssUrl(channel.id);
    navigator.clipboard.writeText(url);
    alert("RSS URL이 복사되었습니다");
  }

  async function handleDeleteChannel(channelId, channelTitle) {
    if (!confirm(`"${channelTitle}"을(를) 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const result = await deleteChannel(channelId);
      if (result.success) {
        await refreshChannels();
      } else {
        alert("삭제 실패: " + (result.error || "알 수 없는 오류"));
      }
    } catch (err) {
      alert("삭제 실패: " + err.message);
    }
  }

  async function handleUpdate(channelId, type) {
    const realId = channelId.replace(/^(youtube-|podbbang_|spotify_)/, "");
    setUpdatingId(channelId);
    setUpdateLogs([{ text: "업데이트를 시작합니다...", type: "info" }]);

    try {
      if (type === "podbbang") {
        await updatePodbbangChannel(realId, (event) => {
          if (event.type === "start")
            appendLog(`총 ${event.episodeCount}개 에피소드`);
          if (event.type === "fetch_page")
            appendLog(
              `페이지 ${event.current}/${event.episodeCount} 가져오는 중...`,
            );
        });
      } else if (type === "spotify") {
        await updateSpotifyChannel(realId, (event) => {
          if (event.type === "start")
            appendLog(`총 ${event.episodeCount}개 에피소드`);
          if (event.type === "fetch_page")
            appendLog(`${event.fetched}/${event.episodeCount} 에피소드 가져옴`);
        });
      } else {
        const youtubeUrl = realId.startsWith("PL")
          ? `https://www.youtube.com/playlist?list=${realId}`
          : `https://www.youtube.com/channel/${realId}`;
        await updateYouTubeChannel(realId, youtubeUrl, (event) => {
          if (event.type === "start")
            appendLog(`총 ${event.episodeCount}개 영상`);
          if (event.type === "video_start")
            appendLog(
              `[${event.current}/${event.episodeCount}] 처리 중... (${event.videoId})`,
            );
          if (event.type === "video_done")
            appendLog(
              `[${event.current}/${event.episodeCount}] ✓ ${event.title}`,
              "done",
            );
          if (event.type === "video_skip")
            appendLog(
              `[${event.current}/${event.episodeCount}] - ${event.reason}`,
              "skip",
            );
        });
      }
      appendLog("업데이트 완료", "done");
      await refreshChannels();
    } catch (err) {
      appendLog(`오류: ${err.message}`, "error");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="channels">
      <h2>채널 목록 ({channels.length})</h2>
      {channels.length === 0 ? (
        <p className="empty">아직 추가된 채널이 없습니다</p>
      ) : (
        <div className="channel-list">
          {channels.map((channel) => (
            <div key={channel.id} className="channel-card">
              <div className="channel-info">
                <h3>
                  {channel.type === "podbbang" && (
                    <span className="platform-badge podbbang">팟빵</span>
                  )}
                  {channel.type === "spotify" && (
                    <span className="platform-badge spotify">Spotify</span>
                  )}
                  {channel.type === "playlist" && (
                    <span className="platform-badge youtube">플레이리스트</span>
                  )}
                  {(!channel.type ||
                    channel.type === "youtube" ||
                    channel.type === "channel") && (
                    <span className="platform-badge youtube">YouTube</span>
                  )}
                  {channel.title}
                </h3>
                <p className="channel-url">{channel.url}</p>
                <p className="channel-meta">
                  {channel.episodeCount || channel.videos.length}개 에피소드 ·{" "}
                  {new Date(channel.addedAt).toLocaleDateString("ko-KR")} 추가
                </p>
              </div>
              <div className="channel-actions">
                <button onClick={() => copyRssUrl(channel)} className="btn-rss">
                  RSS 복사
                </button>
                <button
                  onClick={() => handleDeleteChannel(channel.id, channel.title)}
                  className="btn-delete"
                >
                  삭제
                </button>
                <button
                  onClick={() => handleUpdate(channel.id, channel.type)}
                  disabled={updatingId !== null}
                >
                  {updatingId === channel.id ? "업데이트 중..." : "업데이트"}
                </button>
              </div>
              <div className="rss-link">
                <code>{channel.externalRssUrl || getRssUrl(channel.id)}</code>
              </div>
              {updatingId === channel.id && updateLogs.length > 0 && (
                <div className="terminal" ref={terminalRef}>
                  {updateLogs.map((log, i) => (
                    <div
                      key={i}
                      className={`terminal-line terminal-line--${log.type}`}
                    >
                      {log.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ChannelCard;
