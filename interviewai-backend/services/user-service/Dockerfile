FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# Create uploads directory with proper permissions
RUN mkdir -p /app/services/user-service/uploads/avatars && \
    chmod -R 755 /app/services/user-service/uploads

EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
