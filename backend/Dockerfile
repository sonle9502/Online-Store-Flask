# Use a Python image
FROM python:3.11

# Set working directory
WORKDIR /app

# Install system dependencies
# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    build-essential \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# 'modelsAI' ディレクトリをコンテナ内にコピー
COPY modelsAI /app/modelsAI

# Set environment variabless
ENV FLASK_ENV=development

# Run database migrations
RUN flask db upgrade

# Expose port
EXPOSE 5000

# Start the application
CMD ["flask", "run", "--host=0.0.0.0"]
