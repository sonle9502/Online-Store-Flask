from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

SQLAlchemy_db = SQLAlchemy()

class Todo(SQLAlchemy_db.Model):
    id = SQLAlchemy_db.Column(SQLAlchemy_db.Integer, primary_key=True)
    content = SQLAlchemy_db.Column(SQLAlchemy_db.String(200), nullable=False)
    completed = SQLAlchemy_db.Column(SQLAlchemy_db.Boolean, default=False)
    description = SQLAlchemy_db.Column(SQLAlchemy_db.Text, nullable=True)
    due_date = SQLAlchemy_db.Column(SQLAlchemy_db.DateTime, nullable=True)  # 期限を追加
    email_sent = SQLAlchemy_db.Column(SQLAlchemy_db.Boolean, default=False) #メールを送信されたかどうかを判断
    images = SQLAlchemy_db.relationship('Image', backref='todo', lazy=True)
    created_at = SQLAlchemy_db.Column(SQLAlchemy_db.DateTime, default=datetime.utcnow)
    comments = SQLAlchemy_db.relationship('Comment', backref='todo', lazy=True)

    def to_dict(self):
        return {
                'id': self.id,
                'content': self.content,
                'completed': self.completed,
                'description': self.description,
                'due_date': self.due_date.isoformat() if self.due_date else None,
                'email_sent': self.email_sent,
                'images': [{'id': image.id, 'filename': image.filename} for image in self.images],
                'created_at': self.format_date(self.created_at),
                'due_date': self.format_date(self.due_date),
                'images': [{'id': image.id, 'filename': image.filename} for image in self.images],
                'comments': [{'id': comment.id, 'text': comment.content} for comment in self.comments]
            }
        
    def format_date(self, date):
        """Format date as Japanese-style date string."""
        if not date:
            return None
        return date.strftime('%Y年%m月%d日 %H時%M分')
    
class Image(SQLAlchemy_db.Model):
    id = SQLAlchemy_db.Column(SQLAlchemy_db.Integer, primary_key=True)
    filename = SQLAlchemy_db.Column(SQLAlchemy_db.String(300), nullable=False)
    todo_id = SQLAlchemy_db.Column(SQLAlchemy_db.Integer, SQLAlchemy_db.ForeignKey('todo.id'), nullable=False)
    data = SQLAlchemy_db.Column(SQLAlchemy_db.LargeBinary, nullable=False)  # 画像データを保存するカラム

    def __repr__(self):
        return f'<Image {self.id}>'
    
class Comment(SQLAlchemy_db.Model):
    id = SQLAlchemy_db.Column(SQLAlchemy_db.Integer, primary_key=True)
    content = SQLAlchemy_db.Column(SQLAlchemy_db.String(500), nullable=False)
    created_at = SQLAlchemy_db.Column(SQLAlchemy_db.DateTime, default=datetime.utcnow)
    todo_id = SQLAlchemy_db.Column(SQLAlchemy_db.Integer, SQLAlchemy_db.ForeignKey('todo.id'), nullable=False)
    
    def __repr__(self):
        return f'<Comment {self.id}>'
    