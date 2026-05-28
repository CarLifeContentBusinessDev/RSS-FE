import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { getChannels } from "../api.js";

const ChannelContext = createContext(null);

const fallbackContext = {
  channels: [],
  isLoading: false,
  setIsLoading: () => {},
  refreshChannels: async () => {},
};

export function ChannelProvider({ children }) {
  const [channels, setChannels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadChannels = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getChannels();
      setChannels(Array.isArray(data) ? data : data.channels || []);
    } catch (err) {
      console.error("Failed to load channels:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  return (
    <ChannelContext.Provider
      value={{
        channels,
        isLoading,
        setIsLoading,
        refreshChannels: loadChannels,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChannels() {
  const context = useContext(ChannelContext);
  if (!context) {
    console.error(
      "ChannelProvider가 제공되지 않았습니다. 기본 컨텍스트를 반환합니다.",
    );
    return fallbackContext;
  }
  return context;
}
