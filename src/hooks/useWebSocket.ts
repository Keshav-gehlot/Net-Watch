import { useCallback, useEffect, useRef, useState } from "react";

export interface WebSocketOptions {
  url: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onReconnectAttempt?: (attempt: number) => void;
}

export interface WebSocketState {
  socket: WebSocket | null;
  lastMessage: MessageEvent | null;
  readyState: number;
  isConnected: boolean;
  isConnecting: boolean;
  reconnectCount: number;
  error: Event | null;
}

export const useWebSocket = (options: WebSocketOptions): WebSocketState & {
  sendMessage: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
  reconnect: () => void;
  disconnect: () => void;
} => {
  const {
    url,
    protocols,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onOpen,
    onMessage,
    onClose,
    onError,
    onReconnectAttempt
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [readyState, setReadyState] = useState<number>(WebSocket.CONNECTING);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);
  const [error, setError] = useState<Event | null>(null);

  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const socketRef = useRef<WebSocket | null>(null);
  const shouldReconnectRef = useRef(true);

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN || 
        socketRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const newSocket = new WebSocket(url, protocols);
      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.onopen = (event) => {
        setReadyState(WebSocket.OPEN);
        setIsConnected(true);
        setIsConnecting(false);
        setReconnectCount(0);
        setError(null);
        onOpen?.(event);
      };

      newSocket.onmessage = (event) => {
        setLastMessage(event);
        onMessage?.(event);
      };

      newSocket.onclose = (event) => {
        setReadyState(WebSocket.CLOSED);
        setIsConnected(false);
        setIsConnecting(false);
        socketRef.current = null;
        setSocket(null);
        onClose?.(event);

        // Attempt reconnection if it wasn't a manual close
        if (shouldReconnectRef.current && 
            reconnectCount < maxReconnectAttempts && 
            !event.wasClean) {
          const nextAttempt = reconnectCount + 1;
          setReconnectCount(nextAttempt);
          onReconnectAttempt?.(nextAttempt);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval * Math.pow(1.5, nextAttempt - 1)); // Exponential backoff
        }
      };

      newSocket.onerror = (event) => {
        setError(event);
        setIsConnecting(false);
        onError?.(event);
      };

    } catch (err) {
      setIsConnecting(false);
      setError(err as Event);
    }
  }, [url, protocols, reconnectInterval, maxReconnectAttempts, reconnectCount, onOpen, onMessage, onClose, onError, onReconnectAttempt]);

  const sendMessage = useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);
    } else {
      console.warn("WebSocket is not connected. Message not sent:", data);
    }
  }, []);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socketRef.current) {
      socketRef.current.close(1000, "Manual disconnect");
    }
  }, []);

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    setReconnectCount(0);
    if (socketRef.current) {
      socketRef.current.close();
    }
    connect();
  }, [connect]);

  // Initial connection
  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  return {
    socket,
    lastMessage,
    readyState,
    isConnected,
    isConnecting,
    reconnectCount,
    error,
    sendMessage,
    reconnect,
    disconnect
  };
};
