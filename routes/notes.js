const express = require("express");
const { body, validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const { dbGet, dbAll, dbRun } = require("../db");
const verifyToken = require("../middleware/auth");
const requireRole = require("../middleware/roles");
const router = express.Router();
router.get("/admin/all", verifyToken, requireRole("admin"), async function (req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  try {
    const totalRow = await dbGet("SELECT COUNT(*) as total FROM notes", []);
    const total = totalRow.total;
    const notes = await dbAll(
      "SELECT notes.*, users.username, users.email FROM notes JOIN users ON notes.user_id = users.id ORDER BY notes.created_at DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );
    return res.status(200).json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      notes,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong." });
  }
});
router.delete("/admin/:id", verifyToken, requireRole("admin"), async function (req, res) {
  try {
    const note = await dbGet("SELECT * FROM notes WHERE id = ?", [req.params.id]);

    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }
    await dbRun("DELETE FROM notes WHERE id = ?", [note.id]);
    return res.status(200).json({ message: "Note deleted by admin." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

router.get("/", verifyToken, async function (req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const offset = (page - 1) * limit;

  try {
    let countSql = "SELECT COUNT(*) as total FROM notes WHERE user_id = ?";
    let notesSql = "SELECT * FROM notes WHERE user_id = ?";
    const countParams = [req.user.id];
    const notesParams = [req.user.id];
    if (search) {
      countSql += " AND title LIKE ?";
      notesSql += " AND title LIKE ?";
      countParams.push("%" + search + "%");
      notesParams.push("%" + search + "%");
    }
    notesSql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    notesParams.push(limit, offset);
    const totalRow = await dbGet(countSql, countParams);
    const notes = await dbAll(notesSql, notesParams);
    return res.status(200).json({
      page,
      limit,
      total: totalRow.total,
      totalPages: Math.ceil(totalRow.total / limit),
      notes,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong." });
  }
});
router.post(
  "/",
  verifyToken,
  [
    body("title").trim().notEmpty().withMessage("Title is required."),
    body("content").trim().notEmpty().withMessage("Content is required."),
  ],
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content } = req.body;
    const noteId = uuidv4();

    try {
      await dbRun(
        "INSERT INTO notes (id, title, content, user_id) VALUES (?, ?, ?, ?)",
        [noteId, title, content, req.user.id]
      );

      const note = await dbGet("SELECT * FROM notes WHERE id = ?", [noteId]);

      return res.status(201).json({ message: "Note created.", note });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Something went wrong." });
    }
  }
);
router.get("/:id", verifyToken, async function (req, res) {
  try {
    const note = await dbGet("SELECT * FROM notes WHERE id = ?", [req.params.id]);

    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

    if (note.user_id !== req.user.id) {
      return res.status(403).json({ error: "You are not allowed to view this note." });
    }

    return res.status(200).json({ note });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

router.put(
  "/:id",
  verifyToken,
  [
    body("title").optional().trim().notEmpty().withMessage("Title cannot be empty."),
    body("content").optional().trim().notEmpty().withMessage("Content cannot be empty."),
  ],
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const note = await dbGet("SELECT * FROM notes WHERE id = ?", [req.params.id]);

      if (!note) {
        return res.status(404).json({ error: "Note not found." });
      }

      if (note.user_id !== req.user.id) {
        return res.status(403).json({ error: "You are not allowed to edit this note." });
      }

      const newTitle = req.body.title || note.title;
      const newContent = req.body.content || note.content;
      const now = new Date().toISOString();

      await dbRun(
        "UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?",
        [newTitle, newContent, now, note.id]
      );

      const updatedNote = await dbGet("SELECT * FROM notes WHERE id = ?", [note.id]);

      return res.status(200).json({ message: "Note updated.", note: updatedNote });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Something went wrong." });
    }
  }
);

router.delete("/:id", verifyToken, async function (req, res) {
  try {
    const note = await dbGet("SELECT * FROM notes WHERE id = ?", [req.params.id]);

    if (!note) {
      return res.status(404).json({ error: "Note not found." });
    }

    if (note.user_id !== req.user.id) {
      return res.status(403).json({ error: "You are not allowed to delete this note." });
    }

    await dbRun("DELETE FROM notes WHERE id = ?", [note.id]);

    return res.status(200).json({ message: "Note deleted successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

module.exports = router;
