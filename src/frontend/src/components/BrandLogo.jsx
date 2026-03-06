import React from 'react';

export default function BrandLogo({ className = "h-16" }) {
    return (
        <div className={`flex items-center ${className}`}>
            <svg viewBox="0 0 550 120" className="h-full w-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <style>
                        {`
                        @import url('https://fonts.googleapis.com/css2?family=Bitcount+Single&display=swap');
                        
                        /* --- Main Palette (Electric Yellow & Bright Red) --- */
                        .wave { stroke: #FACC15; transition: all 0.3s ease; }
                        .stump { stroke: #FDE047; transition: all 0.3s ease; }
                        .bat-fill { fill: url(#bat-gradient); transition: all 0.3s ease; }
                        .bat-handle { fill: url(#handle-gradient); transition: all 0.3s ease; }
                        .ball { fill: #EF4444; transition: all 0.3s ease; }
                        .text-meme { fill: #FACC15; transition: all 0.3s ease; }
                        .text-cricket { fill: #FFFFFF; transition: all 0.3s ease; }
                        .text-com { fill: #EF4444; transition: all 0.3s ease; }
                        
                        /* Typography Settings */
                        .brand-text {
                            font-family: 'Bitcount Single', system-ui, sans-serif;
                            font-weight: normal;
                            font-size: 28px;
                            letter-spacing: 1px;
                        }
                        `}
                    </style>
                </defs>

                <defs>
                    <linearGradient id="bat-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#a67c32" />
                        <stop offset="20%" stopColor="#e3c285" />
                        <stop offset="40%" stopColor="#f4dbaf" />
                        <stop offset="70%" stopColor="#d2a865" />
                        <stop offset="100%" stopColor="#8b6123" />
                    </linearGradient>
                    <linearGradient id="handle-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#94a3b8" />
                        <stop offset="40%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#64748b" />
                    </linearGradient>
                </defs>

                {/* Left Heartbeat */}
                <path className="wave" d="M 0 70 L 50 70 L 65 90 L 80 20 L 95 110 L 110 40 L 125 70 L 138 70" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Right Heartbeat & Baseline */}
                <path className="wave" d="M 175 70 L 185 70 L 200 20 L 215 110 L 230 40 L 245 90 L 260 70 L 540 70" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Cricket Stumps & Bails */}
                <g className="stump" strokeWidth="2.5" fill="none" strokeLinecap="round">
                    <rect x="140" y="10" width="5" height="105" rx="2.5" />
                    <rect x="154" y="10" width="5" height="105" rx="2.5" />
                    <rect x="168" y="10" width="5" height="105" rx="2.5" />
                    <rect x="139" y="6" width="14" height="3" rx="1.5" />
                    <rect x="155" y="6" width="14" height="3" rx="1.5" />
                </g>

                {/* The Wooden Bat */}
                <g transform="translate(154, 65) rotate(45) translate(-154, -65)">
                    <rect className="bat-handle stump" x="150" y="-5" width="8" height="35" rx="2" strokeWidth="2.5" />
                    <line className="stump" x1="150" y1="5" x2="158" y2="5" strokeWidth="2" />
                    <line className="stump" x1="150" y1="13" x2="158" y2="13" strokeWidth="2" />
                    <line className="stump" x1="150" y1="21" x2="158" y2="21" strokeWidth="2" />
                    <path className="bat-fill stump" d="M 146 30 C 146 30, 154 25, 162 30 L 162 122 C 162 127, 158 130, 154 130 C 150 130, 146 127, 146 122 Z" strokeWidth="2" strokeLinejoin="round" />
                    <path fill="none" stroke="#8b6123" strokeWidth="0.5" d="M 152 30 L 152 125" opacity="0.4" />
                    <path fill="none" stroke="#8b6123" strokeWidth="0.5" d="M 156 28 L 156 128" opacity="0.4" />
                </g>

                {/* The Ball */}
                <circle className="ball stump" cx="115" cy="15" r="8" strokeWidth="1.5" />
                <path d="M 110 11 Q 115 15 120 19" stroke="#ffffff" strokeWidth="1" fill="none" strokeLinecap="round" />
                <path d="M 111 10 Q 117 14 121 18" stroke="#ffffff" strokeWidth="1" fill="none" strokeLinecap="round" />

                {/* Typography */}
                <text x="270" y="62" className="brand-text">
                    <tspan className="text-meme">meme</tspan>
                    <tspan className="text-cricket">cricket</tspan>
                    <tspan className="text-com">.com</tspan>
                </text>
            </svg>
        </div>
    );
}