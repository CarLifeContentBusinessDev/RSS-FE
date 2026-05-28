import { useState, useRef, useEffect } from "react";
import { addYouTubeChannel } from "../api";
import { useChannels } from "../context/ChannelContext.jsx";

function YoutubeChannel() {
  const { isLoading, setIsLoading, refreshChannels } = useChannels();
  const [youtubeError, setYoutubeError] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [author, setAuthor] = useState("");
  const [logs, setLogs] = useState([]);
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  function appendLog(text, type = "info") {
    setLogs((prev) => [...prev, { text, type }]);
  }

  async function handleAddChannel(e) {
    e.preventDefault();
    setIsLoading(true);
    setYoutubeError("");
    setLogs([{ text: "채널 정보를 저장하는 중...", type: "info" }]);

    try {
      await addYouTubeChannel(channelUrl, author);
      appendLog("YouTube 채널 등록이 완료되었습니다.", "done");
      await refreshChannels();
      setChannelUrl("");
      setAuthor("");
    } catch (err) {
      setYoutubeError(err.message || "채널 추가 실패");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="add-channel">
      <h2>YouTube 채널/플레이리스트 추가</h2>
      <form onSubmit={handleAddChannel}>
        <div className="form-group">
          <input
            type="text"
            placeholder="youtube.com/@채널명 또는 youtube.com/playlist?list=..."
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            required
            disabled={isLoading}
            className="url-input"
          />
          <input
            type="text"
            placeholder="author (선택)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            disabled={isLoading}
            className="author-input"
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "추가 중..." : "추가"}
          </button>
        </div>
      </form>
      {logs.length > 0 && (
        <div className="terminal" ref={terminalRef}>
          {logs.map((log, i) => (
            <div key={i} className={`terminal-line terminal-line--${log.type}`}>
              {log.text}
            </div>
          ))}
        </div>
      )}
      <p className="notice">
        ※ 오디오 추출 및 R2 업로드가 자동으로 진행됩니다. 시간이 소요될 수
        있습니다.
      </p>
      <p className="notice">
        author는 선택 사항입니다. 이후 수정할 수 있고, 수정 시 RSS도 함께
        업데이트하는 것을 권장합니다.
      </p>
      {youtubeError && <div className="error">{youtubeError}</div>}
    </section>
  );
}

export default YoutubeChannel;
