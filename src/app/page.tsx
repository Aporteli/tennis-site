'use client';

import { useState } from 'react';
import { Header } from '../components/header/Header';
import { Controls } from '../components/Controls';
import { Bracket } from '../components/Bracket';
import { LoginModal } from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal'; // 1. დაემატა RegisterModal-ის იმპორტი
import { ScoreModal } from '../components/ScoreModal';
import { WalkoverModal } from '../components/WalkoverModal';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useTournament } from '../hooks/useTournament';
import type { MatchInfo, PendingWalkover, Player, SetScore } from '../lib/types';

export default function Page() {
  const { user, login, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const tournament = useTournament();

  const {
    mode,
    switchMode,
    bracketData,
    matchDetails,
    stats,
    isDrawing,
    saveScore,
    confirmWalkover,
  } = tournament;

  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false); // 2. დაემატა State რეგისტრაციის მოდალისთვის
  const [scoreInfo, setScoreInfo] = useState<MatchInfo | null>(null);
  const [pendingWo, setPendingWo] = useState<PendingWalkover | null>(null);

  const isAdmin = !!user;
  const numRounds = bracketData[0] ? Math.log2(bracketData[0].length) : 0;

  const handleAuthClick = () => {
    if (user) logout();
    else setLoginOpen(true);
  };

  const handleMatchClick = (
    r: number,
    matchIdx: number,
    _playerIndex: 0 | 1,
  ) => {
    if (!isAdmin || isDrawing) return;

    const p1 = bracketData[r]?.[matchIdx * 2] ?? null;
    const p2 = bracketData[r]?.[matchIdx * 2 + 1] ?? null;
    if (!p1 && !p2) return;

    if (!p1 || !p2) {
      const existing = (p1 ?? p2) as Player;
      setPendingWo({
        r,
        matchIdx,
        existingPlayer: existing,
        winnerIndex: p1 ? 0 : 1,
      });
      return;
    }

    setScoreInfo({ r, slot: matchIdx * 2, matchIdx, p1, p2 });
  };

  const handleScoreSave = (sets: SetScore[]) => {
    if (!scoreInfo) return;
    saveScore(scoreInfo, sets);
    setScoreInfo(null);
  };

  const handleWalkoverConfirm = () => {
    if (!pendingWo) return;
    confirmWalkover(pendingWo);
    setPendingWo(null);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-24 md:px-8">
      <Header
        mode={mode}
        size={stats.size}
        numRounds={numRounds}
        stats={stats}
        isLoggedIn={isAdmin}
        isAdmin={isAdmin}
        onAuthClick={handleAuthClick}
        onRegisterClick={() => setRegisterOpen(true)} // 3. გადაეცა რეგისტრაციის გასახსნელი ფუნქცია
      />

      <Controls mode={mode} onModeChange={switchMode} />

      <Bracket
        bracketData={bracketData}
        matchDetails={matchDetails}
        mode={mode}
        onMatchClick={handleMatchClick}
      />

      {/* 4. დაემატა RegisterModal კომპონენტი */}
      <RegisterModal
        isOpen={registerOpen}
        mode={mode}
        onClose={() => setRegisterOpen(false)}
      />

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
      />

      <ScoreModal
        open={!!scoreInfo}
        p1={scoreInfo?.p1 ?? null}
        p2={scoreInfo?.p2 ?? null}
        onCancel={() => setScoreInfo(null)}
        onSave={handleScoreSave}
      />

      <WalkoverModal
        open={!!pendingWo}
        pending={pendingWo}
        onCancel={() => setPendingWo(null)}
        onConfirm={handleWalkoverConfirm}
      />
    </div>
  );
}