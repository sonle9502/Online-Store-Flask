# Backend
FROM python:3.11

# Set working directory
WORKDIR /app

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
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Upgrade pip
RUN pip install --upgrade pip

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# 'modelsAI' directory
COPY modelsAI /app/modelsAI

# Set environment variables
ENV FLASK_ENV=development

# Expose port
EXPOSE 5000

# Start the application
CMD ["flask", "run", "--host=0.0.0.0"]
