import React, { useState, useEffect, useCallback } from 'react';
import { Send, Wifi, WifiOff, RefreshCw, Trash2, LockOpen, Edit2, X, Check, Users } from 'lucide-react';
import AdminAuth from './AdminAuth';
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

export default function AdminView() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAdminEnabled") === "true"
  );

  const [matchData, setMatchData] = useState({
    team1: "IND", team2: "PAK", score: 0, wickets: 0, overs: 0.0, recentBall: "-", target_score: 0, equation: "", inning: 1, match_format: "T20",
    striker_name: "Striker", non_striker_name: "Non-Striker", bowler_name: "",
    striker_runs: 0, striker_balls: 0, non_striker_runs: 0, non_striker_balls: 0,
    bowler_runs_conceded: 0, bowler_wickets: 0, bowler_balls_bowled: 0, is_free_hit: false,
    venue: "", toss_winner: "", toss_decision: "", match_status: "setup",
    extras_wide: 0, extras_nb: 0, extras_bye: 0, extras_lb: 0
  });
  const [commentary, setCommentary] = useState([]);
  const [adminInput, setAdminInput] = useState("");
  const [tweetMode, setTweetMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Inputs
  const [targetInput, setTargetInput] = useState("");
  const [commEvent, setCommEvent] = useState("");

  // Roster Inputs
  const [strikerInput, setStrikerInput] = useState("");
  const [nonStrikerInput, setNonStrikerInput] = useState("");
  const [bowlerInput, setBowlerInput] = useState("");

  // Roster Data from Backend
  const [rosterList, setRosterList] = useState([]);

  // Edit CRUD States
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editBadge, setEditBadge] = useState("");
  const [lockedTitle, setLockedTitle] = useState("");
  const [activeScore, setActiveScore] = useState(null);

  // Wicket Modal States
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [pendingWicket, setPendingWicket] = useState(null);
  const [nextBatter, setNextBatter] = useState("");
  const [dismissalType, setDismissalType] = useState("");
  const [wicketFielder, setWicketFielder] = useState("");
  const [wicketWhoOut, setWicketWhoOut] = useState("S");
  const [wicketRunsCompleted, setWicketRunsCompleted] = useState("0");
  const [showOverBanner, setShowOverBanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNBModal, setShowNBModal] = useState(false);
  const [showDuck, setShowDuck] = useState(false);

  // Pre-Match Setup States
  const [setupTeam1, setSetupTeam1] = useState("IND");
  const [setupTeam2, setSetupTeam2] = useState("PAK");
  const [setupVenue, setSetupVenue] = useState("");
  const [setupTossWinner, setSetupTossWinner] = useState("team1");
  const [setupTossDecision, setSetupTossDecision] = useState("bat");
  const [rosterTeam1, setRosterTeam1] = useState("");
  const [rosterTeam2, setRosterTeam2] = useState("");
  const [setupMatchFormat, setSetupMatchFormat] = useState("T20");

  // Helper to map backend row to local matchData shape
  const mapMatchState = (d) => ({
    team1: d.team1 || "IND", team2: d.team2 || "PAK",
    score: Number(d.score || 0), wickets: Number(d.wickets || 0), overs: Number(d.overs || 0.0),
    recentBall: d.recent_ball || "-", target_score: Number(d.target_score || 0),
    equation: d.equation || "", inning: Number(d.inning || 1),
    match_format: d.match_format || "T20",
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

  // Fetch helper for roster
  const refreshRoster = useCallback(async () => {
    try { const data = await api.getRoster(); setRosterList(data); } catch (e) { console.error('Roster fetch error:', e); }
  }, []);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `iframe[id^="twitter-widget-"] { max-width: 100% !important; width: 100% !important; }`;
    document.head.appendChild(style);
  }, []);

  // SSE real-time event handlers (replaces Supabase channels)
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

  // Initial data fetch (replaces Supabase queries)
  useEffect(() => {
    setIsConnected(true);

    const fetchInitialData = async () => {
      try {
        const [commData, matchDataFetch] = await Promise.all([
          api.getCommentary(),
          api.getMatchState()
        ]);
        if (commData) setCommentary(commData);
        if (matchDataFetch) {
          setMatchData(mapMatchState(matchDataFetch));
          setTargetInput(matchDataFetch.target_score ?? "");
          setStrikerInput(""); setNonStrikerInput(""); setBowlerInput("");
        }
      } catch (e) { console.error('Initial fetch error:', e); setIsConnected(false); }
    };

    fetchInitialData();
    refreshRoster();
  }, [refreshRoster]);

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    if (!adminInput.trim() && tweetMode) return;


    // --- STEP 1: CAPTURE OLD VARIABLES ---
    const oldStriker = matchData.striker_name;
    const oldNonStriker = matchData.non_striker_name;
    const oldBowler = matchData.bowler_name;

    // Prevent double-click
    if (isSubmitting) return;
    setIsSubmitting(true);

    // We cache the locked title using the OLD state for accurate attribution
    const autoTitle = lockedTitle || `${oldBowler} to ${oldStriker}${activeScore && activeScore.runs !== undefined ? (', ' + (activeScore.extraType || activeScore.runs)) : ''}`;
    setLockedTitle("");

    // Initialize local trackers with current state values
    let newScore = matchData.score;
    let newWickets = matchData.wickets;

    let sRuns = matchData.striker_runs;
    let sBalls = matchData.striker_balls;
    let nsRuns = matchData.non_striker_runs;
    let nsBalls = matchData.non_striker_balls;

    let bRunsConceded = matchData.bowler_runs_conceded;
    let bWickets = matchData.bowler_wickets;
    let bBallsBowled = matchData.bowler_balls_bowled;
    let isFreeHit = matchData.is_free_hit;

    // We start with the old total balls and conditionally add 1
    let totalBalls = Math.floor(matchData.overs) * 6 + Math.round((matchData.overs % 1) * 10);

    const getMaxOvers = () => {
      if (matchData.match_format === 'T20') return 20;
      if (matchData.match_format === 'ODI') return 50;
      return Infinity;
    };
    const maxOvers = getMaxOvers();

    // Guardrails using base state
    if (activeScore) {
      if (newWickets >= 10) {
        alert("Innings Over: 10 Wickets are down. Cannot add more deliveries.");
        return;
      }
      if (!activeScore.extraType && totalBalls >= maxOvers * 6) {
        alert(`Innings Over: Configured max overs (${maxOvers}) reached.`);
        return;
      }
    }

    // Prepare Prompt Data object
    let pData = {
      actualRunsToAdd: activeScore ? activeScore.runs : 0,
      whoOut: null,
      newBatter: null,
      wType: null,
      offBat: false
    };

    let calculatedBadge = !tweetMode && commEvent.trim() !== "" ? commEvent : null;
    let newStrikerName = null;
    let newNonStrikerName = null;

    // --- STEP 2: FIRE PROMPTS FIRST ---
    if (activeScore) {
      if (activeScore.extraType && (activeScore.extraType === 'B' || activeScore.extraType === 'LB')) {
        const pRuns = window.prompt(`How many ${activeScore.extraType} runs completed?`, "1");
        if (pRuns === null) return;
        pData.actualRunsToAdd = Number(pRuns) || 0;
        calculatedBadge = `${pData.actualRunsToAdd}${activeScore.extraType}`;
      } else if (activeScore.extraType === 'Wd') {
        const pRuns = window.prompt(`Additional runs scored off this Wide?`, "0");
        if (pRuns === null) { setIsSubmitting(false); return; }
        pData.actualRunsToAdd = Number(pRuns) || 0;
        calculatedBadge = `${pData.actualRunsToAdd > 0 ? pData.actualRunsToAdd : ''}Wd`;
      } else if (activeScore.extraType === 'NB') {
        // NB runs come from the modal (activeScore.runs + activeScore.offBat)
        pData.actualRunsToAdd = activeScore.runs || 0;
        pData.offBat = activeScore.offBat || false;
        calculatedBadge = pData.actualRunsToAdd > 0 ? `NB+${pData.actualRunsToAdd}` : 'NB';
      } else if (activeScore.isWicket) {
        // Wickets are now handled entirely by the modal — skip
        return;
      } else {
        calculatedBadge = activeScore.runs.toString();
      }
    }

    // --- STEP 3: CALCULATE MATH ---
    // If there is an active score from the matrix, process it.
    let recentBall = calculatedBadge;
    if (activeScore) {
      if (!calculatedBadge) {
        recentBall = activeScore.isWicket ? "W" : (activeScore.extraType ? activeScore.extraType : activeScore.runs.toString());
      }

      const runs = activeScore.runs;
      const isWicket = activeScore.isWicket;
      const extraType = activeScore.extraType;

      if (isWicket && newWickets === 9) {
        newWickets += 1;
      } else if (isWicket) {
        newWickets += 1;
      }

      let actualRunsToAdd = pData.actualRunsToAdd;

      if (extraType && (extraType === 'B' || extraType === 'LB')) {
        newScore += actualRunsToAdd;
        sBalls += 1;
        bBallsBowled += 1;
        totalBalls += 1;
        if (isFreeHit) isFreeHit = false;
      }
      else if (extraType && (extraType === 'Wd' || extraType === 'NB')) {
        newScore += (1 + actualRunsToAdd);
        bRunsConceded += (1 + actualRunsToAdd);

        if (extraType === 'NB') {
          isFreeHit = true;
          sBalls += 1; // NB counts as ball faced for batter
          if (pData.offBat) {
            sRuns += actualRunsToAdd;
          }
        }
      }
      else if (isWicket && extraType === 'RO') {
        newScore += actualRunsToAdd;
        sRuns += actualRunsToAdd;
        bRunsConceded += actualRunsToAdd;

        sBalls += 1;
        bBallsBowled += 1;
        totalBalls += 1;
        if (isFreeHit) isFreeHit = false;
      }
      else if (isWicket && extraType !== 'RO') {
        bWickets += 1;
        sBalls += 1;
        bBallsBowled += 1;
        totalBalls += 1;
        if (isFreeHit) isFreeHit = false;
      }
      else {
        // Legal normal delivery
        newScore += runs;
        sRuns += runs;
        bRunsConceded += runs;
        sBalls += 1;
        bBallsBowled += 1;
        totalBalls += 1;
        if (isFreeHit) isFreeHit = false;
      }
    }

    // Convert Total Balls back to Decimal Over format using the newly calculated totalBalls
    let newOvers = Math.floor(totalBalls / 6) + (totalBalls % 6) / 10;
    newOvers = parseFloat(newOvers.toFixed(1));

    // Auto calculate Equation if Inning 2
    let newEquation = matchData.equation;
    if (matchData.inning === 2 && matchData.target_score > 0) {
      const runsNeeded = matchData.target_score - newScore;

      if (maxOvers === Infinity) {
        if (runsNeeded <= 0) {
          newEquation = `${matchData.team1} won by ${10 - newWickets} wickets`;
        } else {
          newEquation = `Need ${runsNeeded} runs`;
        }
      } else {
        const ballsRemaining = (maxOvers * 6) - totalBalls;
        if (runsNeeded <= 0) {
          // Chasing team won
          newEquation = `${matchData.team1} won by ${10 - newWickets} wickets`;
        } else if (newWickets >= 10 || ballsRemaining <= 0) {
          // Innings ended without chasing
          if (runsNeeded === 1) {
            newEquation = "Match Tied";
          } else {
            newEquation = `${matchData.team2} won by ${runsNeeded - 1} runs`;
          }
        } else {
          newEquation = `Need ${runsNeeded} runs from ${ballsRemaining} balls`;
        }
      }
    } else if (matchData.inning === 1) {
      newEquation = "";
    }

    // Twitter Embed Auto-Parser
    const urlRegex = /^(https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^\s]+)$/i;
    let isFinalTweetMode = tweetMode;
    let processedInput = adminInput;

    if (adminInput.includes('<blockquote')) {
      isFinalTweetMode = true;
    } else if (urlRegex.test(adminInput.trim())) {
      isFinalTweetMode = true;
    }

    // Prepare text input fallback
    if (!processedInput.trim() && !isFinalTweetMode) {
      if (commEvent === '0') processedInput = 'Dot ball.';
      else if (['1', '2', '3', '5'].includes(commEvent)) processedInput = 'Working it around for runs.';
      else if (commEvent === '4') processedInput = 'Boundary four!';
      else if (commEvent === '6') processedInput = 'Massive six!';
      else if (commEvent === 'Wd') processedInput = 'Wide delivery.';
      else if (commEvent === 'NB') processedInput = 'No ball.';
      else if (commEvent === 'W' || commEvent.includes('W+')) processedInput = 'WICKET!';
      else processedInput = 'Delivery completed.';
    }

    // --- STEP 4: BUILD FEED POST ---
    let timelinePayload = {
      type: isFinalTweetMode ? 'tweet' : 'text',
      text: processedInput,
      // Use the newly calculated 'newOvers' to fix the 0.0 bug
      overs: !isFinalTweetMode && activeScore ? newOvers.toFixed(1) : (!isFinalTweetMode && !activeScore ? newOvers.toFixed(1) : null),
      event_badge: calculatedBadge,
      bowler_batter_title: !isFinalTweetMode ? autoTitle : null // Title uses old variables!
    };


    // --- STEP 5: PROCESS SWAPS & WICKETS ---
    // A) Wicket Replacement
    if (activeScore && activeScore.isWicket) {
      if (activeScore.extraType === 'RO') {
        if (pData.whoOut && pData.whoOut.toUpperCase() === 'S') {
          newStrikerName = pData.newBatter;
          sRuns = 0; sBalls = 0;
        } else if (pData.whoOut) {
          newNonStrikerName = pData.newBatter;
          nsRuns = 0; nsBalls = 0;
        }
      } else {
        sRuns = 0; sBalls = 0; // Wipe the striker
        newStrikerName = pData.newBatter;
      }
    }

    let finalStriker = newStrikerName || oldStriker;
    let finalNonStriker = newNonStrikerName || oldNonStriker;
    let finalSRuns = sRuns;
    let finalSBalls = sBalls;
    let finalNSRuns = nsRuns;
    let finalNSBalls = nsBalls;

    // B) Odd Runs Swap
    let oddRuns = false;
    if (activeScore) {
      const isOddRuns = Number(pData.actualRunsToAdd) % 2 !== 0;
      if (!activeScore.extraType && !activeScore.isWicket && Number(activeScore.runs) % 2 !== 0) oddRuns = true;
      if (activeScore.extraType && (activeScore.extraType === 'B' || activeScore.extraType === 'LB') && isOddRuns) oddRuns = true;
      if (activeScore.extraType && (activeScore.extraType === 'Wd' || activeScore.extraType === 'NB') && isOddRuns) oddRuns = true;
      if (activeScore.isWicket && activeScore.extraType === 'RO' && isOddRuns) oddRuns = true;
    } else {
      // Fallback checks against raw commentary strings if hitting enter with NO matrix button active
      if (commEvent === "1" || commEvent === "3" || commEvent === "5") {
        oddRuns = true;
      } else if (commEvent.includes("B") || commEvent.includes("LB") || commEvent.includes("Wd") || commEvent.includes("NB")) {
        const match = commEvent.match(/^(\d+)/);
        if (match && parseInt(match[1]) % 2 !== 0) oddRuns = true;
      } else if (commEvent.includes("RO")) {
        const match = commEvent.match(/\((\d+)\)/);
        if (match && parseInt(match[1]) % 2 !== 0) oddRuns = true;
      }
    }

    if (oddRuns) {
      let temp = finalStriker; finalStriker = finalNonStriker; finalNonStriker = temp;
      let tempR = finalSRuns; finalSRuns = finalNSRuns; finalNSRuns = tempR;
      let tempB = finalSBalls; finalSBalls = finalNSBalls; finalNSBalls = tempB;
    }

    // C) End Of Over Swap
    if (totalBalls > 0 && totalBalls % 6 === 0) {
      let temp = finalStriker; finalStriker = finalNonStriker; finalNonStriker = temp;
      let tempR = finalSRuns; finalSRuns = finalNSRuns; finalNSRuns = tempR;
      let tempB = finalSBalls; finalSBalls = finalNSBalls; finalNSBalls = tempB;
    }


    // --- STEP 6: UNIFIED DB PUSH ---
    // Build match_state payload (needed for both normal and modal paths)
    let msPayload = {
      score: newScore,
      wickets: newWickets,
      overs: newOvers,
      recent_ball: recentBall || matchData.recent_ball,
      equation: newEquation,
      striker_name: finalStriker,
      non_striker_name: finalNonStriker,
      striker_runs: finalSRuns,
      striker_balls: finalSBalls,
      non_striker_runs: finalNSRuns,
      non_striker_balls: finalNSBalls,
      bowler_runs_conceded: bRunsConceded,
      bowler_wickets: bWickets,
      bowler_balls_bowled: bBallsBowled,
      is_free_hit: isFreeHit,
      updated_at: new Date().toISOString()
    };

    // Track extras in match_state
    if (activeScore && activeScore.extraType === 'Wd') {
      msPayload.extras_wide = (matchData.extras_wide || 0) + 1;
    } else if (activeScore && activeScore.extraType === 'NB') {
      msPayload.extras_nb = (matchData.extras_nb || 0) + 1;
    } else if (activeScore && activeScore.extraType === 'B') {
      msPayload.extras_bye = (matchData.extras_bye || 0) + 1;
    } else if (activeScore && activeScore.extraType === 'LB') {
      msPayload.extras_lb = (matchData.extras_lb || 0) + 1;
    }

    // Strict end-of-over guardrail
    if (totalBalls > 0 && totalBalls % 6 === 0 && bBallsBowled !== matchData.bowler_balls_bowled) {
      msPayload.bowler_name = "";
    } else {
      msPayload.bowler_name = oldBowler;
    }

    // For wickets that need the modal, defer the push to handleWicketConfirm
    const isWicketModalPending = activeScore?.isWicket && pData.newBatter === '__MODAL__';

    if (!isWicketModalPending) {
      // Push Commentary
      try { await api.insertCommentary(timelinePayload); } catch (e) { console.error("Error inserting", e); alert("Failed to post timeline."); }

      // Push Match State Update
      try { await api.updateMatchState(msPayload); } catch (e) { console.error("Update score error:", e); }
    }

    // --- STEP 7: UPDATE ROSTER PLAYER STATS (Absolute Addition) ---
    if (activeScore && !isFinalTweetMode) {
      // Determine delivery stats from activeScore directly
      let deliveryRuns = 0;
      let deliveryBalls = 0;
      let bowlerDeliveryRuns = 0;
      let bowlerDeliveryBalls = 0;
      let bowlerDeliveryWickets = 0;

      const extraType = activeScore.extraType;
      const isWicket = activeScore.isWicket;

      if (extraType === 'Wd') {
        // Wide: no ball faced by batter, bowler concedes 1 + extras, no legal ball
        bowlerDeliveryRuns = 1 + (pData.actualRunsToAdd || 0);
      } else if (extraType === 'NB') {
        // No ball: no legal ball for bowler, batter may score off bat
        deliveryBalls = 1; // NB counts as ball faced
        if (pData.offBat) deliveryRuns = pData.actualRunsToAdd || 0;
        bowlerDeliveryRuns = 1 + (pData.actualRunsToAdd || 0);
      } else if (extraType === 'B' || extraType === 'LB') {
        // Byes/leg byes: batter faces ball but doesn't score runs
        deliveryBalls = 1;
        deliveryRuns = 0;
        bowlerDeliveryBalls = 1;
      } else if (isWicket && extraType === 'RO') {
        // Run out: batter faces ball, runs may be scored
        deliveryRuns = pData.actualRunsToAdd || 0;
        deliveryBalls = 1;
        bowlerDeliveryRuns = pData.actualRunsToAdd || 0;
        bowlerDeliveryBalls = 1;
      } else if (isWicket) {
        // Standard wicket: batter faces ball, 0 runs, bowler gets wicket
        deliveryBalls = 1;
        bowlerDeliveryBalls = 1;
        bowlerDeliveryWickets = 1;
      } else {
        // Standard legal delivery
        deliveryRuns = activeScore.runs || 0;
        deliveryBalls = 1;
        bowlerDeliveryRuns = activeScore.runs || 0;
        bowlerDeliveryBalls = 1;
      }

      // Update Striker stats in roster
      if (oldStriker && oldStriker !== "Striker") {
        try {
          const rows = await api.queryRoster({ player_name: oldStriker, team: matchData.team1, inning: matchData.inning, limit: 1 });
          const strikerRow = rows[0];
          if (strikerRow) {
            const updatePayload = {
              player_name: oldStriker, team: matchData.team1, inning: matchData.inning,
              runs_scored: (strikerRow.runs_scored || 0) + deliveryRuns,
              balls_faced: (strikerRow.balls_faced || 0) + deliveryBalls
            };
            const isNBOffBat = activeScore.extraType === 'NB' && activeScore.offBat;
            if ((activeScore.runs === 4 && !activeScore.extraType && !activeScore.isWicket) || (isNBOffBat && activeScore.runs === 4)) {
              updatePayload.fours_count = (strikerRow.fours_count || 0) + 1;
            }
            if ((activeScore.runs === 6 && !activeScore.extraType && !activeScore.isWicket) || (isNBOffBat && activeScore.runs === 6)) {
              updatePayload.sixes_count = (strikerRow.sixes_count || 0) + 1;
            }
            await api.updateRosterEntry(updatePayload);
          }
        } catch (e) { console.error('Striker roster update error:', e); }
      }

      // Update Bowler stats in roster
      if (oldBowler && oldBowler.trim() !== "") {
        try {
          const rows = await api.queryRoster({ player_name: oldBowler, team: matchData.team2, inning: matchData.inning, limit: 1 });
          const bowlerRow = rows[0];
          if (bowlerRow) {
            await api.updateRosterEntry({
              player_name: oldBowler, team: matchData.team2, inning: matchData.inning,
              runs_conceded: (bowlerRow.runs_conceded || 0) + bowlerDeliveryRuns,
              balls_bowled: (bowlerRow.balls_bowled || 0) + bowlerDeliveryBalls,
              wickets_taken: (bowlerRow.wickets_taken || 0) + bowlerDeliveryWickets
            });
          }
        } catch (e) { console.error('Bowler roster update error:', e); }
      }

      // If this was a wicket, pause and show the modal — BUT wickets are now handled directly by the WICKET button
      // so this code path should never fire. Keeping as safety net.
    }

    if (msPayload.bowler_name === "") {
      setBowlerInput("");
      // Show 'Over Complete!' banner
      setShowOverBanner(true);
      setTimeout(() => setShowOverBanner(false), 3000);

      // Auto-post over summary with bowler/batter figures
      const overNum = Math.floor(newOvers);
      const bowlerFig = `${oldBowler} ${bWickets}/${bRunsConceded} (${Math.floor(bBallsBowled / 6)}.${bBallsBowled % 6})`;
      const batFig = `${finalStriker} ${finalSRuns}(${finalSBalls})* | ${finalNonStriker} ${finalNSRuns}(${finalNSBalls})`;
      await api.insertCommentary({
        type: 'event',
        text: `END OF OVER ${overNum} | 🎳 ${bowlerFig} | 🏏 ${batFig}`,
        overs: null, event_badge: null, bowler_batter_title: null
      });
    }

    // Auto-post match result when match is won
    if (newEquation && (newEquation.includes('won') || newEquation.includes('Tied'))) {
      await api.insertCommentary({
        type: 'event',
        text: `🏆 MATCH RESULT: ${newEquation}`,
        overs: null, event_badge: null, bowler_batter_title: null
      });
    }

    if (recentBall) setCommEvent(recentBall);

    // Clear Active States
    setActiveScore(null);
    setAdminInput("");
    setCommEvent("");
    setIsSubmitting(false);
  };

  // --- WICKET MODAL: Self-contained handler for all wicket scoring ---
  const handleWicketConfirm = async () => {
    if (!dismissalType) { alert("Please select a dismissal type."); return; }
    if (isSubmitting) return;
    setIsSubmitting(true);

    const isLastWicket = matchData.wickets === 9; // This will be the 10th wicket
    if (!isLastWicket && !nextBatter) { alert("Please select the next batter."); return; }

    const isRunOut = dismissalType === 'Run Out';
    const oldStriker = matchData.striker_name;
    const oldNonStriker = matchData.non_striker_name;
    const oldBowler = matchData.bowler_name;
    const runsCompleted = isRunOut ? (parseInt(wicketRunsCompleted) || 0) : 0;
    const outBatter = isRunOut ? (wicketWhoOut === 'NS' ? oldNonStriker : oldStriker) : oldStriker;

    // --- SCORING MATH ---
    let newScore = matchData.score + runsCompleted;
    let newWickets = matchData.wickets + 1;
    let totalBalls = Math.floor(matchData.overs) * 6 + Math.round((matchData.overs % 1) * 10);
    totalBalls += 1; // Wicket delivery is always a legal ball

    let sRuns = matchData.striker_runs + (isRunOut ? runsCompleted : 0);
    let sBalls = matchData.striker_balls + 1;
    let nsRuns = matchData.non_striker_runs;
    let nsBalls = matchData.non_striker_balls;
    let bRunsConceded = matchData.bowler_runs_conceded + runsCompleted;
    let bWickets = matchData.bowler_wickets + (isRunOut ? 0 : 1);
    let bBallsBowled = matchData.bowler_balls_bowled + 1;

    let newOvers = Math.floor(totalBalls / 6) + (totalBalls % 6) / 10;
    newOvers = parseFloat(newOvers.toFixed(1));

    // Equation calculation for 2nd innings
    let newEquation = matchData.equation;
    const getMaxOvers = () => { if (matchData.match_format === 'T20') return 20; if (matchData.match_format === 'ODI') return 50; return Infinity; };
    const maxOvers = getMaxOvers();
    if (matchData.inning === 2 && matchData.target_score > 0) {
      const runsNeeded = matchData.target_score - newScore;
      if (maxOvers === Infinity) {
        newEquation = runsNeeded <= 0 ? `${matchData.team1} won by ${10 - newWickets} wickets` : `Need ${runsNeeded} runs`;
      } else {
        const ballsRemaining = (maxOvers * 6) - totalBalls;
        if (runsNeeded <= 0) newEquation = `${matchData.team1} won by ${10 - newWickets} wickets`;
        else if (newWickets >= 10 || ballsRemaining <= 0) newEquation = runsNeeded === 1 ? "Match Tied" : `${matchData.team2} won by ${runsNeeded - 1} runs`;
        else newEquation = `Need ${runsNeeded} runs from ${ballsRemaining} balls`;
      }
    }

    // If all out, set final equation
    if (newWickets >= 10) {
      if (matchData.inning === 1) {
        newEquation = `${matchData.team1} All Out for ${newScore}`;
      } else if (matchData.inning === 2 && matchData.target_score > 0) {
        const runsNeeded = matchData.target_score - newScore;
        if (runsNeeded <= 0) newEquation = `${matchData.team1} won by ${10 - newWickets} wickets`;
        else newEquation = runsNeeded === 1 ? "Match Tied" : `${matchData.team2} won by ${runsNeeded - 1} runs`;
      }
    }

    // Determine the new batter position (skip for last wicket)
    let finalStriker, finalNonStriker, finalSRuns, finalSBalls, finalNSRuns, finalNSBalls;
    if (isLastWicket) {
      // No new batter — keep positions as-is with current stats
      if (isRunOut && wicketWhoOut === 'NS') {
        finalStriker = oldStriker; finalSRuns = sRuns; finalSBalls = sBalls;
        finalNonStriker = '---'; finalNSRuns = 0; finalNSBalls = 0;
      } else {
        finalStriker = '---'; finalSRuns = 0; finalSBalls = 0;
        finalNonStriker = oldNonStriker; finalNSRuns = nsRuns; finalNSBalls = nsBalls;
      }
    } else if (isRunOut && wicketWhoOut === 'NS') {
      finalStriker = oldStriker;
      finalSRuns = sRuns; finalSBalls = sBalls;
      finalNonStriker = nextBatter;
      finalNSRuns = 0; finalNSBalls = 0;
    } else {
      finalStriker = nextBatter;
      finalSRuns = 0; finalSBalls = 0;
      finalNonStriker = oldNonStriker;
      finalNSRuns = nsRuns; finalNSBalls = nsBalls;
    }

    // Odd runs swap for run outs
    if (isRunOut && runsCompleted % 2 !== 0) {
      let temp = finalStriker; finalStriker = finalNonStriker; finalNonStriker = temp;
      let tR = finalSRuns; finalSRuns = finalNSRuns; finalNSRuns = tR;
      let tB = finalSBalls; finalSBalls = finalNSBalls; finalNSBalls = tB;
    }

    // End of over swap
    if (totalBalls > 0 && totalBalls % 6 === 0) {
      let temp = finalStriker; finalStriker = finalNonStriker; finalNonStriker = temp;
      let tR = finalSRuns; finalSRuns = finalNSRuns; finalNSRuns = tR;
      let tB = finalSBalls; finalSBalls = finalNSBalls; finalNSBalls = tB;
    }

    // --- BUILD PAYLOADS ---
    let bowlerName = oldBowler;
    if (totalBalls > 0 && totalBalls % 6 === 0 && bBallsBowled !== matchData.bowler_balls_bowled) {
      bowlerName = "";
    }

    const msPayload = {
      score: newScore, wickets: newWickets, overs: newOvers,
      recent_ball: isRunOut ? `W+RO(${runsCompleted})` : 'W',
      equation: newEquation,
      striker_name: finalStriker, non_striker_name: finalNonStriker,
      striker_runs: finalSRuns, striker_balls: finalSBalls,
      non_striker_runs: finalNSRuns, non_striker_balls: finalNSBalls,
      bowler_runs_conceded: bRunsConceded, bowler_wickets: bWickets, bowler_balls_bowled: bBallsBowled,
      bowler_name: bowlerName, is_free_hit: false,
      updated_at: new Date().toISOString()
    };

    let dismissalText = dismissalType;
    if (wicketFielder && ['Caught', 'Stumped', 'Run Out'].includes(dismissalType)) {
      dismissalText += ` (${wicketFielder})`;
    }
    const autoTitle = `${oldBowler} to ${outBatter}`;
    const timelinePayload = {
      type: 'text',
      text: `WICKET! ${outBatter} - ${dismissalText}`,
      overs: newOvers.toFixed(1),
      event_badge: isRunOut ? `W+RO(${runsCompleted})` : 'W',
      bowler_batter_title: autoTitle
    };

    // --- ROSTER UPDATES ---
    // 1. Update outgoing batter status
    await api.updateRosterEntry({ player_name: outBatter, team: matchData.team1, inning: matchData.inning, status: 'out' });
    // 2. Update incoming batter status (skip for last wicket)
    if (!isLastWicket && nextBatter) {
      const maxRows = await api.queryRoster({ team: matchData.team1, inning: matchData.inning, batting_position_not_null: 'true', order_by: 'batting_position:desc', limit: 1 });
      const nextPos = (maxRows && maxRows.length > 0 && maxRows[0].batting_position != null) ? maxRows[0].batting_position + 1 : 1;
      await api.updateRosterEntry({ player_name: nextBatter, team: matchData.team1, inning: matchData.inning, status: 'batting', batting_position: nextPos });
    }

    // 3. Update striker roster stats (balls faced + runs if RO)
    if (oldStriker && oldStriker !== "Striker") {
      try {
        const sRows = await api.queryRoster({ player_name: oldStriker, team: matchData.team1, inning: matchData.inning, limit: 1 });
        const sRow = sRows[0];
        if (sRow) {
          await api.updateRosterEntry({
            player_name: oldStriker, team: matchData.team1, inning: matchData.inning,
            runs_scored: (sRow.runs_scored || 0) + (isRunOut ? runsCompleted : 0),
            balls_faced: (sRow.balls_faced || 0) + 1
          });
        }
      } catch (e) { console.error('Striker wicket roster update error:', e); }
    }
    // 3b. Save dismissal_text to the outgoing batter's roster
    if (outBatter) {
      let dText = '';
      if (dismissalType === 'Caught') dText = `c ${wicketFielder || '?'} b ${oldBowler}`;
      else if (dismissalType === 'Bowled') dText = `b ${oldBowler}`;
      else if (dismissalType === 'LBW') dText = `lbw b ${oldBowler}`;
      else if (dismissalType === 'Stumped') dText = `st ${wicketFielder || '?'} b ${oldBowler}`;
      else if (dismissalType === 'Run Out') dText = `run out (${wicketFielder || '?'})`;
      else if (dismissalType === 'Hit Wicket') dText = `hit wicket b ${oldBowler}`;
      await api.updateRosterEntry({ player_name: outBatter, team: matchData.team1, inning: matchData.inning, dismissal_text: dText });
    }
    // 4. Update bowler roster stats
    if (oldBowler && oldBowler.trim() !== "") {
      try {
        const bRows = await api.queryRoster({ player_name: oldBowler, team: matchData.team2, inning: matchData.inning, limit: 1 });
        const bRow = bRows[0];
        if (bRow) {
          await api.updateRosterEntry({
            player_name: oldBowler, team: matchData.team2, inning: matchData.inning,
            runs_conceded: (bRow.runs_conceded || 0) + runsCompleted,
            balls_bowled: (bRow.balls_bowled || 0) + 1,
            wickets_taken: (bRow.wickets_taken || 0) + (isRunOut ? 0 : 1)
          });
        }
      } catch (e) { console.error('Bowler wicket roster update error:', e); }
    }

    // --- DB PUSH ---
    try { await api.updateMatchState(msPayload); } catch (e) { console.error("Update score error:", e); }
    try { await api.insertCommentary(timelinePayload); } catch (e) { console.error("Error inserting", e); }

    // --- CLEANUP ---
    if (bowlerName === "") {
      setBowlerInput("");
      setShowOverBanner(true);
      setTimeout(() => setShowOverBanner(false), 3000);

      const overNum = Math.floor(newOvers);
      const bowlerFig = `${oldBowler} ${bWickets}/${bRunsConceded} (${Math.floor(bBallsBowled / 6)}.${bBallsBowled % 6})`;
      const batFig = `${finalStriker} ${finalSRuns}(${finalSBalls})* | ${finalNonStriker} ${finalNSRuns}(${finalNSBalls})`;
      await api.insertCommentary({
        type: 'event',
        text: `END OF OVER ${overNum} | \ud83c\udfb3 ${bowlerFig} | \ud83c\udfcf ${batFig}`,
        overs: null, event_badge: null, bowler_batter_title: null
      });
    }

    // Auto-post match result when match is won (wicket can trigger all-out or run chase)
    if (newEquation && (newEquation.includes('won') || newEquation.includes('Tied'))) {
      await api.insertCommentary({
        type: 'event',
        text: `\ud83c\udfc6 MATCH RESULT: ${newEquation}`,
        overs: null, event_badge: null, bowler_batter_title: null
      });
    }
    setActiveScore(null);
    setAdminInput("");
    setCommEvent("");
    setShowWicketModal(false);
    setPendingWicket(null);
    setDismissalType("");
    setWicketFielder("");
    setNextBatter("");
    setWicketWhoOut("S");
    setWicketRunsCompleted("0");
    setIsSubmitting(false);
  };

  const toggleInning = async (newInning) => {
    // Switching TO Inning 2: Confirm and auto-reset
    if (newInning === 2 && matchData.inning === 1) {
      const confirmed = window.confirm("Start 2nd Innings? This will set the target and reset the scorecard to 0/0.");
      if (!confirmed) return;

      const autoTarget = matchData.score + 1;

      try {
        await api.updateMatchState({
          inning: 2,
          target_score: autoTarget,
          equation: `Need ${autoTarget} runs`,
          team1: matchData.team2,
          team2: matchData.team1,
          score: 0, wickets: 0, overs: 0, recent_ball: "-",
          striker_name: "Striker", non_striker_name: "Non-Striker", bowler_name: "",
          striker_runs: 0, striker_balls: 0, non_striker_runs: 0, non_striker_balls: 0,
          bowler_runs_conceded: 0, bowler_wickets: 0, bowler_balls_bowled: 0, is_free_hit: false,
          extras_wide_inn1: matchData.extras_wide || 0, extras_nb_inn1: matchData.extras_nb || 0,
          extras_bye_inn1: matchData.extras_bye || 0, extras_lb_inn1: matchData.extras_lb || 0,
          extras_wide: 0, extras_nb: 0, extras_bye: 0, extras_lb: 0,
          updated_at: new Date().toISOString()
        });
      } catch (e) { console.error("Toggle inning error", e); return; }

      // Post Innings Break event to feed
      await api.insertCommentary({
        type: 'event',
        text: `INNINGS BREAK: Target set to ${autoTarget}`,
        overs: null, event_badge: null, bowler_batter_title: null
      });

      // Duplicate the new batting team (old team2, which becomes team1 in inning 2) as fresh inning 2 rows
      const newBattingTeam = matchData.team2; // This team is about to bat in inning 2
      const newBowlingTeam = matchData.team1; // This team is about to bowl in inning 2
      const battingPlayers = rosterList.filter(p => p.team === newBattingTeam && p.inning === 1);
      const bowlingPlayers = rosterList.filter(p => p.team === newBowlingTeam && p.inning === 1);

      const inning2Rows = [
        ...battingPlayers.map(p => ({
          team: p.team, player_name: p.player_name, inning: 2,
          status: 'dugout', runs_scored: 0, balls_faced: 0, fours_count: 0, sixes_count: 0,
          runs_conceded: 0, balls_bowled: 0, wickets_taken: 0, dismissal_text: ''
        })),
        ...bowlingPlayers.map(p => ({
          team: p.team, player_name: p.player_name, inning: 2,
          status: 'dugout', runs_scored: 0, balls_faced: 0, fours_count: 0, sixes_count: 0,
          runs_conceded: 0, balls_bowled: 0, wickets_taken: 0, dismissal_text: ''
        }))
      ];

      if (inning2Rows.length > 0) {
        await api.insertRoster(inning2Rows);
      }

      // Update local UI state
      setTargetInput(String(autoTarget));
      setStrikerInput("");
      setNonStrikerInput("");
      setBowlerInput("");
      setActiveScore(null);
      setCommEvent("");
      return;
    }

    // Switching back to Inning 1 (or any other transition)
    const target = parseInt(targetInput) || matchData.target_score;
    try {
      await api.updateMatchState({
        inning: newInning, target_score: target, equation: "",
        updated_at: new Date().toISOString()
      });
    } catch (e) { console.error("Toggle inning error", e); }
  };

  const updateMatchFormat = async (format) => {
    try {
      await api.updateMatchState({ match_format: format, updated_at: new Date().toISOString() });
    } catch (e) { console.error("Update format error", e); }
  };

  const updateTarget = async () => {
    const target = parseInt(targetInput) || 0;
    try {
      await api.updateMatchState({ target_score: target, updated_at: new Date().toISOString() });
    } catch (e) { console.error("Update target error", e); }
  };

  const updateRoster = async () => {
    let updates = { updated_at: new Date().toISOString() };

    if (strikerInput.trim() !== "" && strikerInput !== matchData.striker_name) {
      updates.striker_name = strikerInput;
      updates.striker_runs = 0; updates.striker_balls = 0;
    }
    if (nonStrikerInput.trim() !== "" && nonStrikerInput !== matchData.non_striker_name) {
      updates.non_striker_name = nonStrikerInput;
      updates.non_striker_runs = 0; updates.non_striker_balls = 0;
    }
    if (bowlerInput.trim() !== "" && bowlerInput !== matchData.bowler_name) {
      updates.bowler_name = bowlerInput;
      const bowlerRoster = rosterList.find(p => p.player_name === bowlerInput && p.team === matchData.team2 && p.inning === matchData.inning);
      if (bowlerRoster) {
        updates.bowler_runs_conceded = bowlerRoster.runs_conceded || 0;
        updates.bowler_wickets = bowlerRoster.wickets_taken || 0;
        updates.bowler_balls_bowled = bowlerRoster.balls_bowled || 0;
      } else {
        updates.bowler_runs_conceded = 0; updates.bowler_wickets = 0; updates.bowler_balls_bowled = 0;
      }
    }

    if (Object.keys(updates).length > 1) {
      try { await api.updateMatchState(updates); } catch (e) { console.error("Update roster error", e); }
      setMatchData(prev => ({ ...prev, ...updates }));

      const assignBattingPosition = async (playerName) => {
        const maxRows = await api.queryRoster({ team: matchData.team1, inning: matchData.inning, batting_position_not_null: 'true', order_by: 'batting_position:desc', limit: 1 });
        const nextPos = (maxRows && maxRows.length > 0 && maxRows[0].batting_position != null) ? maxRows[0].batting_position + 1 : 1;
        await api.updateRosterEntry({ player_name: playerName, team: matchData.team1, inning: matchData.inning, status: 'batting', batting_position: nextPos });
      };

      if (updates.striker_name && updates.striker_name !== matchData.striker_name) {
        await assignBattingPosition(updates.striker_name);
      }
      if (updates.non_striker_name && updates.non_striker_name !== matchData.non_striker_name) {
        await assignBattingPosition(updates.non_striker_name);
      }
    }

    setStrikerInput(""); setNonStrikerInput(""); setBowlerInput("");
  };

  const manuallySwapStrike = async () => {
    try {
      await api.updateMatchState({
        striker_name: matchData.non_striker_name, non_striker_name: matchData.striker_name,
        striker_runs: matchData.non_striker_runs, striker_balls: matchData.non_striker_balls,
        non_striker_runs: matchData.striker_runs, non_striker_balls: matchData.striker_balls,
        updated_at: new Date().toISOString()
      });
    } catch (e) { console.error("Swap strike error", e); }
  };

  const clearFeed = async () => {
    if (window.confirm("Are you sure? This will wipe ALL commentary, rosters, and reset the match back to Setup.")) {
      await api.deleteAllCommentary();
      await api.deleteAllRoster();
      await api.updateMatchState({
        match_status: 'setup',
        team1: '', team2: '', venue: '', toss_winner: '', toss_decision: '',
        score: 0, wickets: 0, overs: 0, recent_ball: '-', target_score: 0, equation: '', inning: 1,
        striker_name: 'Striker', non_striker_name: 'Non-Striker', bowler_name: '',
        striker_runs: 0, striker_balls: 0, non_striker_runs: 0, non_striker_balls: 0,
        bowler_runs_conceded: 0, bowler_wickets: 0, bowler_balls_bowled: 0, is_free_hit: false,
        extras_wide: 0, extras_nb: 0, extras_bye: 0, extras_lb: 0,
        updated_at: new Date().toISOString()
      });
      setSetupTeam1("IND"); setSetupTeam2("PAK"); setSetupVenue("");
      setSetupTossWinner("team1"); setSetupTossDecision("bat");
      setRosterTeam1(""); setRosterTeam2("");
    }
  };

  const deleteSingleComment = async (id) => {
    if (window.confirm("Delete this delivery from the feed?")) {
      try { await api.deleteCommentary(id); } catch (e) { console.error("Delete error:", e); }
    }
  };

  const handleEventPost = async (e) => {
    if (e) e.preventDefault();
    if (!adminInput.trim()) return;

    const urlRegex = /^(https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^\s]+)$/i;
    let payloadText = adminInput;
    let type = 'event';
    if (adminInput.includes('<blockquote')) { type = 'tweet'; }
    else if (urlRegex.test(adminInput.trim())) { type = 'tweet'; }

    await api.insertCommentary({ type, text: payloadText, overs: null, event_badge: null, bowler_batter_title: null });
    setAdminInput("");
  };

  const saveCommentEdit = async (id) => {
    try {
      await api.updateCommentary(id, { text: editText, event_badge: editBadge || null });
    } catch (e) { console.error("Update error:", e); }
    setEditingCommentId(null);
  };

  const resetScore = async () => {
    if (window.confirm("Are you sure you want to reset the Score and Overs to 0?")) {
      try {
        await api.updateMatchState({
          score: 0, wickets: 0, overs: 0, recent_ball: "-", equation: "",
          striker_runs: 0, striker_balls: 0, non_striker_runs: 0, non_striker_balls: 0,
          bowler_runs_conceded: 0, bowler_wickets: 0, bowler_balls_bowled: 0, is_free_hit: false,
          striker_name: 'Striker', non_striker_name: 'Non-Striker', bowler_name: '',
          extras_wide: 0, extras_nb: 0, extras_bye: 0, extras_lb: 0,
          extras_wide_inn1: 0, extras_nb_inn1: 0, extras_bye_inn1: 0, extras_lb_inn1: 0,
          updated_at: new Date().toISOString()
        });
      } catch (e) { console.error("Reset score error", e); }
      await api.resetAllRosterStats();
      setCommEvent("");
      setStrikerInput(""); setNonStrikerInput(""); setBowlerInput("");
    }
  };

  const handleStartMatch = async () => {
    if (!setupTeam1.trim() || !setupTeam2.trim()) { alert("Please enter both team names."); return; }
    if (!rosterTeam1.trim() || !rosterTeam2.trim()) { alert("Please enter both team rosters (comma-separated player names)."); return; }
    if (!setupVenue.trim()) { alert("Please enter the venue."); return; }

    const team1Players = rosterTeam1.split(',').map(n => n.trim()).filter(n => n);
    const team2Players = rosterTeam2.split(',').map(n => n.trim()).filter(n => n);

    const rosterPayload = [
      ...team1Players.map(name => ({ team: setupTeam1.trim(), player_name: name, status: 'dugout', inning: 1 })),
      ...team2Players.map(name => ({ team: setupTeam2.trim(), player_name: name, status: 'dugout', inning: 1 }))
    ];

    if (rosterPayload.length > 0) {
      try { await api.insertRoster(rosterPayload); } catch (e) { console.error("Roster insert error", e); }
    }

    const tossWinnerName = setupTossWinner === 'team1' ? setupTeam1.trim() : setupTeam2.trim();
    const tossText = `${tossWinnerName} won the toss and chose to ${setupTossDecision}`;

    try {
      await api.updateMatchState({
        team1: setupTeam1.trim(), team2: setupTeam2.trim(), venue: setupVenue.trim(),
        toss_winner: tossWinnerName, toss_decision: setupTossDecision,
        match_status: 'live', match_format: setupMatchFormat,
        score: 0, wickets: 0, overs: 0, recent_ball: '-',
        inning: 1, equation: '', target_score: 0,
        striker_name: 'Striker', non_striker_name: 'Non-Striker', bowler_name: '',
        striker_runs: 0, striker_balls: 0, non_striker_runs: 0, non_striker_balls: 0,
        bowler_runs_conceded: 0, bowler_wickets: 0, bowler_balls_bowled: 0,
        is_free_hit: false,
        extras_wide: 0, extras_nb: 0, extras_bye: 0, extras_lb: 0,
        updated_at: new Date().toISOString()
      });
    } catch (e) { console.error("Start match error", e); return; }

    await api.insertCommentary({
      type: 'event',
      text: `🏏 MATCH START: ${tossText}. ${setupVenue.trim() ? 'Venue: ' + setupVenue.trim() : ''}`,
      overs: null, event_badge: null, bowler_batter_title: null
    });
  };

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

  if (!isAuthenticated) return <AdminAuth onLogin={() => setIsAuthenticated(true)} />;

  const isBowlerEmpty = !matchData.bowler_name || matchData.bowler_name.trim() === "";
  const isMatchWon = matchData.equation && (matchData.equation.includes('won') || matchData.equation.includes('Tied'));

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 pb-10 transition-colors duration-300">
      {showDuck && <DuckAnimation onComplete={() => setShowDuck(false)} />}

      {/* ===== PRE-MATCH SETUP FORM ===== */}
      {matchData.match_status === 'setup' && (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #2a2520 50%, #1e293b 100%)' }}>
          <div className="w-full max-w-2xl bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-6">
                <BrandLogo className="h-20 w-auto" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">Match Setup</h1>
              <p className="text-slate-400 text-sm mt-1">Configure the match before going live</p>
            </div>

            <div className="space-y-6">
              {/* Team Names */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Team 1 (Batting)</label>
                  <input type="text" value={setupTeam1} onChange={e => setSetupTeam1(e.target.value)} placeholder="e.g. IND" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-bold text-sm placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Team 2 (Bowling)</label>
                  <input type="text" value={setupTeam2} onChange={e => setSetupTeam2(e.target.value)} placeholder="e.g. PAK" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-bold text-sm placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Venue</label>
                <input type="text" value={setupVenue} onChange={e => setSetupVenue(e.target.value)} placeholder="e.g. Wankhede Stadium, Mumbai" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-bold text-sm placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              {/* Toss */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Toss Winner</label>
                  <select value={setupTossWinner} onChange={e => setSetupTossWinner(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                    <option value="team1" className="bg-slate-800">{setupTeam1 || 'Team 1'}</option>
                    <option value="team2" className="bg-slate-800">{setupTeam2 || 'Team 2'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Elected to</label>
                  <select value={setupTossDecision} onChange={e => setSetupTossDecision(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                    <option value="bat" className="bg-slate-800">Bat First</option>
                    <option value="bowl" className="bg-slate-800">Bowl First</option>
                  </select>
                </div>
              </div>

              {/* Match Format */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Match Format</label>
                <div className="flex gap-2">
                  <button onClick={() => setSetupMatchFormat('T20')} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors ${setupMatchFormat === 'T20' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/10 text-slate-400 hover:bg-white/20 border border-white/20'}`}>T20</button>
                  <button onClick={() => setSetupMatchFormat('ODI')} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors ${setupMatchFormat === 'ODI' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/10 text-slate-400 hover:bg-white/20 border border-white/20'}`}>ODI</button>
                  <button onClick={() => setSetupMatchFormat('TEST')} className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors ${setupMatchFormat === 'TEST' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/10 text-slate-400 hover:bg-white/20 border border-white/20'}`}>TEST</button>
                </div>
              </div>

              {/* Playing XIs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">{setupTeam1 || 'Team 1'} Playing XI</label>
                  <textarea value={rosterTeam1} onChange={e => setRosterTeam1(e.target.value)} placeholder="Rohit, Virat, Surya, Pant..." rows={4} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">{setupTeam2 || 'Team 2'} Playing XI</label>
                  <textarea value={rosterTeam2} onChange={e => setRosterTeam2(e.target.value)} placeholder="Babar, Rizwan, Shaheen..." rows={4} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
                </div>
              </div>

              {/* START BUTTON */}
              <button onClick={handleStartMatch} className="w-full py-4 text-white font-black text-lg uppercase tracking-widest rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-200" style={{ background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)' }}>
                🏏 START LIVE MATCH
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== LIVE SCORING DASHBOARD ===== */}
      {matchData.match_status === 'live' && (
        <>
          {/* FULL WIDTH BROADCAST HEADER — Slim Compact */}
          <div className="bg-slate-900 text-white relative md:sticky md:top-0 z-50 shadow-lg" style={{ borderBottom: '4px solid #FACC15' }}>
            <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
              {/* Admin Control Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <div className="flex items-center space-x-3">
                  <BrandLogo className="w-40 sm:w-48 h-auto" />
                  <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full animate-pulse ml-2 mt-1">ADMIN</span>
                </div>
                <div className="flex space-x-3 items-center">
                  {isConnected ? <Wifi size={14} className="text-emerald-400" /> : <WifiOff size={14} className="text-red-400" />}
                  <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">{matchData.match_format} • INN {matchData.inning}</span>
                  <ThemeToggle />
                  <button onClick={resetScore} className="text-orange-400 font-bold text-[10px] hover:bg-slate-800 px-2 py-1 rounded transition">Reset</button>
                  <button onClick={clearFeed} className="text-red-400 font-bold text-[10px] hover:bg-slate-800 px-2 py-1 rounded transition"><Trash2 size={12} className="inline mr-0.5" />Clear</button>
                  <button onClick={() => { localStorage.removeItem("isAdminEnabled"); window.location.reload(); }} className="text-slate-400 font-bold text-[10px] hover:bg-slate-800 px-2 py-1 rounded transition"><LockOpen size={12} className="inline mr-0.5" />Out</button>
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
                {matchData.inning === 2 && matchData.target_score > 0 && (
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-400">Target <span className="text-white font-black text-sm">{matchData.target_score}</span></span>
                    <span className={`font-black tracking-wide px-3 py-1 rounded-full border text-[11px] ${isMatchWon ? 'bg-emerald-900/40 text-emerald-300 border-emerald-800/50' : ''}`} style={!isMatchWon ? { backgroundColor: 'rgba(250,204,21,0.15)', color: '#FACC15', borderColor: 'rgba(250,204,21,0.4)' } : {}}>{matchData.equation}</span>
                  </div>
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

              {/* Innings Toggle — Inline in header */}
              <div className="flex gap-2 mt-2 items-center">
                <button onClick={() => toggleInning(1)} className={`py-1 px-3 text-[10px] font-bold rounded transition-colors ${matchData.inning === 1 ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-800 border border-slate-700'}`}>1st Inn</button>
                <button onClick={() => toggleInning(2)} className={`py-1 px-3 text-[10px] font-bold rounded transition-colors ${matchData.inning === 2 ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-800 border border-slate-700'}`}>2nd Inn</button>
                {matchData.inning === 2 && (
                  <div className="flex gap-1 ml-2">
                    <input type="number" value={targetInput} onChange={e => setTargetInput(e.target.value)} placeholder="Target" className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] text-white font-bold outline-none" />
                    <button onClick={updateTarget} className="bg-slate-700 text-white text-[10px] font-bold px-2 rounded hover:bg-slate-600">SET</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DESKTOP LAYOUT GRID */}
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col lg:flex-row gap-4">

            {/* LEFT COLUMN: SCORING CONTROLS */}
            <div className="lg:w-1/3 flex flex-col gap-4">

              {/* Scoring Matrix — FIRST (no scrolling needed) */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl shadow-md border border-slate-200/60 dark:border-slate-700/60 transition-colors duration-300">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-xs font-black text-slate-400 tracking-widest uppercase">Score Matrix</div>
                  {isMatchWon && <div className="text-[10px] font-black text-emerald-600 uppercase px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200 shadow-sm">🏆 MATCH COMPLETE</div>}
                  {!isMatchWon && isBowlerEmpty && <div className="text-[10px] font-bold text-rose-500 animate-pulse uppercase px-2 py-0.5 bg-rose-50 rounded border border-rose-200 shadow-sm">⚠️ SET BOWLER</div>}
                  {!isMatchWon && showOverBanner && <div className="text-[10px] font-black text-emerald-600 uppercase px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-200 shadow-sm animate-pulse">✅ OVER! NEW BOWLER</div>}
                </div>
                <div className={`grid grid-cols-4 gap-2 ${(isBowlerEmpty || isMatchWon) ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                  <button disabled={matchData.wickets >= 10} onClick={() => { setActiveScore({ runs: 0, isWicket: false, extraType: null }); setCommEvent('0'); }} className={`disabled:opacity-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-lg font-black py-3 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-transform active:scale-95 ${activeScore && activeScore.runs === 0 && !activeScore.extraType && !activeScore.isWicket ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-slate-800' : ''}`}>0</button>
                  <button disabled={matchData.wickets >= 10} onClick={() => { setActiveScore({ runs: 1, isWicket: false, extraType: null }); setCommEvent('1'); }} className={`disabled:opacity-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-lg font-black py-3 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-transform active:scale-95 ${activeScore && activeScore.runs === 1 && !activeScore.extraType && !activeScore.isWicket ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-slate-800' : ''}`}>1</button>
                  <button disabled={matchData.wickets >= 10} onClick={() => { setActiveScore({ runs: 2, isWicket: false, extraType: null }); setCommEvent('2'); }} className={`disabled:opacity-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-lg font-black py-3 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-transform active:scale-95 ${activeScore && activeScore.runs === 2 && !activeScore.extraType && !activeScore.isWicket ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-slate-800' : ''}`}>2</button>
                  <button disabled={matchData.wickets >= 10} onClick={() => { setActiveScore({ runs: 3, isWicket: false, extraType: null }); setCommEvent('3'); }} className={`disabled:opacity-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-lg font-black py-3 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-transform active:scale-95 ${activeScore && activeScore.runs === 3 && !activeScore.extraType && !activeScore.isWicket ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-slate-800' : ''}`}>3</button>
                  <button disabled={matchData.wickets >= 10} onClick={() => { setActiveScore({ runs: 4, isWicket: false, extraType: null }); setCommEvent('4'); }} className={`disabled:opacity-50 col-span-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-400 text-lg font-black py-3 rounded-xl shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-transform active:scale-95 ${activeScore && activeScore.runs === 4 && !activeScore.extraType && !activeScore.isWicket ? 'ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-900/70' : ''}`}>4</button>
                  <button disabled={matchData.wickets >= 10} onClick={() => { setActiveScore({ runs: 6, isWicket: false, extraType: null }); setCommEvent('6'); }} className={`disabled:opacity-50 col-span-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400 text-lg font-black py-3 rounded-xl shadow-sm hover:bg-green-100 dark:hover:bg-green-900/50 transition-transform active:scale-95 ${activeScore && activeScore.runs === 6 && !activeScore.extraType && !activeScore.isWicket ? 'ring-2 ring-green-500 bg-green-100 dark:bg-green-900/70' : ''}`}>6</button>
                  <button disabled={matchData.wickets >= 10 || isBowlerEmpty} onClick={() => { setShowWicketModal(true); }} className={`col-span-4 border text-lg font-black py-2.5 rounded-xl shadow-sm transition-transform tracking-widest ${matchData.wickets >= 10 ? 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-95'}`}>🚨 WICKET</button>
                  <button disabled={matchData.wickets >= 10} onClick={() => { setActiveScore({ runs: 0, isWicket: false, extraType: 'LB' }); setCommEvent('LB'); }} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-black py-2.5 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-transform active:scale-95 ${activeScore && activeScore.extraType === 'LB' ? 'ring-2 ring-slate-400 bg-slate-100 dark:bg-slate-800' : ''}`}>LB</button>
                  <button disabled={matchData.wickets >= 10} onClick={() => { setActiveScore({ runs: 0, isWicket: false, extraType: 'B' }); setCommEvent('B'); }} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-black py-2.5 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-transform active:scale-95 ${activeScore && activeScore.extraType === 'B' ? 'ring-2 ring-slate-400 bg-slate-100 dark:bg-slate-800' : ''}`}>B</button>
                  <button disabled={matchData.wickets >= 10} onClick={() => { setActiveScore({ runs: 0, isWicket: false, extraType: 'Wd' }); setCommEvent('Wd'); }} className={`disabled:opacity-50 col-span-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-500 text-xs font-black py-2.5 rounded-xl shadow-sm hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-transform active:scale-95 ${activeScore && activeScore.extraType === 'Wd' ? 'ring-2 ring-amber-500 bg-amber-100 dark:bg-amber-900/60' : ''}`}>Wd</button>
                  <button disabled={matchData.wickets >= 10} onClick={() => setShowNBModal(true)} className={`disabled:opacity-50 col-span-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-500 text-xs font-black py-2.5 rounded-xl shadow-sm hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-transform active:scale-95 ${activeScore && activeScore.extraType === 'NB' ? 'ring-2 ring-amber-500 bg-amber-100 dark:bg-amber-900/60' : ''}`}>NB</button>
                </div>
              </div>

              {/* Roster Config — Compact */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl shadow-md border border-slate-200/60 dark:border-slate-700/60 space-y-2 transition-colors duration-300">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-slate-400 tracking-widest uppercase flex items-center"><Users size={12} className="mr-1" /> Roster</h3>
                  <button onClick={manuallySwapStrike} className="text-[9px] font-bold uppercase tracking-wider bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600 shadow-sm">SWAP STRIKE</button>
                </div>
                <div className="flex space-x-2 w-full min-w-0">
                  <select value={strikerInput} onChange={e => setStrikerInput(e.target.value)} className="flex-1 w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2 py-2 text-[11px] font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-inner appearance-none transition-colors duration-300">
                    <option value="">Striker: {matchData.striker_name}</option>
                    {rosterList.filter(p => p.team === matchData.team1 && p.inning === matchData.inning).map(p => (
                      <option key={p.id} value={p.player_name}>{p.player_name}</option>
                    ))}
                  </select>
                  <select value={nonStrikerInput} onChange={e => setNonStrikerInput(e.target.value)} className="flex-1 w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2 py-2 text-[11px] font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-inner appearance-none transition-colors duration-300">
                    <option value="">Non: {matchData.non_striker_name}</option>
                    {rosterList.filter(p => p.team === matchData.team1 && p.inning === matchData.inning).map(p => (
                      <option key={p.id} value={p.player_name}>{p.player_name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-2 w-full min-w-0">
                  <select value={bowlerInput} onChange={e => setBowlerInput(e.target.value)} className="flex-1 w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2 py-2 text-[11px] font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-inner appearance-none transition-colors duration-300">
                    <option value="">Bowler: {matchData.bowler_name || "---"}</option>
                    {rosterList.filter(p => p.team === matchData.team2 && p.inning === matchData.inning).map(p => (
                      <option key={p.id} value={p.player_name}>{p.player_name}</option>
                    ))}
                  </select>
                  <button onClick={updateRoster} className="bg-slate-900 dark:bg-slate-700 shrink-0 text-white text-xs font-bold px-4 py-2 rounded-lg shadow hover:bg-slate-800 dark:hover:bg-slate-600 active:scale-95 transition-all">Apply</button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: POSTING & FEED */}
            <div className="lg:w-2/3 flex flex-col gap-6 h-[85vh]">

              {/* Post Commentary Box */}
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl shadow-md border border-slate-200/60 dark:border-slate-700/60 shrink-0 transition-colors duration-300">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-xs font-black text-slate-400 tracking-widest uppercase">Post to Feed</div>
                  <div className="flex bg-white dark:bg-slate-900 p-1 rounded-lg w-48 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors duration-300">
                    <button onClick={() => setTweetMode(false)} className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${!tweetMode ? 'bg-slate-100 dark:bg-slate-800 shadow text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700' : 'text-slate-500 dark:text-slate-400'}`}>Text</button>
                    <button onClick={() => setTweetMode(true)} className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${tweetMode ? 'bg-[#1DA1F2] text-white shadow border border-[#1DA1F2]' : 'text-slate-500 dark:text-slate-400'}`}>Embed</button>
                  </div>
                </div>

                <form onSubmit={handleAdminSubmit} className="space-y-4">
                  {!tweetMode && (
                    <div className="flex gap-4">
                      <input type="text" value={commEvent} onChange={e => setCommEvent(e.target.value)} placeholder="Badge (W, Wd...)" className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase font-black text-center text-slate-600 dark:text-slate-300 shadow-inner transition-colors duration-300" />
                      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-500 dark:text-slate-400 font-bold overflow-hidden whitespace-nowrap overflow-ellipsis shadow-inner flex items-center transition-colors duration-300">
                        Auto-Title: {matchData.bowler_name} to {matchData.striker_name}{activeScore && activeScore.runs !== undefined ? (', ' + (activeScore.extraType || activeScore.runs)) : ''}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <textarea
                      value={adminInput}
                      onChange={(e) => setAdminInput(e.target.value)}
                      placeholder={tweetMode ? "Paste <blockquote class=\"twitter-tweet\">... HTML code or raw X link" : "Describe the delivery..."}
                      className="flex-1 min-h-[60px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 outline-none resize-none font-medium shadow-inner transition-colors duration-300"
                    />
                    <div className="flex flex-col gap-2 w-28">
                      <button type="submit" disabled={!tweetMode && !activeScore} className={`flex-1 bg-blue-600 dark:bg-blue-700 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-95 transition-all shadow-md text-xs font-bold uppercase ${(!tweetMode && !activeScore) ? 'opacity-50 cursor-not-allowed' : ''}`}><Send size={18} className="mr-1" /> Send</button>
                      <button type="button" onClick={handleEventPost} className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-2 rounded-xl border border-slate-300 dark:border-slate-600 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95 transition-all shadow-sm text-[10px] font-bold uppercase tracking-wider">Event Msg</button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Live Feed Preview */}
              <div className="flex-1 flex flex-col min-h-0 min-h-[500px] h-full pb-10">
                <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl flex-1 p-6 overflow-y-auto border border-slate-200/60 dark:border-slate-700/60 shadow-inner flex flex-col w-full max-w-2xl mx-auto gap-y-8 items-center transition-colors duration-300">
                  {commentary.length === 0 && (
                    <div className="text-center text-slate-400 py-10 opacity-60">
                      <RefreshCw className="mx-auto mb-3 w-8 h-8 animate-spin text-slate-300" />
                      <p className="text-sm font-medium">Waiting for updates...</p>
                    </div>
                  )}

                  {commentary.map((item, idx) => {
                    const badge = String(item.event_badge || '').toUpperCase();
                    const isEndOfOver = item.overs && String(item.overs).endsWith('.0') && parseFloat(item.overs) >= 1.0 && badge !== 'WD' && badge !== 'NB';
                    let overStats = null;

                    // Only render the summary if it hasn't been rendered yet for this specific over in the timeline
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
                          <div className="w-full bg-slate-200/50 dark:bg-slate-800/50 py-2.5 px-4 rounded-xl flex items-center justify-center gap-4 text-xs font-black text-slate-500 dark:text-slate-400 tracking-widest uppercase mb-4 border border-slate-200 dark:border-slate-700 shadow-sm my-2 transition-colors duration-300">
                            <span>Over {String(item.overs).split('.')[0]}</span>
                            <span className="text-slate-300 dark:text-slate-600">|</span>
                            <span className="text-slate-700 dark:text-slate-300">{overStats.runs} Runs &bull; {overStats.wickets} Wicket{overStats.wickets !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        <div className={item.type === 'tweet' ? "mb-4" : "animate-in fade-in slide-in-from-bottom-4 duration-500 mb-0 border-b border-slate-200/60 dark:border-slate-700/60 last:border-0"}>
                          {item.type === 'tweet' ? (
                            <div className="flex justify-center w-full shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative group transition-colors duration-300">
                              <TweetEmbed url={item.text} />
                              <button onClick={() => deleteSingleComment(item.id)} className="absolute top-2 right-2 bg-white/80 dark:bg-slate-800/80 p-2 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                            </div>
                          ) : item.type === 'event' ? (
                            <div className="bg-blue-50/80 dark:bg-blue-900/20 p-4 border-l-4 border-blue-500 w-full my-3 rounded-r-2xl relative group shadow-sm transition-colors duration-300">
                              <p className="text-[13px] font-bold text-blue-800 dark:text-blue-400 tracking-tight italic uppercase drop-shadow-sm">
                                🏏 {item.text}
                              </p>
                              <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingCommentId(item.id); setEditText(item.text); setEditBadge(item.event_badge || ""); }} className="bg-white/80 dark:bg-slate-800/80 p-1.5 rounded-full text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 shadow-sm"><Edit2 size={12} /></button>
                                <button onClick={() => deleteSingleComment(item.id)} className="bg-white/80 dark:bg-slate-800/80 p-1.5 rounded-full text-red-500 hover:text-red-600 dark:hover:text-red-400 shadow-sm"><Trash2 size={12} /></button>
                              </div>

                              {editingCommentId === item.id && (
                                <div className="flex flex-col gap-2 mt-3">
                                  <div className="flex gap-2">
                                    <textarea value={editText} onChange={e => setEditText(e.target.value)} className="flex-1 bg-white border border-blue-200 rounded px-3 py-2 text-sm min-h-[50px] shadow-sm text-slate-700" />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingCommentId(null)} className="px-3 py-1 bg-blue-100 rounded text-xs font-bold text-blue-800 flex items-center"><X size={12} className="mr-1" /> Cancel</button>
                                    <button onClick={() => saveCommentEdit(item.id)} className="px-3 py-1 bg-blue-600 rounded text-xs font-bold text-white flex items-center"><Check size={12} className="mr-1" /> Save</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-3 bg-transparent px-2 group relative">
                              <div className="w-10 pt-1 text-left sm:text-right shrink-0 hidden sm:block">
                                <span className="text-xs font-bold text-slate-400 tabular-nums">{item.overs || "-"}</span>
                              </div>

                              <div className="shrink-0 pt-0.5">
                                <div className={`min-w-[2.25rem] h-9 px-2 rounded-full inline-flex items-center justify-center font-black text-[12px] shadow-sm ${getBadgeStyle(String(item.event_badge))}`}>
                                  {String(item.event_badge || "-")}
                                </div>
                              </div>

                              <div className="flex flex-col pb-1 flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="sm:hidden text-xs font-bold text-slate-400 tabular-nums">{item.overs || "-"}</span>
                                  {item.bowler_batter_title && (
                                    <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">{item.bowler_batter_title}</span>
                                  )}
                                </div>

                                {editingCommentId === item.id ? (
                                  <div className="flex flex-col gap-2 mt-2 w-full pr-10">
                                    <div className="flex gap-2">
                                      <input type="text" value={editBadge} onChange={e => setEditBadge(e.target.value)} placeholder="Badge" className="w-20 bg-white dark:bg-slate-900 shadow-inner border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors duration-300" />
                                      <textarea value={editText} onChange={e => setEditText(e.target.value)} className="flex-1 bg-white dark:bg-slate-900 shadow-inner border border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm min-h-[50px] text-slate-700 dark:text-slate-300 transition-colors duration-300" />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <button onClick={() => setEditingCommentId(null)} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center"><X size={12} className="mr-1" /> Cancel</button>
                                      <button onClick={() => saveCommentEdit(item.id)} className="px-3 py-1 bg-emerald-500 dark:bg-emerald-600 rounded text-xs font-bold text-white flex items-center"><Check size={12} className="mr-1" /> Save</button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{item.text}</p>
                                )}
                              </div>

                              <div className="absolute top-4 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingCommentId(item.id); setEditText(item.text); setEditBadge(item.event_badge || ""); }} className="text-slate-400 hover:text-blue-500 bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-full shadow-sm"><Edit2 size={14} /></button>
                                <button onClick={() => deleteSingleComment(item.id)} className="text-slate-400 hover:text-red-500 bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-full shadow-sm"><Trash2 size={14} /></button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>)}

      {/* ===== WICKET MODAL ===== */}
      {showWicketModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 transition-colors duration-300">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🏐</div>
              <h2 className="text-2xl font-black text-red-600 tracking-tight">WICKET!</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Complete the dismissal details below</p>
              <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">
                {matchData.bowler_name} to {matchData.striker_name}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {/* Dismissal Type */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Dismissal Type</label>
                <select value={dismissalType} onChange={e => { setDismissalType(e.target.value); if (e.target.value !== 'Run Out') { setWicketWhoOut('S'); setWicketRunsCompleted('0'); } }} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-red-500 outline-none appearance-none transition-colors duration-300">
                  <option value="">-- Select Type --</option>
                  <option value="Caught">Caught</option>
                  <option value="Bowled">Bowled</option>
                  <option value="LBW">LBW</option>
                  <option value="Stumped">Stumped</option>
                  <option value="Run Out">Run Out</option>
                  <option value="Hit Wicket">Hit Wicket</option>
                </select>
              </div>

              {/* Fielder (conditional) */}
              {['Caught', 'Stumped', 'Run Out'].includes(dismissalType) && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Fielder / Keeper</label>
                  <select value={wicketFielder} onChange={e => setWicketFielder(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-red-500 outline-none appearance-none transition-colors duration-300">
                    <option value="">-- Select Fielder --</option>
                    {rosterList.filter(p => p.team === matchData.team2 && p.inning === matchData.inning).map(p => (
                      <option key={p.id} value={p.player_name}>{p.player_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Run Out specific fields */}
              {dismissalType === 'Run Out' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Who is Out?</label>
                    <select value={wicketWhoOut} onChange={e => setWicketWhoOut(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-red-500 outline-none appearance-none transition-colors duration-300">
                      <option value="S">Striker ({matchData.striker_name})</option>
                      <option value="NS">Non-Striker ({matchData.non_striker_name})</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Runs Completed</label>
                    <input type="number" value={wicketRunsCompleted} onChange={e => setWicketRunsCompleted(e.target.value)} min="0" max="6" className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-red-500 outline-none transition-colors duration-300" />
                  </div>
                </>
              )}

              {/* Next Batter (hide for last wicket) */}
              {matchData.wickets < 9 && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Next Batter</label>
                  <select value={nextBatter} onChange={e => setNextBatter(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-red-500 outline-none appearance-none transition-colors duration-300">
                    <option value="">-- Select Next Batter --</option>
                    {rosterList.filter(p => p.team === matchData.team1 && p.status === 'dugout' && p.inning === matchData.inning).map(p => (
                      <option key={p.id} value={p.player_name}>{p.player_name}</option>
                    ))}
                  </select>
                </div>
              )}
              {matchData.wickets >= 9 && (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800/50 rounded-xl p-4 text-center transition-colors duration-300">
                  <p className="text-red-600 dark:text-red-500 font-black text-sm uppercase tracking-wider">🚨 LAST WICKET — INNINGS WILL END</p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button onClick={() => { setShowWicketModal(false); setPendingWicket(null); setNextBatter(""); setDismissalType(""); setWicketFielder(""); setWicketWhoOut("S"); setWicketRunsCompleted("0"); }} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={handleWicketConfirm} className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-black text-sm uppercase tracking-wider rounded-xl shadow-lg hover:shadow-red-500/30 hover:scale-[1.02] active:scale-95 transition-all">{matchData.wickets >= 9 ? 'END INNINGS' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}

      {/* NO BALL MODAL */}
      {showNBModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center px-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 w-full max-w-sm relative border-t-4 border-amber-500 transition-colors duration-300">
            <h2 className="text-lg font-black text-amber-700 dark:text-amber-500 mb-1 tracking-tight">NO BALL</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Select runs scored off the bat</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[0, 1, 2, 3, 4, 6].map(r => (
                <button key={r} onClick={() => {
                  const badge = r > 0 ? `NB+${r}` : 'NB';
                  setActiveScore({ runs: r, isWicket: false, extraType: 'NB', offBat: r > 0 });
                  setCommEvent(badge);
                  setShowNBModal(false);
                }} className={`py-4 text-xl font-black rounded-xl transition-all active:scale-95 shadow-sm ${r === 4 ? 'bg-blue-50 dark:bg-blue-900/40 border-2 border-blue-300 dark:border-blue-700/50 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/50' :
                  r === 6 ? 'bg-green-50 dark:bg-green-900/40 border-2 border-green-300 dark:border-green-700/50 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800/50' :
                    'bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}>
                  {r}
                </button>
              ))}
            </div>
            <button onClick={() => setShowNBModal(false)} className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
