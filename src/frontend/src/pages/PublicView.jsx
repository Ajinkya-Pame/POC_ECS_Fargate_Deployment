import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import * as api from '../api';
import useSSE from '../hooks/useSSE';

const getFlag = (team) => {
    const flags = {
        "IND": "🇮🇳", "PAK": "🇵🇰", "ENG": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "AUS": "🇦🇺",
        "SA": "🇿🇦", "NZ": "🇳🇿", "WI": "🏝️", "SL": "🇱🇰", "BAN": "🇧🇩", "AFG": "🇦🇫"
    };
    return flags[team?.toUpperCase()] || "🏏";
};

import TweetEmbed from '../components/TweetEmbed';
import DuckAnimation from '../components/DuckAnimation';
import BrandLogo from '../components/BrandLogo';
import ThemeToggle from '../components/ThemeToggle';

export default function PublicView() {
    const [matchData, setMatchData] = useState({
        team1: "IND", team2: "PAK", score: 0, wickets: 0, overs: 0.0, recentBall: "-", target_score: 0, equation: "", inning: 1,
        striker_name: "Striker", non_striker_name: "Non-Striker", bowler_name: "Bowler",
        striker_runs: 0, striker_balls: 0, non_striker_runs: 0, non_striker_balls: 0,
        bowler_runs_conceded: 0, bowler_wickets: 0, bowler_balls_bowled: 0, is_free_hit: false,
        venue: "", toss_winner: "", toss_decision: "", match_status: "setup",
        extras_wide: 0, extras_nb: 0, extras_bye: 0, extras_lb: 0
    });
    const [commentary, setCommentary] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [rosterList, setRosterList] = useState([]);
    const [scorecardInning, setScorecardInning] = useState(1);
    const [showScorecard, setShowScorecard] = useState(false);
    const [showDuck, setShowDuck] = useState(false);

    const mapMatchState = (d) => ({
        team1: d.team1 || "IND", team2: d.team2 || "PAK",
        score: Number(d.score || 0), wickets: Number(d.wickets || 0), overs: Number(d.overs || 0.0),
        recentBall: d.recent_ball || "-", target_score: Number(d.target_score || 0),
        equation: d.equation || "", inning: Number(d.inning || 1),
        striker_name: d.striker_name ?? "Striker", non_striker_name: d.non_striker_name ?? "Non-Striker",
        bowler_name: d.bowler_name ?? "",
        striker_runs: Number(d.striker_runs || 0), striker_balls: Number(d.striker_balls || 0),
        non_striker_runs: Number(d.non_striker_runs || 0), non_striker_balls: Number(d.non_striker_balls || 0),
        bowler_runs_conceded: Number(d.bowler_runs_conceded || 0), bowler_wickets: Number(d.bowler_wickets || 0),
        bowler_balls_bowled: Number(d.bowler_balls_bowled || 0), is_free_hit: Boolean(d.is_free_hit),
        venue: d.venue || "", toss_winner: d.toss_winner || "", toss_decision: d.toss_decision || "",
        match_status: d.match_status || "setup",
        extras_wide: Number(d.extras_wide || 0), extras_nb: Number(d.extras_nb || 0),
        extras_bye: Number(d.extras_bye || 0), extras_lb: Number(d.extras_lb || 0),
        extras_wide_inn1: Number(d.extras_wide_inn1 || 0), extras_nb_inn1: Number(d.extras_nb_inn1 || 0),
        extras_bye_inn1: Number(d.extras_bye_inn1 || 0), extras_lb_inn1: Number(d.extras_lb_inn1 || 0)
    });

    const refreshRoster = useCallback(async () => {
        try { const data = await api.getRoster(); setRosterList(data); } catch (e) { console.error('Roster fetch error:', e); }
    }, []);

    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `iframe[id^="twitter-widget-"] { max-width: 100% !important; width: 100% !important; }`;
        document.head.appendChild(style);
    }, []);

    // SSE real-time handlers
    const sseHandlers = useCallback(() => ({
        match_state_update: (data) => { setMatchData(mapMatchState(data)); },
        commentary_insert: (data) => { setCommentary(prev => prev.some(c => c.id === data.id) ? prev : [data, ...prev]); },
        commentary_update: (data) => { setCommentary(prev => prev.map(c => c.id === data.id ? data : c)); },
        commentary_delete: (data) => { setCommentary(prev => prev.filter(c => c.id !== data.id)); },
        commentary_clear: () => { setCommentary([]); },
        roster_update: () => { refreshRoster(); },
        roster_clear: () => { setRosterList([]); },
    }), [refreshRoster]);

    useSSE(sseHandlers(), true);

    // Initial data fetch
    useEffect(() => {
        setIsConnected(true);
        const fetchInitialData = async () => {
            try {
                const [commData, matchDataFetch] = await Promise.all([
                    api.getCommentary(),
                    api.getMatchState()
                ]);
                if (commData) setCommentary(commData);
                if (matchDataFetch) setMatchData(mapMatchState(matchDataFetch));
            } catch (e) { console.error('Initial fetch error:', e); setIsConnected(false); }
        };
        fetchInitialData();
        refreshRoster();
    }, [refreshRoster]);

    const getOverSummary = (currentIndex) => {
        let runs = 0; let wickets = 0;
        for (let i = currentIndex; i < commentary.length; i++) {
            const ball = commentary[i];
            if (i !== currentIndex && ball.overs && String(ball.overs).endsWith('.0')) break;
            if (ball.type === 'event' || ball.type === 'tweet') continue;
            const badge = String(ball.event_badge || "").toUpperCase();
            if (badge === 'W' || badge === 'OUT' || badge.startsWith('W+')) wickets += 1;
            const numMatch = badge.match(/\d+/);
            if (numMatch) runs += parseInt(numMatch[0], 10);
            else if (badge === "WD" || badge === "NB" || badge === "1") runs += 1;
        }
        return { runs, wickets };
    };

    const getBadgeStyle = (badge) => {
        if (!badge || badge === '-') return "bg-white text-slate-500 border border-slate-300";
        const b = badge.toUpperCase();
        if (b === 'W' || b === 'OUT' || b.includes('W+')) return "bg-red-500 text-white";
        if (b === '6') return "bg-green-500 text-white";
        if (b === '4') return "bg-blue-500 text-white";
        if (b === 'WD' || b.includes('WD') || b === 'NB' || b.includes('NB')) return "bg-yellow-500 text-white";
        return "bg-white text-slate-700 border border-slate-300";
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-10 transition-colors duration-300">
            {showDuck && <DuckAnimation onComplete={() => setShowDuck(false)} />}

            {/* COMPACT BROADCAST HEADER */}
            <div className="bg-slate-900 text-white relative md:sticky md:top-0 z-50 shadow-xl" style={{ borderBottom: '4px solid #FACC15' }}>
                <div className="max-w-4xl mx-auto w-full px-4 py-5 sm:py-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3">
                        <div className="flex items-center space-x-3">
                            <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse mt-1">LIVE</span>
                            <BrandLogo className="w-40 sm:w-48 h-auto" />
                        </div>
                        <div className="flex items-center space-x-3">
                            {isConnected ? <Wifi size={14} className="text-emerald-400" /> : <WifiOff size={14} className="text-red-400" />}
                            <span className="text-xs font-semibold text-slate-300 tracking-wider flex items-center bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                                {matchData.match_format || 'T20'} &bull; INNING {matchData.inning}
                            </span>
                            <ThemeToggle />
                        </div>
                    </div>

                    {/* Score + Batters + Bowler — Single Compact Row */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                        <div className="flex items-baseline gap-3 flex-wrap">
                            <span className="text-xl font-black">{getFlag(matchData.team1)} {matchData.team1} <span className="text-slate-500 font-normal text-sm">vs</span> {getFlag(matchData.team2)} {matchData.team2}</span>
                            <span className="text-3xl font-black tabular-nums">{matchData.score}/{matchData.wickets}</span>
                            <span className="text-lg text-slate-400 tabular-nums">({matchData.overs.toFixed(1)})</span>
                            {matchData.is_free_hit && <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full animate-bounce">FREE HIT</span>}
                        </div>
                        <div className="bg-slate-800/80 rounded-lg px-3 py-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs border border-slate-700/50">
                            <span className="font-black text-white">{matchData.striker_name} <span className="text-blue-400 font-bold">{matchData.striker_runs}({matchData.striker_balls})*</span></span>
                            <span className="text-slate-500">|</span>
                            <span className="font-medium text-slate-300">{matchData.non_striker_name} {matchData.non_striker_runs}({matchData.non_striker_balls})</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Bowl</span>
                            <span className="font-black text-white">{matchData.bowler_name || "---"}</span> <span className="text-rose-400 font-bold">{matchData.bowler_wickets}/{matchData.bowler_runs_conceded}</span> <span className="text-slate-400">({Math.floor(matchData.bowler_balls_bowled / 6)}.{matchData.bowler_balls_bowled % 6})</span>
                        </div>
                    </div>

                    {/* Target + Recent Balls — Compact */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-1">
                        {matchData.inning === 2 && matchData.target_score > 0 ? (
                            <div className="flex items-center gap-3 text-xs">
                                <span className="text-slate-400">Target <span className="text-white font-black text-sm">{matchData.target_score}</span></span>
                                <span className={`font-black tracking-wide px-3 py-1 rounded-full border text-[11px] ${(matchData.equation && (matchData.equation.includes('won') || matchData.equation.includes('Tied'))) ? 'bg-emerald-900/40 text-emerald-300 border-emerald-800/50' : ''}`} style={!(matchData.equation && (matchData.equation.includes('won') || matchData.equation.includes('Tied'))) ? { backgroundColor: 'rgba(250,204,21,0.15)', color: '#FACC15', borderColor: 'rgba(250,204,21,0.4)' } : {}}>{matchData.equation}</span>
                            </div>
                        ) : (
                            <div></div>
                        )}
                        <div className="flex gap-1 items-center">
                            <span className="text-[9px] text-slate-500 uppercase font-bold mr-1">Recent</span>
                            {commentary.filter(c => c.type !== 'event' && c.event_badge && c.event_badge !== '-').slice(0, 6).reverse().map((c, i) => (
                                <div key={i} className={`min-w-[1.75rem] h-7 px-1.5 rounded-full inline-flex items-center justify-center font-black text-[10px] ${getBadgeStyle(String(c.event_badge))}`}>
                                    {c.event_badge}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* SCORECARD SECTION */}
            {matchData.match_status === 'live' && (
                <div className="max-w-4xl mx-auto w-full px-3 mb-6">
                    {/* Match Info Strip */}
                    {(matchData.venue || matchData.toss_winner) && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium shadow-sm transition-colors duration-300">
                            {matchData.venue && <span>📍 {matchData.venue}</span>}
                            {matchData.toss_winner && <span>🪙 {matchData.toss_winner} won toss, chose to {matchData.toss_decision}</span>}
                        </div>
                    )}

                    {/* Scorecard Toggle */}
                    <button onClick={() => setShowScorecard(!showScorecard)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors mb-3 flex items-center justify-center gap-2">
                        {showScorecard ? '▲ Hide Scorecard' : '▼ View Full Scorecard'}
                    </button>

                    {showScorecard && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-300">
                            {/* Innings Tabs */}
                            <div className="flex border-b border-slate-200 dark:border-slate-800">
                                <button onClick={() => setScorecardInning(1)} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider transition-colors ${scorecardInning === 1 ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white' : 'bg-white text-slate-400 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-500 dark:hover:bg-slate-800/50'}`}>1st Innings</button>
                                <button onClick={() => setScorecardInning(2)} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider transition-colors ${scorecardInning === 2 ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white' : 'bg-white text-slate-400 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-500 dark:hover:bg-slate-800/50'}`}>2nd Innings</button>
                            </div>

                            {(() => {
                                // Determine which team batted/bowled in this scorecard inning
                                // Inning 1: original team1 batted. Inning 2: original team2 batted (but teams swap in match_state)
                                // We derive from roster data: batters are the team with runs_scored/balls_faced > 0 or status batting/out
                                const inningRoster = rosterList.filter(p => p.inning === scorecardInning);
                                const teams = [...new Set(inningRoster.map(p => p.team))];
                                // The batting team has players with balls_faced > 0 or status 'batting'/'out'
                                let battingTeam = teams[0] || '';
                                let bowlingTeam = teams[1] || '';
                                for (const t of teams) {
                                    const hasStats = inningRoster.some(p => p.team === t && (p.balls_faced > 0 || p.status === 'batting' || p.status === 'out'));
                                    const hasBowling = inningRoster.some(p => p.team === t && p.balls_bowled > 0);
                                    if (hasStats && !hasBowling) { battingTeam = t; bowlingTeam = teams.find(x => x !== t) || ''; break; }
                                    if (hasBowling && !hasStats) { bowlingTeam = t; battingTeam = teams.find(x => x !== t) || ''; break; }
                                }

                                const batters = inningRoster.filter(p => p.team === battingTeam).sort((a, b) => {
                                    const aPos = a.batting_position != null ? a.batting_position : 9999;
                                    const bPos = b.batting_position != null ? b.batting_position : 9999;
                                    return aPos - bPos;
                                });
                                const bowlers = inningRoster.filter(p => p.team === bowlingTeam && p.balls_bowled > 0).sort((a, b) => (b.wickets_taken || 0) - (a.wickets_taken || 0));

                                const totalRuns = batters.reduce((s, p) => s + (p.runs_scored || 0), 0);
                                const totalBalls = batters.reduce((s, p) => s + (p.balls_faced || 0), 0);
                                const totalFours = batters.reduce((s, p) => s + (p.fours_count || 0), 0);
                                const totalSixes = batters.reduce((s, p) => s + (p.sixes_count || 0), 0);

                                if (inningRoster.length === 0) {
                                    return <div className="p-8 text-center text-slate-400 text-sm">{scorecardInning === 2 && matchData.inning === 1 ? '2nd innings has not started yet' : 'No data for this innings yet'}</div>;
                                }

                                return (
                                    <>
                                        {/* BATTING CARD */}
                                        <div className="px-4 pt-4 pb-2">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">🏏 {battingTeam} — Batting</h3>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="border-b-2 border-slate-200 text-slate-400 uppercase tracking-wider">
                                                            <th className="text-left py-2 font-bold">Batter</th>
                                                            <th className="text-left py-2 font-bold">Dismissal</th>
                                                            <th className="text-right py-2 font-bold">R</th>
                                                            <th className="text-right py-2 font-bold">B</th>
                                                            <th className="text-right py-2 font-bold">4s</th>
                                                            <th className="text-right py-2 font-bold">6s</th>
                                                            <th className="text-right py-2 font-bold">SR</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {batters.map(p => {
                                                            const sr = p.balls_faced > 0 ? ((p.runs_scored / p.balls_faced) * 100).toFixed(1) : '0.0';
                                                            const isBatting = p.status === 'batting';
                                                            const isOut = p.status === 'out';
                                                            const isDugout = p.status === 'dugout';
                                                            return (
                                                                <tr key={p.id} className={`border-b border-slate-100 dark:border-slate-800/50 ${isBatting ? 'bg-emerald-50/60 dark:bg-emerald-900/20' : ''} ${isDugout && !p.balls_faced ? 'opacity-40' : ''}`}>
                                                                    <td className={`py-2 font-bold ${isBatting ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                                        {p.player_name} {isBatting && p.player_name === matchData.striker_name && <span className="text-[9px] text-emerald-500 dark:text-emerald-400 font-black">⚡ON STRIKE</span>}
                                                                    </td>
                                                                    <td className="py-2 text-slate-400 italic">{isOut ? (p.dismissal_text || 'out') : (isBatting ? 'not out' : (isDugout && !p.balls_faced ? '' : 'not out'))}</td>
                                                                    <td className={`py-2 text-right font-black ${p.runs_scored >= 50 ? 'text-amber-600 dark:text-amber-500' : p.runs_scored >= 30 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>{p.runs_scored || 0}</td>
                                                                    <td className="py-2 text-right text-slate-500 dark:text-slate-400">{p.balls_faced || 0}</td>
                                                                    <td className="py-2 text-right text-slate-500 dark:text-slate-400">{p.fours_count || 0}</td>
                                                                    <td className="py-2 text-right text-slate-500 dark:text-slate-400">{p.sixes_count || 0}</td>
                                                                    <td className={`py-2 text-right font-bold ${parseFloat(sr) > 150 ? 'text-green-600 dark:text-green-500' : parseFloat(sr) < 80 ? 'text-red-500 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>{p.balls_faced > 0 ? sr : '-'}</td>
                                                                </tr>
                                                            );
                                                        })}
                                                        <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                                            <td className="py-2 font-black text-slate-700 dark:text-slate-300" colSpan={2}>Total</td>
                                                            <td className="py-2 text-right font-black text-slate-800 dark:text-slate-200">{totalRuns}</td>
                                                            <td className="py-2 text-right font-bold text-slate-500 dark:text-slate-400">{totalBalls}</td>
                                                            <td className="py-2 text-right font-bold text-slate-500 dark:text-slate-400">{totalFours}</td>
                                                            <td className="py-2 text-right font-bold text-slate-500 dark:text-slate-400">{totalSixes}</td>
                                                            <td className="py-2 text-right"></td>
                                                        </tr>
                                                        {(() => {
                                                            const ew = scorecardInning === 1 ? (matchData.inning === 1 ? matchData.extras_wide : matchData.extras_wide_inn1) : matchData.extras_wide;
                                                            const en = scorecardInning === 1 ? (matchData.inning === 1 ? matchData.extras_nb : matchData.extras_nb_inn1) : matchData.extras_nb;
                                                            const eb = scorecardInning === 1 ? (matchData.inning === 1 ? matchData.extras_bye : matchData.extras_bye_inn1) : matchData.extras_bye;
                                                            const el = scorecardInning === 1 ? (matchData.inning === 1 ? matchData.extras_lb : matchData.extras_lb_inn1) : matchData.extras_lb;
                                                            const totalExtras = ew + en + eb + el;
                                                            if (totalExtras === 0) return null;
                                                            const parts = [];
                                                            if (ew) parts.push(`Wd ${ew}`);
                                                            if (en) parts.push(`NB ${en}`);
                                                            if (eb) parts.push(`B ${eb}`);
                                                            if (el) parts.push(`LB ${el}`);
                                                            return (
                                                                <tr className="bg-amber-50/50 dark:bg-amber-900/10">
                                                                    <td className="py-1.5 text-[10px] font-bold text-amber-700 dark:text-amber-500" colSpan={2}>Extras: {totalExtras} <span className="text-amber-500 dark:text-amber-600 font-normal">({parts.join(', ')})</span></td>
                                                                    <td colSpan={5}></td>
                                                                </tr>
                                                            );
                                                        })()}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* BOWLING CARD */}
                                        {bowlers.length > 0 && (
                                            <div className="px-4 pt-2 pb-4 border-t border-slate-100 dark:border-slate-800">
                                                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">🎯 {bowlingTeam} — Bowling</h3>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-xs">
                                                        <thead>
                                                            <tr className="border-b-2 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                                                <th className="text-left py-2 font-bold">Bowler</th>
                                                                <th className="text-right py-2 font-bold">O</th>
                                                                <th className="text-right py-2 font-bold">R</th>
                                                                <th className="text-right py-2 font-bold">W</th>
                                                                <th className="text-right py-2 font-bold">Econ</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {bowlers.map(p => {
                                                                const overs = `${Math.floor((p.balls_bowled || 0) / 6)}.${(p.balls_bowled || 0) % 6}`;
                                                                const oversNum = (p.balls_bowled || 0) / 6;
                                                                const econ = oversNum > 0 ? ((p.runs_conceded || 0) / oversNum).toFixed(2) : '0.00';
                                                                const isBowling = p.player_name === matchData.bowler_name && scorecardInning === matchData.inning;
                                                                return (
                                                                    <tr key={p.id} className={`border-b border-slate-100 dark:border-slate-800/50 ${isBowling ? 'bg-purple-50/60 dark:bg-purple-900/20' : ''}`}>
                                                                        <td className={`py-2 font-bold ${isBowling ? 'text-purple-700 dark:text-purple-400' : 'text-slate-800 dark:text-slate-200'}`}>{p.player_name} {isBowling && <span className="text-[9px] text-purple-500 dark:text-purple-400 font-black">🎯 BOWLING</span>}</td>
                                                                        <td className="py-2 text-right text-slate-600 dark:text-slate-400 font-mono">{overs}</td>
                                                                        <td className="py-2 text-right text-slate-600 dark:text-slate-300">{p.runs_conceded || 0}</td>
                                                                        <td className={`py-2 text-right font-black ${(p.wickets_taken || 0) >= 3 ? 'text-red-600 dark:text-red-400' : (p.wickets_taken || 0) >= 1 ? 'text-amber-600 dark:text-amber-500' : 'text-slate-600 dark:text-slate-400'}`}>{p.wickets_taken || 0}</td>
                                                                        <td className={`py-2 text-right font-bold ${parseFloat(econ) > 10 ? 'text-red-500 dark:text-red-400' : parseFloat(econ) < 6 ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}`}>{econ}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>
            )}

            {/* FEED */}
            <div className="flex flex-col w-full max-w-2xl mx-auto gap-y-3 items-center px-3 py-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 min-h-[50vh] mt-3 transition-colors duration-300">
                {commentary.length === 0 && (
                    <div className="text-center text-slate-400 dark:text-slate-500 py-10 opacity-60">
                        <RefreshCw className="mx-auto mb-3 w-8 h-8 animate-spin text-slate-300 dark:text-slate-600" />
                        <p className="text-sm font-medium">Waiting for updates...</p>
                    </div>
                )}

                {commentary.map((item, idx) => {
                    const badge = String(item.event_badge || '').toUpperCase();
                    const isEndOfOver = item.overs && String(item.overs).endsWith('.0') && parseFloat(item.overs) >= 1.0 && badge !== 'WD' && badge !== 'NB';
                    let overStats = null;

                    let showSummary = false;
                    if (isEndOfOver) {
                        const currentOverObj = String(item.overs).split('.')[0];
                        const prevItem = idx < commentary.length - 1 ? commentary[idx + 1] : null;
                        const prevItemIsEndOfSameOver = prevItem && prevItem.overs && String(prevItem.overs).split('.')[0] === currentOverObj && String(prevItem.overs).endsWith('.0');

                        if (!prevItemIsEndOfSameOver) {
                            showSummary = true;
                            overStats = getOverSummary(idx);
                        }
                    }

                    return (
                        <div key={item.id} className="w-full">
                            {showSummary && overStats && (
                                <div className="w-full bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 py-3 px-4 rounded-xl flex flex-col items-center gap-1 text-xs font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase mb-4 border border-slate-200 dark:border-slate-700 shadow-sm my-2 transition-colors duration-300">
                                    <div className="flex items-center gap-4">
                                        <span>Over {String(item.overs).split('.')[0]}</span>
                                        <span className="text-slate-300 dark:text-slate-600">|</span>
                                        <span className="text-slate-700 dark:text-slate-300">{overStats.runs} Runs &bull; {overStats.wickets} Wicket{overStats.wickets !== 1 ? 's' : ''}</span>
                                    </div>
                                    {item.bowler_batter_title && (
                                        <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 normal-case tracking-normal mt-0.5">
                                            {item.bowler_batter_title.split(' to ')[0] && <span>🎳 {item.bowler_batter_title.split(' to ')[0]}</span>}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className={item.type === 'tweet' ? "mb-4" : "animate-in fade-in slide-in-from-bottom-4 duration-500 mb-0 border-b border-slate-100 dark:border-slate-800/50 last:border-0"}>
                                {item.type === 'tweet' ? (
                                    <div className="flex justify-center w-full overflow-hidden bg-white dark:bg-slate-900 transition-colors duration-300" style={{ maxWidth: '100%' }}>
                                        <div style={{ maxWidth: '550px', width: '100%' }}>
                                            <TweetEmbed url={item.text} />
                                        </div>
                                    </div>
                                ) : item.type === 'event' ? (
                                    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 border-l-4 border-blue-400 dark:border-blue-500 w-full my-3 rounded-r-2xl relative shadow-sm transition-colors duration-300">
                                        <p className="text-[13px] font-bold text-blue-800 dark:text-blue-400 tracking-tight italic uppercase drop-shadow-sm">
                                            🏏 {item.text}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-row items-start gap-4 py-3 bg-white dark:bg-slate-900 transition-colors duration-300 px-2">
                                        <div className="w-8 pt-1 text-right shrink-0">
                                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tabular-nums">{item.overs || "-"}</span>
                                        </div>
                                        <div className="shrink-0 pt-0.5">
                                            <div className={`min-w-[2rem] h-8 px-2 rounded-full inline-flex items-center justify-center font-black text-[11px] shadow-sm ${getBadgeStyle(String(item.event_badge))}`}>
                                                {String(item.event_badge || "-")}
                                            </div>
                                        </div>
                                        <div className="flex flex-col pb-1">
                                            {item.bowler_batter_title && (
                                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tight mb-0.5">{item.bowler_batter_title}</span>
                                            )}
                                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{item.text}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
