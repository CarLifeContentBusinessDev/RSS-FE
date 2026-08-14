import AudioUpload from "./AudioUpload.jsx";
import ThumbnailUpload from "./ThumbnailUpload.jsx";

function EpisodeItemFields({
  item,
  onFieldChange,
  onAudioChange,
  currentAudioUrl,
  audioPlaceholder = "오디오 파일 업로드",
  onThumbnailChange,
  currentThumbnailUrl,
  thumbnailPlaceholder = "아이템 썸네일 업로드 (선택)",
  disabled = false,
}) {
  return (
    <>
      <input
        type="text"
        placeholder="아이템 타이틀"
        value={item.title}
        onChange={(e) => onFieldChange("title", e.target.value)}
        required
        disabled={disabled}
        className="maker-input"
      />

      <textarea
        placeholder="아이템 설명 (선택)"
        value={item.description}
        onChange={(e) => onFieldChange("description", e.target.value)}
        disabled={disabled}
        className="maker-textarea"
        rows={2}
      />

      <div className="maker-item__row">
        <label className="maker-item__field">
          <span>발행일</span>
          <input
            type="date"
            value={item.pubDate}
            onChange={(e) => onFieldChange("pubDate", e.target.value)}
            disabled={disabled}
          />
        </label>
        <label className="maker-item__field">
          <span>듀레이션</span>
          <input
            type="text"
            placeholder="오디오 선택 시 자동 계산"
            value={item.duration}
            onChange={(e) => onFieldChange("duration", e.target.value)}
            disabled={disabled}
          />
        </label>
      </div>

      {currentAudioUrl && (
        <p className="maker-item__current-audio">
          현재 오디오:{" "}
          <a href={currentAudioUrl} target="_blank" rel="noreferrer">
            {currentAudioUrl.split("/").pop()}
          </a>
        </p>
      )}

      <AudioUpload
        placeholder={audioPlaceholder}
        onChange={onAudioChange}
        disabled={disabled}
      />

      {currentThumbnailUrl && (
        <p className="maker-item__current-audio">
          현재 썸네일:{" "}
          <a href={currentThumbnailUrl} target="_blank" rel="noreferrer">
            {currentThumbnailUrl.split("/").pop()}
          </a>
        </p>
      )}

      <ThumbnailUpload
        placeholder={thumbnailPlaceholder}
        onChange={onThumbnailChange}
        disabled={disabled}
      />
    </>
  );
}

export default EpisodeItemFields;
