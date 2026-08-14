import { useState, useRef, useEffect } from "react";
import {
  deleteChannel,
  getRssUrl,
  updateYouTubeChannel,
  updatePodbbangChannel,
  updateSpotifyChannel,
  getCustomChannelDetail,
  updateCustomRssChannel,
  addCustomRssItem,
  updateCustomRssItem,
  deleteCustomRssItem,
} from "../api.js";
import { useChannels } from "../context/ChannelContext.jsx";
import ThumbnailUpload from "../components/ThumbnailUpload.jsx";
import EpisodeItemFields from "../components/EpisodeItemFields.jsx";
import { formatDuration } from "../utils/duration.js";

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function emptyItemDraft() {
  return {
    title: "",
    description: "",
    pubDate: todayDateString(),
    duration: "",
    audioFile: null,
    thumbnailFile: null,
  };
}

function ChannelCard() {
  const { channels, refreshChannels } = useChannels();
  const [updatingId, setUpdatingId] = useState(null);
  const [updateLogs, setUpdateLogs] = useState([]);
  const [editingAuthorId, setEditingAuthorId] = useState(null);
  const [authorDraft, setAuthorDraft] = useState("");
  const [editingThumbnailId, setEditingThumbnailId] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);

  const [editingChannelMetaId, setEditingChannelMetaId] = useState(null);
  const [channelMetaDraft, setChannelMetaDraft] = useState({
    title: "",
    description: "",
  });
  const [channelMetaImage, setChannelMetaImage] = useState(null);

  const [managingItemsId, setManagingItemsId] = useState(null);
  const [managedVideos, setManagedVideos] = useState([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [itemsError, setItemsError] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemDraft, setItemDraft] = useState(emptyItemDraft());
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemDraft, setNewItemDraft] = useState(emptyItemDraft());

  const terminalRef = useRef(null);
  const channelMetaThumbnailRef = useRef(null);

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

  function isCustomChannel(channel) {
    return channel.type === "custom";
  }

  function startAuthorEdit(channel) {
    setEditingThumbnailId(null);
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

  function startThumbnailEdit(channel) {
    setEditingAuthorId(null);
    setEditingThumbnailId(channel.id);
    setThumbnailFile(null);
    setUpdateLogs([
      {
        text: "업로드할 썸네일 이미지를 선택해주세요",
        type: "info",
      },
    ]);
  }

  function cancelThumbnailEdit() {
    setEditingThumbnailId(null);
    setThumbnailFile(null);
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

  async function handleUpdateThumbnail(channel) {
    if (!thumbnailFile) {
      alert("업로드할 이미지를 선택해주세요");
      return;
    }

    const realId = channel.id.replace(/^(youtube-|podbbang_|spotify_)/, "");
    setUpdatingId(channel.id);
    setUpdateLogs([
      {
        text: "썸네일을 업로드하는 중...",
        type: "info",
      },
    ]);

    try {
      await updateYouTubeChannel(realId, undefined, undefined, thumbnailFile);
      appendLog("썸네일 수정이 완료되었습니다.", "done");
      await refreshChannels();
      cancelThumbnailEdit();
      alert("채널 썸네일이 업데이트되었습니다.");
    } catch (err) {
      appendLog(`오류: ${err.message}`, "error");
      alert(`썸네일 업데이트 실패: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  }

  function startChannelMetaEdit(channel) {
    setEditingAuthorId(null);
    setEditingThumbnailId(null);
    setManagingItemsId(null);
    setEditingChannelMetaId(channel.id);
    setChannelMetaDraft({
      title: channel.title ?? "",
      description: channel.description ?? "",
    });
    setChannelMetaImage(null);
  }

  function cancelChannelMetaEdit() {
    setEditingChannelMetaId(null);
    channelMetaThumbnailRef.current?.reset();
  }

  async function handleUpdateChannelMeta(channel) {
    if (!channelMetaDraft.title.trim()) {
      alert("채널 타이틀을 입력해주세요");
      return;
    }

    setUpdatingId(channel.id);
    setUpdateLogs([{ text: "채널 정보를 저장하는 중...", type: "info" }]);

    try {
      await updateCustomRssChannel(
        channel.id,
        channelMetaDraft,
        channelMetaImage,
      );
      appendLog("채널 정보 수정이 완료되었습니다.", "done");
      await refreshChannels();
      cancelChannelMetaEdit();
    } catch (err) {
      appendLog(`오류: ${err.message}`, "error");
    } finally {
      setUpdatingId(null);
    }
  }

  async function loadManagedItems(channelId) {
    setIsLoadingItems(true);
    setItemsError("");

    try {
      const detail = await getCustomChannelDetail(channelId);
      setManagedVideos(detail.videos ?? []);
    } catch (err) {
      setItemsError(err.message || "아이템을 불러오지 못했습니다");
      setManagedVideos([]);
    } finally {
      setIsLoadingItems(false);
    }
  }

  function startManageItems(channel) {
    setEditingAuthorId(null);
    setEditingThumbnailId(null);
    setEditingChannelMetaId(null);
    setManagingItemsId(channel.id);
    setEditingItemId(null);
    setIsAddingItem(false);
    loadManagedItems(channel.id);
  }

  function closeManageItems() {
    setManagingItemsId(null);
    setEditingItemId(null);
    setIsAddingItem(false);
    setManagedVideos([]);
    setItemsError("");
  }

  function startEditItem(item) {
    setIsAddingItem(false);
    setEditingItemId(item.id);
    const pubDate = item.publishedAt ?? item.uploadDate;
    setItemDraft({
      title: item.title ?? "",
      description: item.description ?? "",
      pubDate: pubDate ? pubDate.slice(0, 10) : todayDateString(),
      duration: formatDuration(item.duration),
      audioFile: null,
      thumbnailFile: null,
    });
  }

  function cancelEditItem() {
    setEditingItemId(null);
  }

  async function handleSaveItem(channel, itemId) {
    if (!itemDraft.title.trim()) {
      alert("아이템 타이틀을 입력해주세요");
      return;
    }

    setUpdatingId(channel.id);
    setUpdateLogs([{ text: "아이템을 저장하는 중...", type: "info" }]);

    try {
      await updateCustomRssItem(
        channel.id,
        itemId,
        itemDraft,
        itemDraft.audioFile,
        itemDraft.thumbnailFile,
      );
      appendLog("아이템 수정이 완료되었습니다.", "done");
      await Promise.all([refreshChannels(), loadManagedItems(channel.id)]);
      setEditingItemId(null);
    } catch (err) {
      appendLog(`오류: ${err.message}`, "error");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteItem(channel, item) {
    if (!confirm(`"${item.title}" 아이템을 삭제하시겠습니까?`)) {
      return;
    }

    setUpdatingId(channel.id);
    setUpdateLogs([{ text: "아이템을 삭제하는 중...", type: "info" }]);

    try {
      await deleteCustomRssItem(channel.id, item.id);
      appendLog("아이템이 삭제되었습니다.", "done");
      await Promise.all([refreshChannels(), loadManagedItems(channel.id)]);
    } catch (err) {
      appendLog(`오류: ${err.message}`, "error");
    } finally {
      setUpdatingId(null);
    }
  }

  function startAddItem() {
    setEditingItemId(null);
    setIsAddingItem(true);
    setNewItemDraft(emptyItemDraft());
  }

  function cancelAddItem() {
    setIsAddingItem(false);
  }

  async function handleAddItem(channel) {
    if (!newItemDraft.title.trim() || !newItemDraft.audioFile) {
      alert("타이틀과 오디오 파일을 입력해주세요");
      return;
    }

    setUpdatingId(channel.id);
    setUpdateLogs([{ text: "아이템을 추가하는 중...", type: "info" }]);

    try {
      await addCustomRssItem(
        channel.id,
        newItemDraft,
        newItemDraft.audioFile,
        newItemDraft.thumbnailFile,
      );
      appendLog("아이템이 추가되었습니다.", "done");
      await Promise.all([refreshChannels(), loadManagedItems(channel.id)]);
      setIsAddingItem(false);
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
                  {channel.type === "custom" && (
                    <span className="platform-badge custom">custom</span>
                  )}
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
                {channel.type !== "custom" && (
                  <p className="channel-url">{channel.url}</p>
                )}

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
                  <div className="flex-gap-6">
                    <button
                      type="button"
                      onClick={() => startAuthorEdit(channel)}
                      disabled={updatingId !== null}
                    >
                      author 수정
                    </button>
                    <button
                      type="button"
                      onClick={() => startThumbnailEdit(channel)}
                      disabled={updatingId !== null}
                    >
                      채널 썸네일 수정
                    </button>
                  </div>
                )}
                {isCustomChannel(channel) && (
                  <div className="flex-gap-6">
                    <button
                      type="button"
                      onClick={() => startChannelMetaEdit(channel)}
                      disabled={updatingId !== null}
                    >
                      채널 정보 수정
                    </button>
                    <button
                      type="button"
                      onClick={() => startManageItems(channel)}
                      disabled={updatingId !== null}
                    >
                      아이템 관리
                    </button>
                  </div>
                )}
                {!isCustomChannel(channel) && (
                  <button
                    type="button"
                    onClick={() => handleUpdate(channel.id, channel.type)}
                    disabled={updatingId !== null}
                  >
                    {updatingId === channel.id ? "업데이트 중..." : "업데이트"}
                  </button>
                )}
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
              {editingThumbnailId === channel.id &&
                isYouTubeChannel(channel) && (
                  <div className="thumbnail-editor">
                    <div className="thumbnail-editor__label">
                      채널 썸네일 업로드
                    </div>
                    <p className="thumbnail-editor__notice">
                      * 썸네일 수정 시에는 에피소드가 아닌 썸네일 이미지만
                      업데이트됩니다.
                    </p>
                    <ThumbnailUpload
                      onChange={setThumbnailFile}
                      disabled={updatingId === channel.id}
                    />
                    <div className="thumbnail-editor__actions">
                      <button
                        type="button"
                        onClick={() => handleUpdateThumbnail(channel)}
                        disabled={updatingId === channel.id || !thumbnailFile}
                      >
                        {updatingId === channel.id ? "업로드 중..." : "저장"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelThumbnailEdit}
                        disabled={updatingId === channel.id}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              {editingChannelMetaId === channel.id &&
                isCustomChannel(channel) && (
                  <div className="thumbnail-editor">
                    <div className="thumbnail-editor__label">
                      채널 정보 수정
                    </div>
                    <div className="form-fields">
                      <input
                        type="text"
                        placeholder="채널 타이틀"
                        value={channelMetaDraft.title}
                        onChange={(e) =>
                          setChannelMetaDraft((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        disabled={updatingId === channel.id}
                        className="maker-input"
                      />
                      <textarea
                        placeholder="채널 설명 (선택)"
                        value={channelMetaDraft.description}
                        onChange={(e) =>
                          setChannelMetaDraft((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        disabled={updatingId === channel.id}
                        className="maker-textarea"
                        rows={2}
                      />
                      <ThumbnailUpload
                        ref={channelMetaThumbnailRef}
                        placeholder="새 썸네일 업로드 (선택, 비워두면 기존 유지)"
                        onChange={setChannelMetaImage}
                        disabled={updatingId === channel.id}
                      />
                    </div>
                    <div className="thumbnail-editor__actions">
                      <button
                        type="button"
                        onClick={() => handleUpdateChannelMeta(channel)}
                        disabled={
                          updatingId === channel.id ||
                          !channelMetaDraft.title.trim()
                        }
                      >
                        {updatingId === channel.id ? "저장 중..." : "저장"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelChannelMetaEdit}
                        disabled={updatingId === channel.id}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              {managingItemsId === channel.id && isCustomChannel(channel) && (
                <div className="thumbnail-editor">
                  <div className="thumbnail-editor__label">아이템 관리</div>

                  {isLoadingItems && (
                    <p className="thumbnail-editor__notice">
                      아이템을 불러오는 중...
                    </p>
                  )}

                  {itemsError && <div className="error">{itemsError}</div>}

                  {!isLoadingItems &&
                    !itemsError &&
                    managedVideos.length === 0 &&
                    !isAddingItem && (
                      <p className="thumbnail-editor__notice">
                        등록된 아이템이 없습니다. 아래에서 추가해주세요.
                      </p>
                    )}

                  <div className="maker-item-manager__list">
                    {managedVideos.map((video) =>
                      editingItemId === video.id ? (
                        <div key={video.id} className="maker-item">
                          <EpisodeItemFields
                            item={itemDraft}
                            onFieldChange={(field, value) =>
                              setItemDraft((prev) => ({
                                ...prev,
                                [field]: value,
                              }))
                            }
                            onAudioChange={(file, duration) =>
                              setItemDraft((prev) => ({
                                ...prev,
                                audioFile: file,
                                ...(duration ? { duration } : {}),
                              }))
                            }
                            currentAudioUrl={video.audioPath}
                            audioPlaceholder="오디오 교체 (선택, 비워두면 기존 오디오 유지)"
                            onThumbnailChange={(file) =>
                              setItemDraft((prev) => ({
                                ...prev,
                                thumbnailFile: file,
                              }))
                            }
                            currentThumbnailUrl={video.thumbnail}
                            thumbnailPlaceholder="썸네일 교체 (선택, 비워두면 기존 썸네일 유지)"
                            disabled={updatingId === channel.id}
                          />
                          <div className="thumbnail-editor__actions">
                            <button
                              type="button"
                              onClick={() => handleSaveItem(channel, video.id)}
                              disabled={
                                updatingId === channel.id ||
                                !itemDraft.title.trim()
                              }
                            >
                              {updatingId === channel.id
                                ? "저장 중..."
                                : "저장"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditItem}
                              disabled={updatingId === channel.id}
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div key={video.id} className="maker-item-manager__row">
                          <div className="maker-item-manager__info">
                            <span className="maker-item-manager__title">
                              {video.title}
                            </span>
                            <span className="maker-item-manager__meta">
                              {(video.publishedAt ?? video.uploadDate)
                                ? new Date(
                                    video.publishedAt ?? video.uploadDate,
                                  ).toLocaleDateString("ko-KR")
                                : ""}
                              {video.duration
                                ? ` · ${formatDuration(video.duration)}`
                                : ""}
                            </span>
                          </div>
                          <div className="flex-gap-6">
                            <button
                              type="button"
                              onClick={() => startEditItem(video)}
                              disabled={updatingId !== null}
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(channel, video)}
                              disabled={updatingId !== null}
                              className="maker-item__remove"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  {isAddingItem ? (
                    <div className="maker-item">
                      <EpisodeItemFields
                        item={newItemDraft}
                        onFieldChange={(field, value) =>
                          setNewItemDraft((prev) => ({
                            ...prev,
                            [field]: value,
                          }))
                        }
                        onAudioChange={(file, duration) =>
                          setNewItemDraft((prev) => ({
                            ...prev,
                            audioFile: file,
                            ...(duration ? { duration } : {}),
                          }))
                        }
                        audioPlaceholder="오디오 파일 업로드"
                        onThumbnailChange={(file) =>
                          setNewItemDraft((prev) => ({
                            ...prev,
                            thumbnailFile: file,
                          }))
                        }
                        disabled={updatingId === channel.id}
                      />
                      <div className="thumbnail-editor__actions">
                        <button
                          type="button"
                          onClick={() => handleAddItem(channel)}
                          disabled={
                            updatingId === channel.id ||
                            !newItemDraft.title.trim() ||
                            !newItemDraft.audioFile
                          }
                        >
                          {updatingId === channel.id ? "추가 중..." : "추가"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelAddItem}
                          disabled={updatingId === channel.id}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startAddItem}
                      disabled={updatingId !== null}
                      className="maker-add-item"
                    >
                      + 아이템 추가
                    </button>
                  )}

                  <div className="thumbnail-editor__actions">
                    <button
                      type="button"
                      onClick={closeManageItems}
                      disabled={updatingId !== null}
                    >
                      닫기
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
