'use client';

import { useState } from 'react';
import { PlayersModal } from '../../components/PlayersModal';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminTabs } from '../../components/admin/AdminTabs';
import { DrawControls } from '../../components/admin/DrawControls';
import { PlayerValidationPanel } from '../../components/admin/PlayerValidationPanel';
import { TournamentStatus } from '../../components/admin/TournamentStatus';
import { useAdminActions } from '../../hooks/useAdminActions';
import { useTournament } from '../../hooks/useTournament';
import { formatPlayersModalValue } from '../../lib/players';
import type { AdminTab } from '../../types/tournament';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('draw');
  const [playersOpen, setPlayersOpen] = useState(false);

  const {
    mode,
    switchMode,
    players,
    registrations,
    isDrawing,
    hasExistingDraw,
    undoStack,
    undo,
    savePlayers,
    updatePlayerStatus,
    updateRegistrationSeed,
    assignPlayerToMode,
    deleteRegistration,
    pairPlayers,
    unpairPlayer,
    resetDraw,
  } = useTournament();

  const {
    handleDrawToggle,
    handlePlayersSave,
    handleSeedChange,
    handleResetSeed,
    handleStatusChange,
    handleAssignToMode,
    handleDeletePlayer,
    handlePairPlayers,
    handleUnpairPlayer,
  } = useAdminActions({
    mode,
    players,
    isDrawing,
    hasExistingDraw,
    savePlayers,
    updatePlayerStatus,
    updateRegistrationSeed,
    assignPlayerToMode,
    deleteRegistration,
    pairPlayers,
    unpairPlayer,
    resetDraw,
    onPlayersSaved: () => setPlayersOpen(false),
  });

  const canUndo = undoStack.length > 0 && !isDrawing;
  const playersValue = formatPlayersModalValue(mode, players, registrations);

  return (
    <div className="min-h-screen bg-surface text-ink antialiased pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AdminHeader />

        <AdminTabs activeTab={activeTab} onChange={setActiveTab} />

        <TournamentStatus mode={mode} registrations={registrations} hasExistingDraw={hasExistingDraw} />

        {activeTab === 'draw' ? (
          <DrawControls
            mode={mode}
            isDrawing={isDrawing}
            hasExistingDraw={hasExistingDraw}
            canUndo={canUndo}
            onManagePlayers={() => setPlayersOpen(true)}
            onDrawToggle={handleDrawToggle}
            onSwitchMode={switchMode}
            onUndo={undo}
          />
        ) : (
          <PlayerValidationPanel
            players={registrations}
            onSeedChange={handleSeedChange}
            onResetSeed={handleResetSeed}
            onStatusChange={handleStatusChange}
            onAssignToMode={handleAssignToMode}
            onDeletePlayer={handleDeletePlayer}
            onPair={handlePairPlayers}
            onUnpair={handleUnpairPlayer}
          />
        )}
      </div>

      <PlayersModal
        open={playersOpen}
        mode={mode}
        initialValue={playersValue}
        onCancel={() => setPlayersOpen(false)}
        onSave={handlePlayersSave}
      />
    </div>
  );
}
