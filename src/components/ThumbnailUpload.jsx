import {
  useId,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";

const ThumbnailUpload = forwardRef(function ThumbnailUpload(
  { id, placeholder = "채널 썸네일 업로드 (선택)", onChange, disabled = false },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const [imageSrc, setImageSrc] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    reset() {
      setImageSrc(null);
      setFileName("");
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
  }));

  const processFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setImageSrc(reader.result);
    };
    onChange?.(file);
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
      className={`dropzone${isDragging ? " dragging" : ""}${disabled ? " disabled" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {imageSrc ? (
        <>
          <img src={imageSrc} alt="미리보기" className="dropzone-preview" />
          <div className="dropzone-caption">
            <span className="dropzone-filename">{fileName}</span>
            <span className="dropzone-change">변경</span>
          </div>
        </>
      ) : (
        <span className="dropzone-placeholder">{placeholder}</span>
      )}
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        disabled={disabled}
        className="dropzone-input"
      />
    </label>
  );
});

export default ThumbnailUpload;
