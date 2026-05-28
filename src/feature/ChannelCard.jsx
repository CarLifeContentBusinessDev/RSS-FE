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
  const [editingAuthorId, setEditingAuthorId] = useState(null);
  const [authorDraft, setAuthorDraft] = useState("");
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

  function isYouTubeChannel(channel) {
    return (
      !channel.type ||
      channel.type === "youtube" ||
      channel.type === "channel" ||
      channel.type === "playlist"
    );
  }

  function getChannelCount(channel) {
    return channel.episodeCount ?? channel.videos?.length ?? 0;
  }

  function startAuthorEdit(channel) {
    setEditingAuthorId(channel.id);
    setAuthorDraft(channel.author ?? "");
    setUpdateLogs([
      {
        text: "author를 수정 완료",
        type: "info",
      },
    ]);
  }

  function cancelAuthorEdit() {
    setEditingAuthorId(null);
    setAuthorDraft("");
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
          if (event.type === "start") {
            appendLog(`총 ${event.episodeCount}개 에피소드`);
          }
          if (event.type === "fetch_page") {
            appendLog(
              `페이지 ${event.current}/${event.episodeCount} 가져오는 중...`,
            );
          }
        });
      } else if (type === "spotify") {
        await updateSpotifyChannel(realId, (event) => {
          if (event.type === "start") {
            appendLog(`총 ${event.episodeCount}개 에피소드`);
          }
          if (event.type === "fetch_page") {
            appendLog(`${event.fetched}/${event.episodeCount} 에피소드 가져옴`);
          }
        });
      } else {
        const youtubeUrl = realId.startsWith("PL")
          ? `https://www.youtube.com/playlist?list=${realId}`
          : `https://www.youtube.com/channel/${realId}`;
        await updateYouTubeChannel(realId, youtubeUrl);
      }

      appendLog("업데이트 완료", "done");
      await refreshChannels();
    } catch (err) {
      appendLog(`오류: ${err.message}`, "error");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleUpdateAuthor(channel) {
    const realId = channel.id.replace(/^(youtube-|podbbang_|spotify_)/, "");
    setUpdatingId(channel.id);
    setUpdateLogs([
      {
        text: "author 정보를 저장하는 중...",
        type: "info",
      },
    ]);

    try {
      await updateYouTubeChannel(
        realId,
        undefined,
        authorDraft.trim() || undefined,
      );
      appendLog(
        "author 수정이 완료되었습니다. RSS도 함께 업데이트하는 것을 권장합니다.",
        "done",
      );
      await refreshChannels();
      cancelAuthorEdit();
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
                  {getChannelCount(channel)}개 에피소드 ·{" "}
                  {new Date(channel.addedAt).toLocaleDateString("ko-KR")} 추가
                </p>
                {isYouTubeChannel(channel) && (
                  <p className="channel-author">
                    author: {channel.author?.trim() ? channel.author : "미설정"}
                  </p>
                )}
              </div>
              <div className="channel-actions">
                <button
                  type="button"
                  onClick={() => copyRssUrl(channel)}
                  className="btn-rss"
                >
                  RSS 복사
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteChannel(channel.id, channel.title)}
                  className="btn-delete"
                >
                  삭제
                </button>
                {isYouTubeChannel(channel) && (
                  <button
                    type="button"
                    onClick={() => startAuthorEdit(channel)}
                    disabled={updatingId !== null}
                  >
                    author 수정
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleUpdate(channel.id, channel.type)}
                  disabled={updatingId !== null}
                >
                  {updatingId === channel.id ? "업데이트 중..." : "업데이트"}
                </button>
              </div>
              {editingAuthorId === channel.id && isYouTubeChannel(channel) && (
                <div className="author-editor">
                  <div className="author-editor__label">기존 author</div>
                  <div className="author-editor__current">
                    {channel.author?.trim() ? channel.author : "미설정"}
                  </div>
                  <p className="author-editor__notice">
                    * author 수정 시에는 에피소드가 아닌 author 정보만
                    업데이트됩니다.
                  </p>
                  <div className="author-editor__form">
                    <input
                      className="author-editor__input"
                      type="text"
                      value={authorDraft}
                      onChange={(e) => setAuthorDraft(e.target.value)}
                      placeholder="새 author 입력"
                      disabled={updatingId === channel.id}
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateAuthor(channel)}
                      disabled={updatingId === channel.id}
                    >
                      {updatingId === channel.id ? "저장 중..." : "저장"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelAuthorEdit}
                      disabled={updatingId === channel.id}
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
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
