const API_BASE = import.meta.env.VITE_API_URL;

export async function getChannels() {
  const response = await fetch(`${API_BASE}/api/channels`);
  return response.json();
}

export async function addYouTubeChannel(url) {
  const response = await fetch(`${API_BASE}/youtube/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });
  return response.json();
}

export function addYouTubeChannelWithProgress(url, onProgress) {
  return new Promise((resolve, reject) => {
    const es = new EventSource(
      `${API_BASE}/youtube/process-stream?url=${encodeURIComponent(url)}`,
    );
    let completed = false; // complete 수신 여부 추적

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "complete") {
        completed = true;
        es.close();
        resolve(data); // rssUrl, success, failed, total 모두 포함
      } else if (data.type === "error") {
        completed = true;
        es.close();
        reject(new Error(data.message));
      } else {
        onProgress?.(data);
      }
    };

    es.onerror = () => {
      if (completed) return; // 정상 종료 후 onerror 무시
      es.close();
      reject(new Error("연결 오류"));
    };
  });
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

export function addPodbbangChannelWithProgress(channelId, onProgress) {
  return streamProgress(
    `${API_BASE}/api/podbbang/channel-stream?channelId=${encodeURIComponent(channelId)}`,
    onProgress,
  );
}

export function addSpotifyShowWithProgress(spotifyUrl, onProgress) {
  return streamProgress(
    `${API_BASE}/api/spotify/find-rss-stream?spotifyUrl=${encodeURIComponent(spotifyUrl)}`,
    onProgress,
  );
}

export function getRssUrl(channelId) {
  return `${API_BASE}/rss/${channelId}`;
}

function streamProgress(url, onProgress) {
  return new Promise((resolve, reject) => {
    const es = new EventSource(url);
    let completed = false;

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'complete' || data.type === 'error') {
        completed = true;
        es.close();
        data.type === 'error' ? reject(new Error(data.message)) : resolve(data);
      } else {
        onProgress?.(data);
      }
    };

    es.onerror = () => {
      if (completed) return;
      es.close();
      reject(new Error('연결 오류'));
    };
  });
}

export function updateYouTubeChannel(channelId, url, onProgress) {
  return streamProgress(
    `${API_BASE}/youtube/update-stream/${channelId}?url=${encodeURIComponent(url)}`,
    onProgress,
  );
}

export function updatePodbbangChannel(channelId, onProgress) {
  return streamProgress(
    `${API_BASE}/api/podbbang/update-stream/${channelId}`,
    onProgress,
  );
}

export function updateSpotifyChannel(showId, onProgress) {
  return streamProgress(
    `${API_BASE}/api/spotify/update-stream/${showId}`,
    onProgress,
  );
}

export async function updateChannel(channelId, type) {
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

    options.headers = {
      "Content-Type": "application/json",
    };
    options.body = JSON.stringify({ url: youtubeUrl });
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
