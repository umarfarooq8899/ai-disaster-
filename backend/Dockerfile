FROM node:20-slim

# Install Python 3 and build tools
RUN apt-get update && apt-get install -y python3 python3-pip python3-venv build-essential

# Create working directory
WORKDIR /app

# Set up a Python virtual environment to avoid PEP 668 (externally-managed-environment) errors
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy package.json and install Node dependencies
COPY package*.json ./
RUN npm install

# Copy Python requirements and install them
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy all the rest of the backend files
COPY . .

# Set environment variables for production and AI scripts
ENV NODE_ENV=production
ENV PYTHON_PATH=python3

# Expose port
EXPOSE 5001

# Command to run the backend
CMD ["node", "index.js"]
