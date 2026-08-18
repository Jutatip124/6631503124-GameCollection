import { Hono } from "hono";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// ============ Health Check ============
app.get("/api/health", (c) => {
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString() 
  });
});

// ============ GET All Games ============
app.get("/api/games", async (c) => {
  const status = c.req.query("status");
  const genre = c.req.query("genre");
  const platform = c.req.query("platform");
  const store = c.req.query("store");
  const priority = c.req.query("priority");
  const search = c.req.query("q");

  let query = "SELECT * FROM games WHERE 1=1";
  const params: any[] = [];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }

  if (genre) {
    query += " AND genre = ?";
    params.push(genre);
  }

  if (platform) {
    query += " AND platform = ?";
    params.push(platform);
  }

  if (store) {
    query += " AND store = ?";
    params.push(store);
  }

  if (priority) {
    query += " AND priority = ?";
    params.push(priority);
  }

  if (search) {
    query += " AND title LIKE ?";
    params.push(`%${search}%`);
  }

  query += " ORDER BY created_at DESC";

  const result = await c.env.DB
    .prepare(query)
    .bind(...params)
    .all();

  return c.json({
    data: result.results,
  });
});

// ============ GET Game by ID ============
app.get("/api/games/:id", async (c) => {
  const id = c.req.param("id");

  const game = await c.env.DB
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(id)
    .first();

  if (!game) {
    return c.json({ error: "Game not found" }, 404);
  }

  return c.json({ data: game });
});

// ============ POST Create Game ============
app.post("/api/games", async (c) => {
  const body = await c.req.json<{
    title?: string;
    genre?: string;
    platform?: string;
    store?: string;
    status?: string;
    priority?: string;
    rating?: number;
    review?: string;
    image_url?: string;
    played_hours?: number;
    started_at?: string;
    finished_at?: string;
  }>();

  // Validation
  if (!body.title?.trim()) {
    return c.json({ error: "title is required" }, 400);
  }

  if (!body.genre?.trim()) {
    return c.json({ error: "genre is required" }, 400);
  }

  if (!body.platform?.trim()) {
    return c.json({ error: "platform is required" }, 400);
  }

  // Validate status
  const validStatus = ["want_to_play", "playing", "completed", "dropped"];
  const status = body.status || "want_to_play";
  if (!validStatus.includes(status)) {
    return c.json({ 
      error: "status must be: want_to_play, playing, completed, dropped" 
    }, 400);
  }

  // Validate priority
  const validPriority = ["low", "medium", "high"];
  const priority = body.priority || "medium";
  if (!validPriority.includes(priority)) {
    return c.json({ 
      error: "priority must be: low, medium, high" 
    }, 400);
  }

  // Validate rating
  if (body.rating !== undefined && (body.rating < 1 || body.rating > 5)) {
    return c.json({ error: "rating must be between 1 and 5" }, 400);
  }

  // Validate played_hours
  if (body.played_hours !== undefined && body.played_hours < 0) {
    return c.json({ error: "played_hours must be >= 0" }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const game = {
    id,
    title: body.title.trim(),
    genre: body.genre.trim(),
    platform: body.platform.trim(),
    store: body.store?.trim() ?? null,
    status,
    priority,
    rating: body.rating ?? null,
    review: body.review ?? null,
    image_url: body.image_url ?? null,
    played_hours: body.played_hours ?? 0,
    started_at: body.started_at ?? null,
    finished_at: body.finished_at ?? null,
    created_at: now,
    updated_at: now,
  };

  await c.env.DB
    .prepare(`
      INSERT INTO games 
      (id, title, genre, platform, store, status, priority, rating, review, 
       image_url, played_hours, started_at, finished_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      game.id,
      game.title,
      game.genre,
      game.platform,
      game.store,
      game.status,
      game.priority,
      game.rating,
      game.review,
      game.image_url,
      game.played_hours,
      game.started_at,
      game.finished_at,
      game.created_at,
      game.updated_at
    )
    .run();

  return c.json({ data: game }, 201);
});

// ============ PATCH Update Game ============
app.patch("/api/games/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    title?: string;
    genre?: string;
    platform?: string;
    store?: string;
    status?: string;
    priority?: string;
    rating?: number;
    review?: string;
    image_url?: string;
    played_hours?: number;
    started_at?: string;
    finished_at?: string;
  }>();

  // Check if game exists
  const existing = await c.env.DB
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(id)
    .first();

  if (!existing) {
    return c.json({ error: "Game not found" }, 404);
  }

  // Build dynamic update query
  const updates: string[] = [];
  const values: any[] = [];

  if (body.title !== undefined) {
    if (!body.title.trim()) {
      return c.json({ error: "title cannot be empty" }, 400);
    }
    updates.push("title = ?");
    values.push(body.title.trim());
  }

  if (body.genre !== undefined) {
    if (!body.genre.trim()) {
      return c.json({ error: "genre cannot be empty" }, 400);
    }
    updates.push("genre = ?");
    values.push(body.genre.trim());
  }

  if (body.platform !== undefined) {
    if (!body.platform.trim()) {
      return c.json({ error: "platform cannot be empty" }, 400);
    }
    updates.push("platform = ?");
    values.push(body.platform.trim());
  }

  if (body.store !== undefined) {
    updates.push("store = ?");
    values.push(body.store.trim() || null);
  }

  if (body.status !== undefined) {
    const validStatus = ["want_to_play", "playing", "completed", "dropped"];
    if (!validStatus.includes(body.status)) {
      return c.json({ 
        error: "status must be: want_to_play, playing, completed, dropped" 
      }, 400);
    }
    updates.push("status = ?");
    values.push(body.status);
  }

  if (body.priority !== undefined) {
    const validPriority = ["low", "medium", "high"];
    if (!validPriority.includes(body.priority)) {
      return c.json({ 
        error: "priority must be: low, medium, high" 
      }, 400);
    }
    updates.push("priority = ?");
    values.push(body.priority);
  }

  if (body.rating !== undefined) {
    if (body.rating !== null && (body.rating < 1 || body.rating > 5)) {
      return c.json({ error: "rating must be between 1 and 5" }, 400);
    }
    updates.push("rating = ?");
    values.push(body.rating);
  }

  if (body.review !== undefined) {
    updates.push("review = ?");
    values.push(body.review);
  }

  if (body.image_url !== undefined) {
    updates.push("image_url = ?");
    values.push(body.image_url);
  }

  if (body.played_hours !== undefined) {
    if (body.played_hours < 0) {
      return c.json({ error: "played_hours must be >= 0" }, 400);
    }
    updates.push("played_hours = ?");
    values.push(body.played_hours);
  }

  if (body.started_at !== undefined) {
    updates.push("started_at = ?");
    values.push(body.started_at || null);
  }

  if (body.finished_at !== undefined) {
    updates.push("finished_at = ?");
    values.push(body.finished_at || null);
  }

  if (updates.length === 0) {
    return c.json({ error: "No fields to update" }, 400);
  }

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  await c.env.DB
    .prepare(`
      UPDATE games
      SET ${updates.join(", ")}
      WHERE id = ?
    `)
    .bind(...values)
    .run();

  // Get updated game
  const updated = await c.env.DB
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(id)
    .first();

  return c.json({ data: updated });
});

// ============ DELETE Game ============
app.delete("/api/games/:id", async (c) => {
  const id = c.req.param("id");

  const existing = await c.env.DB
    .prepare("SELECT * FROM games WHERE id = ?")
    .bind(id)
    .first();

  if (!existing) {
    return c.json({ error: "Game not found" }, 404);
  }

  await c.env.DB
    .prepare("DELETE FROM games WHERE id = ?")
    .bind(id)
    .run();

  return c.body(null, 204);
});

export default app;
