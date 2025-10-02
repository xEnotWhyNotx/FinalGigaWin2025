# 1. Use an official Python runtime as a parent image
FROM python:3.9-slim

# 2. Set the working directory in the container
WORKDIR /app

# 3. Copy the requirements file into the container at /app
COPY requirements.txt .

# 4. Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 4.1. Create data directory for databases
RUN mkdir -p /app/data

# 5. Copy the rest of the application's code
COPY app.py .
COPY alert_controller.py .
COPY consumption_loader.py .
COPY user_auth.py .
COPY alert_integration.py .
COPY telegram_bot.py .
COPY telegram_commands.py .
COPY data/ ./data/

# 6. Make port 5001 available to the world outside this container
EXPOSE 5001

# 7. Define environment variables
ENV PYTHONUNBUFFERED 1

# 8. Run app.py when the container launches
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "app:app"]
