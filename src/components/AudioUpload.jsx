import {
  useId,
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { formatDuration } from "../utils/duration.js";

const AudioUpload = forwardRef(function AudioUpload(
  { id, placeholder = "오디오 파일 업로드", onChange, disabled = false },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const [audioSrc, setAudioSrc] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioSrc) URL.revokeObjectURL(audioSrc);
    };
  }, [audioSrc]);

  useImperativeHandle(ref, () => ({
    reset() {
      setAudioSrc(null);
      setFileName("");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
  }));

  const processFile = (file) => {
    if (!file || !file.type.startsWith("audio/")) return;

    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setAudioSrc(url);
    onChange?.(file);

    // duration은 오디오 메타데이터 로드 후 비동기로 채워짐
    const probe = new Audio();
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      onChange?.(file, formatDuration(probe.duration));
    };
    probe.src = url;
  };

  const handleInputChange = (e) => {
    processFile(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  return (
    <label
      htmlFor={inputId}
      className={`dropzone dropzone--audio${isDragging ? " dragging" : ""}${disabled ? " disabled" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {audioSrc ? (
        <div className="dropzone-audio">
          <div
            className="dropzone-audio-player-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            <audio controls src={audioSrc} className="dropzone-audio-player" />
          </div>
          <div className="dropzone-caption dropzone-caption--static">
            <span className="dropzone-filename">{fileName}</span>
            <span className="dropzone-change">변경</span>
          </div>
        </div>
      ) : (
        <span className="dropzone-placeholder">{placeholder}</span>
      )}
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="audio/*"
        onChange={handleInputChange}
        disabled={disabled}
        className="dropzone-input"
      />
    </label>
  );
});

export default AudioUpload;
