import { useState, useRef } from "react";
import { createCustomRss } from "../api.js";
import { useChannels } from "../context/ChannelContext.jsx";
import ThumbnailUpload from "../components/ThumbnailUpload.jsx";
import EpisodeItemFields from "../components/EpisodeItemFields.jsx";

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

let itemSeq = 0;
function createEmptyItem() {
  itemSeq += 1;
  return {
    id: `item-${Date.now()}-${itemSeq}`,
    title: "",
    description: "",
    pubDate: todayDateString(),
    audioFile: null,
    thumbnailFile: null,
    duration: "",
  };
}

function Maker() {
  const { isLoading, setIsLoading, refreshChannels } = useChannels();

  const [channelTitle, setChannelTitle] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [channelImage, setChannelImage] = useState(null);
  const [items, setItems] = useState([createEmptyItem()]);
  const [makerError, setMakerError] = useState("");
  const [logs, setLogs] = useState([]);

  const thumbnailRef = useRef(null);

  function appendLog(text, type = "info") {
    setLogs((prev) => [...prev, { text, type }]);
  }

  function updateItem(id, patch) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function addItem() {
    setItems((prev) => [...prev, createEmptyItem()]);
  }

  function removeItem(id) {
    setItems((prev) =>
      prev.length > 1 ? prev.filter((item) => item.id !== id) : prev,
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMakerError("");

    if (!channelTitle.trim()) {
      setMakerError("채널 타이틀을 입력해주세요");
      return;
    }

    const hasIncompleteItem = items.some(
      (item) => !item.title.trim() || !item.audioFile,
    );
    if (hasIncompleteItem) {
      setMakerError("모든 아이템에 타이틀과 오디오 파일을 입력해주세요");
      return;
    }

    setIsLoading(true);
    setLogs([{ text: "RSS를 생성하는 중...", type: "info" }]);

    try {
      await createCustomRss({
        title: channelTitle.trim(),
        description: channelDescription.trim(),
        image: channelImage,
        items,
      });

      appendLog("RSS 생성이 완료되었습니다.", "done");
      await refreshChannels();
      setChannelTitle("");
      setChannelDescription("");
      setChannelImage(null);
      thumbnailRef.current?.reset();
      setItems([createEmptyItem()]);
    } catch (err) {
      setMakerError(err.message || "RSS 생성 실패");
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="add-channel">
      <h2>RSS 생성</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <div className="form-fields">
            <input
              type="text"
              placeholder="채널 타이틀"
              value={channelTitle}
              onChange={(e) => setChannelTitle(e.target.value)}
              required
              disabled={isLoading}
              className="url-input"
            />
            <textarea
              placeholder="채널 설명 (선택)"
              value={channelDescription}
              onChange={(e) => setChannelDescription(e.target.value)}
              disabled={isLoading}
              className="maker-textarea"
              rows={2}
            />
          </div>

          <ThumbnailUpload
            ref={thumbnailRef}
            placeholder="채널 썸네일 업로드 (선택)"
            onChange={setChannelImage}
            disabled={isLoading}
          />

          <div className="maker-items">
            <div className="maker-items__header">
              <span className="thumbnail-editor__label">아이템 목록</span>
            </div>

            {items.map((item, index) => (
              <div key={item.id} className="maker-item">
                <div className="maker-item__header">
                  <span className="maker-item__index">아이템 {index + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={isLoading}
                      className="maker-item__remove"
                    >
                      삭제
                    </button>
                  )}
                </div>

                <EpisodeItemFields
                  item={item}
                  onFieldChange={(field, value) =>
                    updateItem(item.id, { [field]: value })
                  }
                  onAudioChange={(file, duration) =>
                    updateItem(item.id, {
                      audioFile: file,
                      ...(duration ? { duration } : {}),
                    })
                  }
                  onThumbnailChange={(file) =>
                    updateItem(item.id, { thumbnailFile: file })
                  }
                  disabled={isLoading}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            disabled={isLoading}
            className="maker-add-item"
          >
            + 아이템 추가
          </button>

          <button type="submit" disabled={isLoading}>
            {isLoading ? "생성 중..." : "RSS 생성"}
          </button>
        </div>
      </form>

      {logs.length > 0 && (
        <div className="terminal">
          {logs.map((log, i) => (
            <div key={i} className={`terminal-line terminal-line--${log.type}`}>
              {log.text}
            </div>
          ))}
        </div>
      )}

      <p className="notice">
        ※ 썸네일과 오디오 파일은 R2에 업로드되며, 시간이 소요될 수 있습니다.
      </p>
      {makerError && <div className="error">{makerError}</div>}
    </section>
  );
}

export default Maker;
