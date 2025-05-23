import { useEffect, useRef, useState } from 'react';
import { useToast } from './use-toast';

interface WebSocketMessage {
  type: string;
  data?: any;
  transactionId?: string;
}

export function useWebSocket(transactionId?: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!transactionId) return;

    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Subscribe to transaction updates
        ws.send(JSON.stringify({
          type: 'subscribe',
          transactionId: transactionId
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          
          // Handle different message types
          if (message.type === 'new_message') {
            toast({
              title: "New message",
              description: `New message from ${message.data?.senderName}`,
            });
          } else if (message.type === 'document_request') {
            toast({
              title: "Document request",
              description: `New document request: ${message.data?.docType}`,
            });
          } else if (message.type === 'status_update') {
            toast({
              title: "Status update",
              description: `Transaction status updated`,
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [transactionId, toast]);

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}