import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useEffect, useRef, useState } from 'react';

export const useStompConnection = () => {
  const [submitConnected, setSubmitConnected] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);

  const submitClientRef = useRef<Client | null>(null);
  const liveClientRef = useRef<Client | null>(null);

  const createClient = (type: 'submit' | 'live', matchId?: string): Client => {
    const socket = new SockJS('http://34.47.150.57:8081/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (str) => console.log(`[${type}] DEBUG: ${str}`),
    });

    client.onConnect = () => {
      console.log(`[${type}] STOMP connected ✅`);
      if (type === 'submit') setSubmitConnected(true);
      if (type === 'live') setLiveConnected(true);

      if (type === 'live' && matchId) {
        client.subscribe(`/topic/match/${matchId}`, (message) => {
          console.log(`[live] Message:`, message.body);
        });
      }
    };

    client.onStompError = (frame) => {
      console.error(`[${type}] STOMP error:`, frame.headers?.message || frame);
      if (type === 'submit') setSubmitConnected(false);
      if (type === 'live') setLiveConnected(false);
    };

    client.onWebSocketClose = () => {
      console.warn(`[${type}] WebSocket closed`);
      if (type === 'submit') setSubmitConnected(false);
      if (type === 'live') setLiveConnected(false);
    };

    client.activate();
    return client;
  };

  const setupClients = (matchId: string) => {
    submitClientRef.current = createClient('submit');
    liveClientRef.current = createClient('live', matchId);
  };

  const publishScore = (destination: string, body: any) => {
    if (submitClientRef.current?.connected) {
      submitClientRef.current.publish({
        destination,
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
      });
    } else {
      throw new Error('Submit client not connected!');
    }
  };

  const disconnect = () => {
    submitClientRef.current?.deactivate();
    liveClientRef.current?.deactivate();
  };

  return {
    submitConnected,
    liveConnected,
    setupClients,
    publishScore,
    disconnect,
  };
};
