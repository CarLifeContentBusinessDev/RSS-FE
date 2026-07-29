const API_BASE = import.meta.env.VITE_API_URL;

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message ||
        error.error ||
        `Request failed with status: ${response.status}`,
    );
  }

  return response.json();
}

export async function getChannels() {
  const response = await fetch(`${API_BASE}/api/channels`);
  return response.json();
}

export async function addYouTubeChannel(url, author, imageFile) {
  if (!imageFile) {
    const body = { url };

    if (author?.trim()) {
      body.author = author.trim();
    }

    return postJson(`${API_BASE}/youtube/process`, body);
  }

  // 이미지가 있으면 R2 업로드를 위해 multipart/form-data로 전송
  const formData = new FormData();
  formData.append("url", url);

  if (author?.trim()) {
    formData.append("author", author.trim());
  }

  formData.append("image", imageFile);

  const response = await fetch(`${API_BASE}/youtube/process`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw await parseFormDataError(response);
  }

  return response.json();
}

// 이미지 업로드(multipart/form-data) 응답 에러를 사용자 친화적인 메시지로 변환
// 413(Payload Too Large)의 경우 서버가 JSON 대신 기본 에러 페이지를 반환하므로 별도 처리 필요
async function parseFormDataError(response) {
  if (response.status === 413) {
    return new Error(
      "이미지 파일 용량이 너무 큽니다. 더 작은 이미지로 다시 시도해주세요.",
    );
  }

  const error = await response.json().catch(() => ({}));
  return new Error(
    error.message ||
      error.error ||
      `Request failed with status: ${response.status}`,
  );
}

// EventSource 대신 공통 streamProgress 함수를 사용하도록 통일하고 signal 인자 추가
export function addYouTubeChannelWithProgress(url, onProgress, signal) {
  return streamProgress(
    `${API_BASE}/youtube/process-stream?url=${encodeURIComponent(url)}`,
    onProgress,
    signal,
  );
}

export async function deleteChannel(channelId) {
  const response = await fetch(`${API_BASE}/api/channel/${channelId}`, {
    method: "DELETE",
  });
  return response.json();
}

export async function addPodbbangChannel(channelId) {
  const response = await fetch(`${API_BASE}/api/podbbang/channel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channelId }),
  });
  return response.json();
}

export async function addSpotifyShow(showUrl) {
  const response = await fetch(`${API_BASE}/api/spotify/find-rss`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ spotifyUrl: showUrl }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "RSS feed not found on Apple Podcasts");
  }

  return response.json();
}

// signal 인자 추가
export function addPodbbangChannelWithProgress(channelId, onProgress, signal) {
  return streamProgress(
    `${API_BASE}/api/podbbang/channel-stream?channelId=${encodeURIComponent(channelId)}`,
    onProgress,
    signal,
  );
}

// signal 인자 추가
export function addSpotifyShowWithProgress(spotifyUrl, onProgress, signal) {
  return streamProgress(
    `${API_BASE}/api/spotify/find-rss-stream?spotifyUrl=${encodeURIComponent(spotifyUrl)}`,
    onProgress,
    signal,
  );
}

export function getRssUrl(channelId) {
  return `${API_BASE}/rss/${channelId}`;
}

// 핵심 변경 사항: EventSource -> fetch + ReadableStream으로 교체
async function streamProgress(url, onProgress, signal) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "text/event-stream",
    },
    signal, // React 컴포넌트에서 전달한 취소 신호 연결
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "네트워크 응답이 올바르지 않습니다.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      // 마지막 줄이 불완전하게 잘렸을 수 있으므로 버퍼에 남겨둠
      buffer = lines.pop();

      for (const line of lines) {
        if (line.trim() === "") continue;

        // SSE 표준 포맷인 'data: ...' 형태 파싱
        if (line.startsWith("data: ")) {
          const dataStr = line.replace("data: ", "").trim();
          if (!dataStr) continue;

          let data;
          try {
            data = JSON.parse(dataStr);
          } catch (e) {
            // JSON 파싱 에러 발생 시 스트림 자체를 끊지 않고 해당 청크만 무시
            console.error("SSE JSON 파싱 에러:", e, line);
            continue;
          }

          // 핑(ping) 이벤트는 무시 (연결 유지 목적)
          if (data.type === "ping") {
            continue;
          }

          if (data.type === "complete") {
            return data; // 최종 결과 반환
          } else if (data.type === "error") {
            throw new Error(data.message);
          } else {
            onProgress?.(data); // 진행 상태 콜백 실행
          }
        }
      }
    }
  } finally {
    // 처리가 끝나거나 에러가 발생하면 리더 해제
    reader.releaseLock();
  }

  return null;
}

// update 계열 함수들도 signal 인자 추가
export async function updateYouTubeChannel(channelId, url, author, imageFile) {
  if (!imageFile) {
    const body = { url };

    if (author?.trim()) {
      body.author = author.trim();
    }

    return postJson(`${API_BASE}/youtube/update/${channelId}`, body);
  }

  // 이미지가 있으면 R2 업로드를 위해 multipart/form-data로 전송
  const formData = new FormData();

  if (url) {
    formData.append("url", url);
  }

  if (author?.trim()) {
    formData.append("author", author.trim());
  }

  formData.append("image", imageFile);

  const response = await fetch(`${API_BASE}/youtube/update/${channelId}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw await parseFormDataError(response);
  }

  return response.json();
}

export function updatePodbbangChannel(channelId, onProgress, signal) {
  return streamProgress(
    `${API_BASE}/api/podbbang/update-stream/${channelId}`,
    onProgress,
    signal,
  );
}

export function updateSpotifyChannel(showId, onProgress, signal) {
  return streamProgress(
    `${API_BASE}/api/spotify/update-stream/${showId}`,
    onProgress,
    signal,
  );
}

export async function updateChannel(channelId, type, author) {
  const realId = channelId.replace(/^(youtube-|podbbang_|spotify_)/, "");

  let endpoint = "";
  let options = {
    method: "POST",
    headers: {},
  };

  if (type === "podbbang") {
    endpoint = `/api/podbbang/update/${realId}`;
  } else if (type === "spotify") {
    endpoint = `/api/spotify/update/${realId}`;
  } else {
    endpoint = `/youtube/update/${realId}`;

    const youtubeUrl = realId.startsWith("PL")
      ? `https://www.youtube.com/playlist?list=${realId}`
      : `https://www.youtube.com/channel/${realId}`;

    const body = { url: youtubeUrl };

    if (author?.trim()) {
      body.author = author.trim();
    }

    options.headers = {
      "Content-Type": "application/json",
    };
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Update failed with status: ${response.status}`,
    );
  }

  return response.json();
}
