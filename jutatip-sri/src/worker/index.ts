import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/hello", (c) => {
  return c.json({
    message: "Hello Platform Development",
  });
});

// 1. Health Check
app.get("/api/health", (c) => c.json({ status: "ok" }));

// 2. GET All Tasks
app.get("/api/tasks", async (c) => {
  const result = await c.env.DB.prepare(
    "SELECT * FROM tasks ORDER BY created_at DESC"
  ).all();
  return c.json({ data: result.results });
});

// 3. GET Task by ID
app.get("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const task = await c.env.DB.prepare("SELECT * FROM tasks WHERE id = ?").bind(id).first();
  if (!task) return c.json({ error: "Task not found" }, 404);
  return c.json({ data: task });
});

// 4. POST Create Task
app.post("/api/tasks", async (c) => {
  const body = await c.req.json<{ title?: string; description?: string }>();
  if (!body.title?.trim()) return c.json({ error: "title is required" }, 400);

  const task = {
    id: crypto.randomUUID(),
    title: body.title.trim(),
    description: body.description ?? null,
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await c.env.DB.prepare(
    "INSERT INTO tasks (id, title, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(task.id, task.title, task.description, task.status, task.created_at, task.updated_at).run();

  return c.json({ data: task }, 201);
});

// 5. PATCH Update Task
app.patch("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ title?: string; description?: string; status?: string }>();

  const existing = await c.env.DB.prepare("SELECT * FROM tasks WHERE id = ?").bind(id).first();
  if (!existing) return c.json({ error: "Task not found" }, 404);

  if (body.status && !["pending", "doing", "done"].includes(body.status)) {
    return c.json({ error: "Invalid status value" }, 400);
  }

  const updatedTitle = body.title?.trim() ?? existing.title;
  const updatedDesc = body.description !== undefined ? body.description : existing.description;
  const updatedStatus = body.status ?? existing.status;
  const now = new Date().toISOString();

  await c.env.DB.prepare(
    "UPDATE tasks SET title = ?, description = ?, status = ?, updated_at = ? WHERE id = ?"
  ).bind(updatedTitle, updatedDesc, updatedStatus, now, id).run();

  return c.json({ data: { ...existing, title: updatedTitle, description: updatedDesc, status: updatedStatus, updated_at: now } });
});

// 6. DELETE Task
app.delete("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await c.env.DB.prepare("SELECT * FROM tasks WHERE id = ?").bind(id).first();
  if (!existing) return c.json({ error: "Task not found" }, 404);

  await c.env.DB.prepare("DELETE FROM tasks WHERE id = ?").bind(id).run();
  return c.body(null, 204);
});

app.get("/api/tasks", async (c) => {
  const result = await c.env.DB
    .prepare(`
      SELECT
        id,
        title,
        description,
        status,
        created_at,
        updated_at
      FROM tasks
      ORDER BY created_at DESC
    `)
    .all();

  return c.json({
    data: result.results,
  });
});

app.post("/api/tasks", async (c) => {
  const body = await c.req.json<{
    title?: string;
    description?: string;
  }>();

  // ตรวจสอบว่า title มีค่า
  if (!body.title?.trim()) {
    return c.json(
      {
        error: "title is required",
      },
      400
    );
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const task = {
    id,
    title: body.title.trim(),
    description: body.description ?? null,
    status: "pending",
    created_at: now,
    updated_at: now,
  };

  await c.env.DB
    .prepare(`
      INSERT INTO tasks
      (id, title, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .bind(
      task.id,
      task.title,
      task.description,
      task.status,
      task.created_at,
      task.updated_at
    )
    .run();

  return c.json(
    {
      data: task,
    },
    201
  );
});

app.get("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");

  const task = await c.env.DB
    .prepare(`
      SELECT *
      FROM tasks
      WHERE id = ?
    `)
    .bind(id)
    .first();

  if (!task) {
    return c.json(
      {
        error: "Task not found",
      },
      404
    );
  }

  return c.json({
    data: task,
  });
});

app.patch("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    title?: string;
    description?: string;
    status?: string;
  }>();

  // ตรวจสอบว่า task มีอยู่จริง
  const existing = await c.env.DB
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .bind(id)
    .first();

  if (!existing) {
    return c.json(
      {
        error: "Task not found",
      },
      404
    );
  }

  // ตรวจสอบ status ถ้ามี
  if (body.status && !["pending", "doing", "done"].includes(body.status)) {
    return c.json(
      {
        error: "status must be pending, doing, or done",
      },
      400
    );
  }

  // สร้างคำสั่ง UPDATE แบบ动态
  const updates: string[] = [];
  const values: any[] = [];

  if (body.title !== undefined) {
    updates.push("title = ?");
    values.push(body.title);
  }

  if (body.description !== undefined) {
    updates.push("description = ?");
    values.push(body.description);
  }

  if (body.status !== undefined) {
    updates.push("status = ?");
    values.push(body.status);
  }

  if (updates.length === 0) {
    return c.json(
      {
        error: "No fields to update",
      },
      400
    );
  }

  updates.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(id);

  await c.env.DB
    .prepare(`
      UPDATE tasks
      SET ${updates.join(", ")}
      WHERE id = ?
    `)
    .bind(...values)
    .run();

  // ดึงข้อมูลที่อัพเดทแล้ว
  const updated = await c.env.DB
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .bind(id)
    .first();

  return c.json({
    data: updated,
  });
});

app.delete("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");

  // ตรวจสอบว่า task มีอยู่จริง
  const existing = await c.env.DB
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .bind(id)
    .first();

  if (!existing) {
    return c.json(
      {
        error: "Task not found",
      },
      404
    );
  }

  await c.env.DB
    .prepare("DELETE FROM tasks WHERE id = ?")
    .bind(id)
    .run();

  return c.body(null, 204);
});

export default app;