import React, { useEffect, useRef } from 'react';

export default function TweetEmbed({ url }) {
    const containerRef = useRef(null);
    const hasRendered = useRef(false);

    useEffect(() => {
        // Guard: If we've already called createTweet for this URL, do NOT call again.
        // This ref persists across React StrictMode unmount/remount cycles.
        if (hasRendered.current) return;

        const match = url.match(/(?:x|twitter)\.com\/\w+\/status\/(\d+)/i);
        const tweetId = match ? match[1] : null;

        if (tweetId && containerRef.current && window.twttr && window.twttr.widgets) {
            hasRendered.current = true; // Lock BEFORE the async call
            containerRef.current.innerHTML = '';
            window.twttr.widgets.createTweet(tweetId, containerRef.current, {
                theme: 'dark',
                align: 'center',
                conversation: 'none'
            });
        }

        // Do NOT clear innerHTML on cleanup — let the widget persist across StrictMode remounts
    }, [url]);

    return (
        <div className="w-full flex justify-center py-2">
            <div ref={containerRef} style={{ maxWidth: '550px', width: '100%' }} className="overflow-hidden" />
        </div>
    );
}
