from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from .usermodels import User


auth_bp = Blueprint('auth', __name__)

login_manager = LoginManager()
login_manager.login_view = 'auth.login'

@login_manager.user_loader
def load_user(user_id):
    return User.get(user_id)

@auth_bp.route('/api/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        connection = User.get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute('SELECT id, email, password_hash FROM user WHERE email = %s', (email,))
        user_data = cursor.fetchone()
        connection.close()

        if user_data:
            user = User(user_data['id'], user_data['email'], user_data['password_hash'])
            if user.check_password(password):
                login_user(user)
                return redirect(url_for('main.dashboard'))
            else:
                flash('Invalid login credentials.')
        else:
            flash('User not found.')

    return render_template('login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('auth.login'))

@auth_bp.route('/dashboard')
@login_required
def dashboard():
    return 'Welcome to your dashboard!'
