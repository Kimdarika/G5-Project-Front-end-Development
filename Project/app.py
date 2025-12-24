from flask import Flask, render_template, request, jsonify
from datetime import datetime
import json

app = Flask(__name__)
app.secret_key = "notetaker_secret_key"

# In-memory storage for notes
NOTES = []
TRASH = []

@app.route("/")
def home():
    return render_template("home.html")

@app.route("/get_notes")
def get_notes():
    return jsonify({
        "notes": NOTES,
        "trash": TRASH
    })

@app.route("/add_note", methods=["POST"])
def add_note():
    data = request.json
    
    note = {
        "id": len(NOTES) + 1,
        "title": data.get("title", "Untitled"),
        "content": data.get("content", ""),
        "category": data.get("category", "personal"),
        "tags": data.get("tags", []),
        "pinned": data.get("pinned", False),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    NOTES.append(note)
    return jsonify({"success": True, "note": note})

@app.route("/update_note/<int:note_id>", methods=["PUT"])
def update_note(note_id):
    data = request.json
    
    for note in NOTES:
        if note["id"] == note_id:
            note["title"] = data.get("title", note["title"])
            note["content"] = data.get("content", note["content"])
            note["category"] = data.get("category", note["category"])
            note["tags"] = data.get("tags", note["tags"])
            note["pinned"] = data.get("pinned", note["pinned"])
            note["updated_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            return jsonify({"success": True, "note": note})
    
    return jsonify({"error": "Note not found"}), 404

@app.route("/delete_note/<int:note_id>", methods=["DELETE"])
def delete_note(note_id):
    for i, note in enumerate(NOTES):
        if note["id"] == note_id:
            deleted_note = NOTES.pop(i)
            deleted_note["deleted_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            TRASH.append(deleted_note)
            return jsonify({"success": True})
    
    return jsonify({"error": "Note not found"}), 404

@app.route("/restore_note/<int:note_id>", methods=["POST"])
def restore_note(note_id):
    for i, note in enumerate(TRASH):
        if note["id"] == note_id:
            restored_note = TRASH.pop(i)
            restored_note.pop("deleted_at", None)
            NOTES.append(restored_note)
            return jsonify({"success": True})
    
    return jsonify({"error": "Note not found in trash"}), 404

@app.route("/permanent_delete/<int:note_id>", methods=["DELETE"])
def permanent_delete(note_id):
    for i, note in enumerate(TRASH):
        if note["id"] == note_id:
            TRASH.pop(i)
            return jsonify({"success": True})
    
    return jsonify({"error": "Note not found"}), 404

if __name__ == "__main__":
    app.run(debug=True)