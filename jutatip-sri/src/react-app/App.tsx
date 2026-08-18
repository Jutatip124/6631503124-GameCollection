import { useState, useEffect } from "react";

interface Game {
  id: string;
  title: string;
  genre: string;
  platform: string;
  store: string | null;
  status: "want_to_play" | "playing" | "completed" | "dropped";
  priority: "low" | "medium" | "high" | null;
  rating: number | null;
  review: string | null;
  image_url: string | null;
  played_hours: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

interface StatusMeta {
  label: string;
  icon: string;
  color: string;
  bg: string;
  text: string;
}

// Store icons mapping
const STORE_ICONS: Record<string, string> = {
  "Steam": "🟦",
  "Epic Games": "🟪",
  "Xbox": "🟩",
  "PlayStation": "🔵",
  "Nintendo": "🔴",
  "GOG": "🟧",
  "Ubisoft": "🟨",
  "EA": "⬛",
  "Battle.net": "🟫",
};

const getStoreIcon = (store: string | null) => {
  if (!store) return "📦";
  for (const [key, icon] of Object.entries(STORE_ICONS)) {
    if (store.toLowerCase().includes(key.toLowerCase())) {
      return icon;
    }
  }
  return "📦";
};

// Priority config
const PRIORITY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  low: { label: "Low", icon: "🟢", color: "#4CAF50" },
  medium: { label: "Medium", icon: "🟡", color: "#FFC107" },
  high: { label: "High", icon: "🔴", color: "#F44336" },
};

// Calculate duration between two dates
const calculateDuration = (start: string | null, end: string | null) => {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

function App() {
  const [games, setGames] = useState<Game[]>([]);
  const [form, setForm] = useState({
    title: "",
    genre: "",
    platform: "",
    store: "",
    status: "want_to_play" as Game["status"],
    priority: "medium" as "low" | "medium" | "high",
    rating: "",
    review: "",
    played_hours: "",
    started_at: "",
    finished_at: "",
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  
  // Edit state
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    genre: "",
    platform: "",
    store: "",
    status: "want_to_play" as Game["status"],
    priority: "medium" as "low" | "medium" | "high",
    rating: "",
    review: "",
    played_hours: "",
    started_at: "",
    finished_at: "",
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadGames = async (statusFilter?: string) => {
    try {
      const url = statusFilter
        ? `/api/games?status=${statusFilter}`
        : "/api/games";
      const response = await fetch(url);
      const result = await response.json();
      setGames(result.data || []);
    } catch (error) {
      console.error("Error loading games:", error);
    } finally {
      setLoading(false);
    }
  };

  const createGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.genre || !form.platform) {
      alert("Please fill in title, genre, and platform");
      return;
    }

    try {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          genre: form.genre,
          platform: form.platform,
          store: form.store || undefined,
          status: form.status,
          priority: form.priority,
          rating: form.rating ? parseInt(form.rating) : undefined,
          review: form.review || undefined,
          played_hours: form.played_hours ? parseInt(form.played_hours) : 0,
          started_at: form.started_at || undefined,
          finished_at: form.finished_at || undefined,
        }),
      });

      if (response.ok) {
        setForm({
          title: "",
          genre: "",
          platform: "",
          store: "",
          status: "want_to_play",
          priority: "medium",
          rating: "",
          review: "",
          played_hours: "",
          started_at: "",
          finished_at: "",
        });
        await loadGames(filter || undefined);
      } else {
        const error = await response.json();
        alert(error.error || "Error creating game");
      }
    } catch (error) {
      console.error("Error creating game:", error);
      alert("Error creating game");
    }
  };

  const updateStatus = async (id: string, status: Game["status"]) => {
    try {
      await fetch(`/api/games/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await loadGames(filter || undefined);
    } catch (error) {
      console.error("Error updating game:", error);
    }
  };

  const deleteGame = async (id: string) => {
    if (!confirm("Are you sure you want to delete this game?")) return;
    try {
      await fetch(`/api/games/${id}`, { method: "DELETE" });
      await loadGames(filter || undefined);
    } catch (error) {
      console.error("Error deleting game:", error);
    }
  };

  // ============ Edit Functions ============
  const openEditModal = (game: Game) => {
    setEditingGame(game);
    setEditForm({
      title: game.title,
      genre: game.genre,
      platform: game.platform,
      store: game.store || "",
      status: game.status,
      priority: game.priority || "medium",
      rating: game.rating?.toString() || "",
      review: game.review || "",
      played_hours: game.played_hours?.toString() || "",
      started_at: game.started_at || "",
      finished_at: game.finished_at || "",
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingGame(null);
  };

  const updateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame) return;

    try {
      const response = await fetch(`/api/games/${editingGame.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          genre: editForm.genre,
          platform: editForm.platform,
          store: editForm.store || undefined,
          status: editForm.status,
          priority: editForm.priority,
          rating: editForm.rating ? parseInt(editForm.rating) : null,
          review: editForm.review || undefined,
          played_hours: editForm.played_hours ? parseInt(editForm.played_hours) : 0,
          started_at: editForm.started_at || undefined,
          finished_at: editForm.finished_at || undefined,
        }),
      });

      if (response.ok) {
        await loadGames(filter || undefined);
        closeEditModal();
      } else {
        const error = await response.json();
        alert(error.error || "Error updating game");
      }
    } catch (error) {
      console.error("Error updating game:", error);
      alert("Error updating game");
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const STATUS: Record<Game["status"], StatusMeta> = {
    want_to_play: { label: "Want to play", icon: "◇", color: "#9B8CF2", bg: "#211D45", text: "#C6BBFA" },
    playing: { label: "Playing", icon: "▶", color: "#4FD1AE", bg: "#132C2A", text: "#8CEBD1" },
    completed: { label: "Completed", icon: "★", color: "#F2A65A", bg: "#2E2312", text: "#F6C68C" },
    dropped: { label: "Dropped", icon: "✕", color: "#F2646B", bg: "#301A1F", text: "#F79BA0" },
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <span style={{ letterSpacing: "1px" }}>
        {"●".repeat(rating)}
        <span style={{ opacity: 0.25 }}>{"●".repeat(5 - rating)}</span>
      </span>
    );
  };

  const counts = games.reduce(
    (acc, g) => {
      acc.all += 1;
      acc[g.status] = (acc[g.status] || 0) + 1;
      return acc;
    },
    { all: 0 } as Record<string, number>
  );

  if (loading) {
    return (
      <div style={styles.page}>
        <FontLoader />
        <div style={styles.loadingWrap}>
          <div style={styles.loadingGlyph}>◆</div>
          <p style={styles.loadingText}>loading_library&hellip;</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <FontLoader />
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.eyebrow}>MY_LIBRARY.SAV</div>
          <h1 style={styles.title}>Game Collection</h1>
          <p style={styles.subtitle}>
            Track what you're playing, what's next, and what didn't make the cut.
          </p>
        </header>

        {/* Filter row */}
        <div style={styles.filterRow}>
          <FilterPill
            active={filter === ""}
            onClick={() => { setFilter(""); loadGames(); }}
            label="All"
            count={counts.all}
            accent="#F0F1FA"
          />
          {Object.entries(STATUS).map(([key, s]) => (
            <FilterPill
              key={key}
              active={filter === key}
              onClick={() => { setFilter(key); loadGames(key); }}
              label={s.label}
              icon={s.icon}
              count={counts[key] || 0}
              accent={s.color}
            />
          ))}
        </div>

        {/* Add game form */}
        <form onSubmit={createGame} style={styles.formCard}>
          <div style={styles.formHeader}>
            <span style={styles.formSlot}>＋</span>
            <div>
              <div style={styles.formTitle}>New cartridge</div>
              <div style={styles.formHint}>Add a title to your collection</div>
            </div>
          </div>

          <div style={styles.formGrid}>
            <Field label="Title">
              <input
                type="text"
                placeholder="Elden Ring"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={styles.input}
                required
              />
            </Field>
            <Field label="Genre">
              <input
                type="text"
                placeholder="Action RPG"
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                style={styles.input}
                required
              />
            </Field>
            <Field label="Platform">
              <input
                type="text"
                placeholder="PC"
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                style={styles.input}
                required
              />
            </Field>
            <Field label="Store/Launcher">
              <select
                value={form.store}
                onChange={(e) => setForm({ ...form, store: e.target.value })}
                style={styles.input}
              >
                <option value="">Select store...</option>
                <option value="Steam">🟦 Steam</option>
                <option value="Epic Games">🟪 Epic Games</option>
                <option value="Xbox">🟩 Xbox</option>
                <option value="PlayStation">🔵 PlayStation</option>
                <option value="Nintendo">🔴 Nintendo</option>
                <option value="GOG">🟧 GOG</option>
                <option value="Ubisoft">🟨 Ubisoft</option>
                <option value="EA">⬛ EA</option>
                <option value="Battle.net">🟫 Battle.net</option>
                <option value="Other">📦 Other</option>
              </select>
            </Field>
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Game["status"] })}
                style={styles.input}
              >
                {Object.entries(STATUS).map(([key, s]) => (
                  <option key={key} value={key}>{s.icon} {s.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as "low" | "medium" | "high" })}
                style={styles.input}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </Field>
            <Field label="Rating (1–5)">
              <input
                type="number"
                placeholder="—"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                style={{ ...styles.input, fontFamily: "'JetBrains Mono', monospace" }}
                min="1"
                max="5"
              />
            </Field>
            <Field label="Hours played">
              <input
                type="number"
                placeholder="0"
                value={form.played_hours}
                onChange={(e) => setForm({ ...form, played_hours: e.target.value })}
                style={{ ...styles.input, fontFamily: "'JetBrains Mono', monospace" }}
                min="0"
              />
            </Field>
            <Field label="Date Started">
              <input
                type="date"
                value={form.started_at}
                onChange={(e) => setForm({ ...form, started_at: e.target.value })}
                style={styles.input}
              />
            </Field>
            <Field label="Date Finished">
              <input
                type="date"
                value={form.finished_at}
                onChange={(e) => setForm({ ...form, finished_at: e.target.value })}
                style={styles.input}
              />
            </Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Review (optional)">
                <input
                  type="text"
                  placeholder="What stuck with you about it?"
                  value={form.review}
                  onChange={(e) => setForm({ ...form, review: e.target.value })}
                  style={styles.input}
                />
              </Field>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={styles.submitBtn}>
            Add to collection
          </button>
        </form>

        {/* Game list */}
        {games.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyGlyph}>◇</div>
            <p style={styles.emptyTitle}>Your shelf is empty</p>
            <p style={styles.emptyHint}>Add your first game using the form above.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {games.map((game) => {
              const s = STATUS[game.status];
              const duration = calculateDuration(game.started_at, game.finished_at);
              const priorityInfo = game.priority ? PRIORITY_CONFIG[game.priority] : null;
              return (
                <div key={game.id} className="game-card" style={styles.card(s.color)}>
                  <div style={styles.cardBody}>
                    <div style={styles.cardTop}>
                      <div>
                        <h3 style={styles.cardTitle}>{game.title}</h3>
                        <div style={styles.cardMeta}>
                          {game.genre} <span style={styles.dot}>·</span> {game.platform}
                          {game.store && (
                            <>
                              <span style={styles.dot}>·</span>
                              <span style={styles.storeBadge}>
                                {getStoreIcon(game.store)} {game.store}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div style={styles.badgeGroup}>
                        {priorityInfo && (
                          <span style={{ ...styles.priorityBadge, color: priorityInfo.color }}>
                            {priorityInfo.icon} {priorityInfo.label}
                          </span>
                        )}
                        <span style={styles.statusTag(s)}>
                          {s.icon} {s.label}
                        </span>
                      </div>
                    </div>

                    <div style={styles.cardMid}>
                      {game.rating ? (
                        <span style={{ ...styles.statPill, color: s.color }}>
                          {renderStars(game.rating)}
                        </span>
                      ) : null}
                      {game.played_hours > 0 ? (
                        <span style={styles.statPill}>
                          <span style={styles.mono}>{game.played_hours}h</span> played
                        </span>
                      ) : null}
                      {game.started_at && (
                        <span style={styles.statPill}>
                          🎮 Started: {new Date(game.started_at).toLocaleDateString('th-TH')}
                        </span>
                      )}
                      {game.finished_at && (
                        <span style={styles.statPill}>
                          ✅ Finished: {new Date(game.finished_at).toLocaleDateString('th-TH')}
                        </span>
                      )}
                      {duration !== null && duration > 0 && (
                        <span style={styles.statPill}>
                          ⏱️ {duration} days
                        </span>
                      )}
                    </div>

                    {game.review && (
                      <p style={styles.review}>&ldquo;{game.review}&rdquo;</p>
                    )}
                  </div>

                  <div style={styles.cardControls}>
                    <button
                      onClick={() => openEditModal(game)}
                      style={styles.editBtn}
                    >
                      ✏️ Edit
                    </button>
                    <select
                      value={game.status}
                      onChange={(e) => updateStatus(game.id, e.target.value as Game["status"])}
                      style={styles.selectSmall}
                    >
                      {Object.entries(STATUS).map(([key, st]) => (
                        <option key={key} value={key}>{st.icon} {st.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => deleteGame(game.id)}
                      className="btn-delete"
                      style={styles.deleteBtn}
                      aria-label={`Delete ${game.title}`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingGame && (
        <div style={styles.modalOverlay} onClick={closeEditModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>✏️ Edit Game</h2>
              <button onClick={closeEditModal} style={styles.modalClose}>
                ✕
              </button>
            </div>
            
            <form onSubmit={updateGame} style={styles.modalForm}>
              <div style={styles.modalGrid}>
                <Field label="Title">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    style={styles.input}
                    required
                  />
                </Field>
                <Field label="Genre">
                  <input
                    type="text"
                    value={editForm.genre}
                    onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
                    style={styles.input}
                    required
                  />
                </Field>
                <Field label="Platform">
                  <input
                    type="text"
                    value={editForm.platform}
                    onChange={(e) => setEditForm({ ...editForm, platform: e.target.value })}
                    style={styles.input}
                    required
                  />
                </Field>
                <Field label="Store/Launcher">
                  <select
                    value={editForm.store}
                    onChange={(e) => setEditForm({ ...editForm, store: e.target.value })}
                    style={styles.input}
                  >
                    <option value="">Select store...</option>
                    <option value="Steam">🟦 Steam</option>
                    <option value="Epic Games">🟪 Epic Games</option>
                    <option value="Xbox">🟩 Xbox</option>
                    <option value="PlayStation">🔵 PlayStation</option>
                    <option value="Nintendo">🔴 Nintendo</option>
                    <option value="GOG">🟧 GOG</option>
                    <option value="Ubisoft">🟨 Ubisoft</option>
                    <option value="EA">⬛ EA</option>
                    <option value="Battle.net">🟫 Battle.net</option>
                    <option value="Other">📦 Other</option>
                  </select>
                </Field>
                <Field label="Status">
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Game["status"] })}
                    style={styles.input}
                  >
                    {Object.entries(STATUS).map(([key, s]) => (
                      <option key={key} value={key}>{s.icon} {s.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Priority">
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as "low" | "medium" | "high" })}
                    style={styles.input}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </Field>
                <Field label="Rating (1-5)">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={editForm.rating}
                    onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })}
                    style={styles.input}
                  />
                </Field>
                <Field label="Hours played">
                  <input
                    type="number"
                    min="0"
                    value={editForm.played_hours}
                    onChange={(e) => setEditForm({ ...editForm, played_hours: e.target.value })}
                    style={styles.input}
                  />
                </Field>
                <Field label="Date Started">
                  <input
                    type="date"
                    value={editForm.started_at}
                    onChange={(e) => setEditForm({ ...editForm, started_at: e.target.value })}
                    style={styles.input}
                  />
                </Field>
                <Field label="Date Finished">
                  <input
                    type="date"
                    value={editForm.finished_at}
                    onChange={(e) => setEditForm({ ...editForm, finished_at: e.target.value })}
                    style={styles.input}
                  />
                </Field>
                <div style={{ gridColumn: "1 / -1" }}>
                  <Field label="Review">
                    <input
                      type="text"
                      placeholder="What stuck with you about it?"
                      value={editForm.review}
                      onChange={(e) => setEditForm({ ...editForm, review: e.target.value })}
                      style={styles.input}
                    />
                  </Field>
                </div>
              </div>
              
              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  style={styles.modalCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.modalSave}
                >
                  💾 Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <GlobalStyle />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={styles.field}>
      <span style={styles.fieldLabel}>{label}</span>
      {children}
    </label>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  icon,
  count,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: string;
  count: number;
  accent: string;
}) {
  return (
    <button
      onClick={onClick}
      className="filter-pill"
      style={{
        ...styles.filterPill,
        borderColor: active ? accent : "#2C2F5C",
        color: active ? accent : "#9092B8",
        background: active ? "rgba(255,255,255,0.04)" : "transparent",
      }}
    >
      {icon ? <span>{icon}</span> : null} {label}
      <span style={styles.filterCount}>{count}</span>
    </button>
  );
}

function FontLoader() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
    `}</style>
  );
}

function GlobalStyle() {
  return (
    <style>{`
      * { 
        box-sizing: border-box; 
        margin: 0;
        padding: 0;
      }
      
      body {
        margin: 0;
        padding: 0;
        min-height: 100vh;
        background: #0E0F26;
        display: flex;
        justify-content: center;
      }
      
      #root {
        width: 100%;
        display: flex;
        justify-content: center;
      }
      
      input::placeholder { color: #565A8C; }
      input, select {
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      input:focus, select:focus {
        outline: none;
        border-color: #F2A65A !important;
        box-shadow: 0 0 0 3px rgba(242,166,90,0.15);
      }
      .filter-pill:hover { border-color: #4A4E86 !important; }
      .btn-primary {
        transition: transform 0.12s ease, background 0.15s ease;
      }
      .btn-primary:hover { background: #FFB876 !important; }
      .btn-primary:active { transform: scale(0.98); }
      .game-card {
        transition: transform 0.15s ease, border-color 0.15s ease;
      }
      .game-card:hover {
        transform: translateY(-2px);
        border-color: #3D4080 !important;
      }
      .btn-delete { transition: background 0.15s ease, color 0.15s ease; }
      .btn-delete:hover { background: #F2646B !important; color: #1A0E10 !important; }
      
      /* ===== Responsive ===== */
      @media (max-width: 768px) {
        .page {
          padding: 24px 12px 60px !important;
        }
        .container {
          padding: 0 8px !important;
        }
        .form-grid {
          grid-template-columns: 1fr !important;
        }
        .game-card {
          grid-template-columns: 1fr !important;
          gap: 12px !important;
        }
        .card-controls {
          flex-direction: row !important;
          flex-wrap: wrap !important;
        }
        .card-controls button,
        .card-controls select {
          flex: 1 !important;
          min-width: 60px !important;
        }
        .modal {
          padding: 20px !important;
          margin: 10px !important;
        }
        .modal-grid {
          grid-template-columns: 1fr !important;
        }
        .modal-actions {
          flex-direction: column !important;
        }
        .modal-actions button {
          width: 100% !important;
        }
        .filter-row {
          gap: 6px !important;
        }
        .filter-pill {
          font-size: 11px !important;
          padding: 6px 10px !important;
        }
        .card-title {
          font-size: 15px !important;
        }
      }

      @media (max-width: 480px) {
        .page {
          padding: 16px 8px 40px !important;
        }
        .title {
          font-size: 1.8rem !important;
        }
        .subtitle {
          font-size: 13px !important;
        }
        .form-card {
          padding: 14px !important;
        }
        .form-header {
          gap: 10px !important;
        }
        .form-slot {
          width: 28px !important;
          height: 28px !important;
          font-size: 14px !important;
        }
        .form-title {
          font-size: 14px !important;
        }
        .filter-pill {
          font-size: 10px !important;
          padding: 4px 8px !important;
        }
        .card-title {
          font-size: 14px !important;
        }
        .card-controls button,
        .card-controls select {
          font-size: 10px !important;
          padding: 4px 6px !important;
        }
        .modal {
          padding: 16px !important;
        }
        .modal-title {
          font-size: 18px !important;
        }
        .modal-actions {
          flex-direction: column !important;
        }
        .modal-actions button {
          width: 100% !important;
        }
      }
    `}</style>
  );
}

const styles: Record<string, any> = {
  page: {
    minHeight: "100vh",
    background: "#0E0F26",
    fontFamily: "'Inter', sans-serif",
    padding: "48px 20px 80px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  container: {
    maxWidth: "880px",
    width: "100%",
    margin: "0 auto",
    padding: "0 16px",
  },
  loadingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "80vh",
    gap: "12px",
  },
  loadingGlyph: {
    fontSize: "28px",
    color: "#F2A65A",
    animation: "none",
  },
  loadingText: {
    fontFamily: "'JetBrains Mono', monospace",
    color: "#9092B8",
    fontSize: "13px",
    letterSpacing: "0.5px",
  },
  header: {
    marginBottom: "36px",
    width: "100%",
  },
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    letterSpacing: "2px",
    color: "#F2A65A",
    marginBottom: "10px",
  },
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: "2.6rem",
    color: "#F0F1FA",
    margin: "0 0 8px 0",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    color: "#9092B8",
    fontSize: "15px",
    margin: 0,
  },
  filterRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "24px",
    width: "100%",
  },
  filterPill: {
    fontFamily: "'Inter', sans-serif",
    fontSize: "13px",
    fontWeight: 500,
    padding: "8px 14px",
    borderRadius: "999px",
    border: "1px solid #2C2F5C",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  filterCount: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    opacity: 0.7,
  },
  formCard: {
    background: "#191B3D",
    border: "1px solid #262A57",
    borderRadius: "14px",
    padding: "24px",
    marginBottom: "36px",
    width: "100%",
  },
  formHeader: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "20px",
    paddingBottom: "18px",
    borderBottom: "1px dashed #2C2F5C",
  },
  formSlot: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    background: "#211D45",
    color: "#C6BBFA",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },
  formTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: "16px",
    color: "#F0F1FA",
  },
  formHint: {
    fontSize: "12px",
    color: "#9092B8",
    marginTop: "2px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  fieldLabel: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#6B6E9E",
    textTransform: "uppercase",
    letterSpacing: "0.6px",
  },
  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #2C2F5C",
    background: "#12142E",
    color: "#F0F1FA",
    fontSize: "14px",
    width: "100%",
    fontFamily: "'Inter', sans-serif",
  },
  submitBtn: {
    width: "100%",
    padding: "13px",
    borderRadius: "8px",
    border: "none",
    background: "#F2A65A",
    color: "#2E1B03",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: "15px",
    cursor: "pointer",
  },
  emptyState: {
    textAlign: "center",
    padding: "70px 20px",
    border: "1px dashed #2C2F5C",
    borderRadius: "14px",
    width: "100%",
  },
  emptyGlyph: {
    fontSize: "26px",
    color: "#4A4E86",
    marginBottom: "10px",
  },
  emptyTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: "17px",
    color: "#F0F1FA",
    margin: "0 0 6px 0",
  },
  emptyHint: {
    color: "#9092B8",
    fontSize: "13px",
    margin: 0,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
  },
  card: (spineColor: string) => ({
    display: "grid",
    gridTemplateColumns: "1fr auto",
    alignItems: "center",
    gap: "16px",
    background: "#191B3D",
    border: "1px solid #262A57",
    borderLeft: `4px solid ${spineColor}`,
    borderRadius: "10px",
    padding: "18px 20px",
    clipPath:
      "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)",
  }),
  cardBody: {
    minWidth: 0,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    flexWrap: "wrap",
  },
  cardTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: "17px",
    color: "#F0F1FA",
    margin: "0 0 4px 0",
  },
  cardMeta: {
    fontSize: "13px",
    color: "#9092B8",
  },
  dot: {
    color: "#4A4E86",
  },
  storeBadge: {
    fontSize: "12px",
    padding: "2px 8px",
    borderRadius: "4px",
    background: "#2C2F5C",
    color: "#F0F1FA",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  priorityBadge: {
    fontSize: "11px",
    fontWeight: 600,
    padding: "2px 10px",
    borderRadius: "12px",
    background: "#1A1B3A",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },
  badgeGroup: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  statusTag: (s: StatusMeta) => ({
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "11px",
    fontWeight: 500,
    padding: "4px 10px",
    borderRadius: "999px",
    background: s.bg,
    color: s.text,
    whiteSpace: "nowrap",
  }),
  cardMid: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
    flexWrap: "wrap",
  },
  statPill: {
    fontSize: "12px",
    color: "#9092B8",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  mono: {
    fontFamily: "'JetBrains Mono', monospace",
    color: "#F0F1FA",
  },
  review: {
    margin: "10px 0 0 0",
    fontSize: "13px",
    color: "#B8BAE0",
    fontStyle: "italic",
    lineHeight: 1.5,
  },
  cardControls: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    alignItems: "stretch",
  },
  selectSmall: {
    padding: "7px 10px",
    borderRadius: "7px",
    border: "1px solid #2C2F5C",
    background: "#12142E",
    color: "#F0F1FA",
    fontSize: "12px",
    fontFamily: "'Inter', sans-serif",
  },
  deleteBtn: {
    padding: "7px 10px",
    borderRadius: "7px",
    border: "1px solid #3A2226",
    background: "transparent",
    color: "#F2646B",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
  },
  editBtn: {
    padding: "7px 10px",
    borderRadius: "7px",
    border: "1px solid #2C5C3A",
    background: "transparent",
    color: "#4FD1AE",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
  },
  // Modal styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  },
  modal: {
    background: "#191B3D",
    border: "1px solid #262A57",
    borderRadius: "16px",
    padding: "32px",
    maxWidth: "600px",
    width: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  modalTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    color: "#F0F1FA",
    fontSize: "24px",
    margin: 0,
  },
  modalClose: {
    background: "transparent",
    border: "none",
    color: "#9092B8",
    fontSize: "24px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  modalForm: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  modalGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    marginTop: "8px",
    paddingTop: "16px",
    borderTop: "1px solid #2C2F5C",
  },
  modalCancel: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid #2C2F5C",
    background: "transparent",
    color: "#9092B8",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    fontSize: "14px",
  },
  modalSave: {
    padding: "10px 24px",
    borderRadius: "8px",
    border: "none",
    background: "#F2A65A",
    color: "#2E1B03",
    cursor: "pointer",
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: "14px",
  },
};

export default App;
