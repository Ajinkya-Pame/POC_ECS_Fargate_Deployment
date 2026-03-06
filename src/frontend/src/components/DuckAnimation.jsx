import React, { useEffect, useState } from 'react';

/**
 * DuckAnimation displays a CSS-animated duck walking across the screen
 * when triggered. It self-unmounts after the animation finishes.
 */
export default function DuckAnimation({ onComplete }) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // The animation takes about 4 seconds. We unmount afterwards.
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete();
        }, 4500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden flex items-center">
            {/* 
        Duck container moves from right to left across the screen.
        Using arbitrary Tailwind values for the specific animation.
      */}
            <div
                className="text-[120px] absolute"
                style={{
                    animation: 'walk-across 4s linear forwards',
                    filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.5))'
                }}
            >
                🦆
            </div>

            <style>{`
        @keyframes walk-across {
          0% {
            right: -150px;
            transform: translateY(0px) rotate(-10deg);
          }
          10% { transform: translateY(-30px) rotate(10deg); }
          20% { transform: translateY(0px) rotate(-10deg); }
          30% { transform: translateY(-30px) rotate(10deg); }
          40% { transform: translateY(0px) rotate(-10deg); }
          50% { transform: translateY(-30px) rotate(10deg); }
          60% { transform: translateY(0px) rotate(-10deg); }
          70% { transform: translateY(-30px) rotate(10deg); }
          80% { transform: translateY(0px) rotate(-10deg); }
          90% { transform: translateY(-30px) rotate(10deg); }
          100% {
            right: 110vw;
            transform: translateY(0px) rotate(-10deg);
          }
        }
      `}</style>
        </div>
    );
}
