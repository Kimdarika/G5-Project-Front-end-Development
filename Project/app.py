from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
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
if __name__ == "__main__":
    print("=" * 50)
    print("🚀 NoteTaker App Running!")
    print("=" * 50)
    print("URLs:")
    print("1. Login: http://localhost:5000/login")
    print("2. Register: http://localhost:5000/register")
    print("3. Home: http://localhost:5000/home")
    print("4. Demo: http://localhost:5000/demo")
    print("5. Logout: http://localhost:5000/logout")
    print("\nDemo Account:")
    print("Email: demo@notetaker.com")
    print("Password: demo123")
    print("=" * 50)
    app.run(debug=True, host="0.0.0.0", port=5000)