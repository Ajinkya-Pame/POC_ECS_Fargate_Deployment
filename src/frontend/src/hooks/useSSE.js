// ============================================================
// useSSE — Custom React hook for Server-Sent Events
// Replaces Supabase real-time subscriptions
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import { getSSEUrl } from '../api';

/**
 * Hook to subscribe to SSE events from the backend.
 *
 * @param {Object} handlers - Object mapping event types to handler functions
 *   Example: {
 *     match_state_update: (data) => setMatchData(data),
 *     commentary_insert: (data) => addComment(data),
 *     commentary_delete: (data) => removeComment(data.id),
 *     roster_update: (data) => refreshRoster(),
 *   }
 * @param {boolean} enabled - Whether to connect (default true)
 * @returns {{ connected: boolean }}
 */
export default function useSSE(handlers, enabled = true) {
    const eventSourceRef = useRef(null);
    const handlersRef = useRef(handlers);
    const connectedRef = useRef(false);

    // Keep handlers ref up to date without re-subscribing
    useEffect(() => {
        handlersRef.current = handlers;
    }, [handlers]);

    const connect = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const es = new EventSource(getSSEUrl());

        es.onopen = () => {
            connectedRef.current = true;
        };

        es.onmessage = (event) => {
            try {
                const parsed = JSON.parse(event.data);
                const { type, data } = parsed;

                if (type === 'connected') {
                    connectedRef.current = true;
                    return;
                }

                const handler = handlersRef.current[type];
                if (handler) {
                    handler(data);
                }
            } catch (err) {
                console.error('SSE parse error:', err);
            }
        };

        es.onerror = () => {
            connectedRef.current = false;
            es.close();
            // Auto-reconnect after 3 seconds
            setTimeout(() => {
                if (enabled) connect();
            }, 3000);
        };

        eventSourceRef.current = es;
    }, [enabled]);

    useEffect(() => {
        if (!enabled) return;

        connect();

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
        };
    }, [connect, enabled]);

    return { connected: connectedRef.current };
}
