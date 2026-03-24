import { useCallback, useEffect, useState } from 'react';
import type { Chore, Member } from './types';
import { getChores, getMembers } from './api';
import CalendarView from './components/CalendarView';
import ChoreFormModal from './components/ChoreFormModal';
import MembersPanel from './components/MembersPanel';
import './App.css';

export default function App() {
  const [members, setMembers] = useState<Member[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editChore, setEditChore] = useState<Chore | undefined>();
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>();
  const [prefilledEndDate, setPrefilledEndDate] = useState<string | undefined>();

  const loadData = useCallback(async () => {
    const [m, c] = await Promise.all([getMembers(), getChores()]);
    setMembers(m);
    setChores(c);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const refreshAll = useCallback(async () => {
    await loadData();
    setRefreshKey(k => k + 1);
  }, [loadData]);

  const openNewChore = useCallback((startDate?: string, endDate?: string) => {
    setEditChore(undefined);
    setPrefilledDate(startDate);
    setPrefilledEndDate(endDate);
    setModalOpen(true);
  }, []);

  function openEditChore(chore: Chore) {
    setEditChore(chore);
    setPrefilledDate(undefined);
    setPrefilledEndDate(undefined);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditChore(undefined);
    setPrefilledDate(undefined);
    setPrefilledEndDate(undefined);
  }

  async function handleSave() {
    closeModal();
    await refreshAll();
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo">🗓</span>
        <h1>Office Chores</h1>
        <button className="btn-add-chore" onClick={() => openNewChore()}>
          + New Chore
        </button>
      </header>

      <div className="app-body">
        <CalendarView
          chores={chores}
          members={members}
          onAddChore={openNewChore}
          onEditChore={openEditChore}
          onRefresh={refreshAll}
          refreshKey={refreshKey}
        />
        <MembersPanel
          members={members}
          onMembersChange={loadData}
        />
      </div>

      {modalOpen && (
        <ChoreFormModal
          members={members}
          initialDate={prefilledDate}
          initialEndDate={prefilledEndDate}
          chore={editChore}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
