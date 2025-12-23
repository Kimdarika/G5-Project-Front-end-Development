from flask import Flask, render_template, request, redirect, url_for, session, flash
import os

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "notetaker_secret_key_development_only")

# Simple user database (for demo - replace with real database in production)
USERS = {
    "demo@notetaker.com": "demo123",
    "test@user.com": "password123"
}

@app.route("/")
def index():
    return redirect(url_for("login"))

@app.route("/login", methods=["GET", "POST"])
def login():
    error = None
    
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "").strip()
        
        # Check credentials (demo version)
        if email in USERS and USERS[email] == password:
            session["user"] = email
            session["user_name"] = email.split('@')[0].capitalize()
            flash("Login successful!", "success")
            return redirect(url_for("home"))
        elif email and password:
            error = "Invalid email or password. Please try again."
        else:
            error = "Please fill in all fields."
    
    return render_template("login.html", error=error)

@app.route("/home")
def home():
    if "user" not in session:
        flash("Please log in to access this page.", "warning")
        return redirect(url_for("login"))
    
    return render_template("home.html", 
                          user=session.get("user"), 
                          user_name=session.get("user_name"))

@app.route("/logout")
def logout():
    session.clear()
    flash("You have been logged out successfully.", "info")
    return redirect(url_for("login"))

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)