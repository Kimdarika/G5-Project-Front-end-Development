from flask import Flask, render_template, request, redirect, url_for, session, flash
import os
import json

app = Flask(__name__, static_folder='static')
app.secret_key = "notetaker_secret_key" 

users = {
    "demo@notetaker.com": {"password": "demo123", "name": "Demo User", "id": "demo-1"},
    "test@user.com": {"password": "password123", "name": "Test User", "id": "test-1"}
}

@app.route("/")
def index():
    return redirect(url_for("login"))

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form.get("email", "").lower()
        password = request.form.get("password", "")
        
        if email in users and users[email]["password"] == password:
            session["user"] = email
            session["name"] = users[email]["name"]
            flash("Login successful!", "success")
            return redirect(url_for("home"))
        else:
            flash("Invalid email or password", "error")
    return render_template("login.html")

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        email = request.form.get("email", "").lower()
        name = request.form.get("name", "")
        password = request.form.get("password", "")
        
        if email in users:
            flash("Email already registered", "error")
        elif len(password) < 6:
            flash("Password must be at least 6 characters", "error")
        else:
            user_id = f"user-{len(users)+1}"
            users[email] = {"password": password, "name": name, "id": user_id}
            session["user"] = email
            session["name"] = name
            flash("Registration successful!", "success")
            return redirect(url_for("home"))
    
    return render_template("register.html")

@app.route("/home")
def home():
    if "user" not in session:
        flash("Please log in first", "warning")
        return redirect(url_for("login"))
    
    return render_template("home.html", 
                          user_email=session.get("user"),
                          user_name=session.get("name", "Guest"))

@app.route("/logout")
def logout():
    session.clear()
    flash("Logged out successfully", "info")
    return redirect(url_for("login"))

@app.route("/demo")
def demo():
    session["user"] = "demo@notetaker.com"
    session["name"] = "Demo User"
    return redirect(url_for("home"))

@app.route('/dashboard')
def dashboard():  # Changed from comparison()
    return render_template("dashboard.html")

@app.route('/Index')
def Index():  # Changed from comparison()
    return render_template("Index.html")

@app.route('/Team')
def Team():  # Changed from comparison() and use different name than index()
    return render_template("Team.html")

if __name__ == "__main__":
    print("=" * 50)
    print("🚀 NoteTaker App Running!")
    print("=" * 50)
    print("URLs:")
    print("1. Login: http://localhost:5000/login")
    print("2. Register: http://localhost:5000/register")
    print("3. Home: http://localhost:5000/home")
    print("4. Demo: http://localhost:5000/demo")
    print("5. Dashboard: http://localhost:5000/dashboard")
    print("6. Notebook: http://localhost:5000/Notebook")
    print("7. Index: http://localhost:5000/Index")
    print("8. Logout: http://localhost:5000/logout")
    print("\nDemo Account:")
    print("Email: demo@notetaker.com")
    print("Password: demo123")
    print("=" * 50)
    app.run(debug=True, host="0.0.0.0", port=5000)
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
