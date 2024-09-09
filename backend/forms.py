from flask_wtf import FlaskForm
from wtforms import TextAreaField, SubmitField
from wtforms.validators import DataRequired

class CommentForm(FlaskForm):
    content = TextAreaField('Comment', validators=[DataRequired()])
    description = TextAreaField('Description')
    submit = SubmitField('Add Comment')

