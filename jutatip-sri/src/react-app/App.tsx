import { useState, useEffect } from "react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "doing" | "done";
  created_at: string;
  updated_at: string;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [loading, setLoading] = useState(true);

  // โหลด tasks
  const loadTasks = async () => {
    try {
      const response = await fetch("/api/tasks");
      const result = await response.json();
      setTasks(result.data);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  // สร้าง task
  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title: newTitle,
          description: newDescription || undefined 
        }),
      });

      if (response.ok) {
        setNewTitle("");
        setNewDescription("");
        await loadTasks();
      }
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  // อัพเดทสถานะ
  const updateStatus = async (id: string, status: Task["status"]) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await loadTasks();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // ลบ task
  const deleteTask = async (id: string) => {
    if (!confirm("คุณแน่ใจที่จะลบ?")) return;

    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      await loadTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // แสดงสถานะเป็นภาษาไทย
  const getStatusThai = (status: string) => {
    const map: Record<string, string> = {
      pending: "รอดำเนินการ",
      doing: "กำลังทำ",
      done: "เสร็จแล้ว"
    };
    return map[status] || status;
  };

  // สีของสถานะ
  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: "#ffcc80",
      doing: "#81d4fa",
      done: "#a5d6a7"
    };
    return map[status] || "#ddd";
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh" 
      }}>
        <h2>⏳ กำลังโหลด...</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: "900px", 
      margin: "0 auto", 
      padding: "20px",
      fontFamily: "Arial, sans-serif"
    }}>
      <h1 style={{ 
        fontSize: "2.5rem", 
        color: "#1a1a2e",
        borderBottom: "3px solid #e94560",
        paddingBottom: "10px"
      }}>
        📋 TaskFlow
      </h1>

      {/* ฟอร์มสร้าง task */}
      <form 
        onSubmit={createTask} 
        style={{ 
          backgroundColor: "#f5f5f5",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "30px"
        }}
      >
        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="ใส่ชื่องาน..."
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "16px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="รายละเอียด (ไม่บังคับ)"
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          />
        </div>
        <button 
          type="submit" 
          style={{
            backgroundColor: "#e94560",
            color: "white",
            border: "none",
            padding: "10px 20px",
            fontSize: "16px",
            borderRadius: "4px",
            cursor: "pointer",
            width: "100%",
          }}
        >
          ➕ เพิ่มงาน
        </button>
      </form>

      {/* สถิติ */}
      <div style={{
        display: "flex",
        gap: "10px",
        marginBottom: "20px",
        flexWrap: "wrap"
      }}>
        <span style={{ 
          backgroundColor: "#e8e8e8", 
          padding: "5px 15px", 
          borderRadius: "20px" 
        }}>
          ทั้งหมด: {tasks.length}
        </span>
        <span style={{ 
          backgroundColor: "#ffcc80", 
          padding: "5px 15px", 
          borderRadius: "20px" 
        }}>
          รอดำเนินการ: {tasks.filter(t => t.status === "pending").length}
        </span>
        <span style={{ 
          backgroundColor: "#81d4fa", 
          padding: "5px 15px", 
          borderRadius: "20px" 
        }}>
          กำลังทำ: {tasks.filter(t => t.status === "doing").length}
        </span>
        <span style={{ 
          backgroundColor: "#a5d6a7", 
          padding: "5px 15px", 
          borderRadius: "20px" 
        }}>
          เสร็จแล้ว: {tasks.filter(t => t.status === "done").length}
        </span>
      </div>

      {/* รายการ tasks */}
      {tasks.length === 0 ? (
        <p style={{ textAlign: "center", color: "#666" }}>
          ยังไม่มีงาน สร้างงานด้านบนเลย!
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {tasks.map((task) => (
            <li
              key={task.id}
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                marginBottom: "10px",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: task.status === "done" ? "#f0f8f0" : "white",
                transition: "all 0.3s",
              }}
            >
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 4px 0" }}>
                  {task.title}
                  {task.status === "done" && " ✅"}
                </h3>
                {task.description && (
                  <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                    {task.description}
                  </p>
                )}
                <span
                  style={{
                    fontSize: "12px",
                    padding: "3px 12px",
                    borderRadius: "12px",
                    backgroundColor: getStatusColor(task.status),
                    display: "inline-block",
                    marginTop: "5px",
                  }}
                >
                  {getStatusThai(task.status)}
                </span>
                <span style={{
                  fontSize: "11px",
                  color: "#999",
                  marginLeft: "10px",
                }}>
                  สร้าง: {new Date(task.created_at).toLocaleString('th-TH')}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <select
                  value={task.status}
                  onChange={(e) =>
                    updateStatus(task.id, e.target.value as Task["status"])
                  }
                  style={{
                    padding: "6px",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                  }}
                >
                  <option value="pending">รอดำเนินการ</option>
                  <option value="doing">กำลังทำ</option>
                  <option value="done">เสร็จแล้ว</option>
                </select>
                <button
                  onClick={() => deleteTask(task.id)}
                  style={{
                    backgroundColor: "#ff5252",
                    color: "white",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;