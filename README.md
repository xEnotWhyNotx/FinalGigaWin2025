# GigaWin2025
Second hackathon (LCT) 2025

## How to run the project

This project runs a standalone backend service using Docker and Docker Compose.

### Prerequisites

*   Docker
*   Docker Compose

### Running the application

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd GigaWin2025
    ```

2.  **Build and start the service:**
    Run the following command in the root directory of the project:
    ```bash
    docker-compose up --build -d
    ```
    This command will build the Docker image for the backend service and start the container in the background.

3.  **Access the application:**
    The backend API will be available at `http://localhost:5001`.

### API Endpoints

*   `GET` [http://localhost:5001/alerts](http://localhost:5001/alerts): Retrieves a list of alerts.
*   `POST` [http://localhost:5001/ml_predict](http://localhost:5001/ml_predict): Accepts data for machine learning prediction.
*   `GET` [http://localhost:5001/ctp_data](http://localhost:5001/ctp_data): Retrieves CTP data.
*   `GET` [http://localhost:5001/mcd_data](http://localhost:5001/mcd_data): Retrieves MCD data.
*   `POST` [http://localhost:5001/add_incedent](http://localhost:5001/add_incedent): Adds a new incident.

### Telegram Bot

The project includes a Telegram bot for real-time alerts and system monitoring. See [TELEGRAM_BOT_README.md](TELEGRAM_BOT_README.md) for detailed setup and usage instructions.

**Quick Start:**
1. Create a bot with [@BotFather](https://t.me/botfather)
2. Copy `configs/telegram_config.example.json` to `configs/telegram_config.json`
3. Add your bot token to the config file
4. Run: `cd backend && python run_telegram_bot.py`

### Stopping the application

To stop the service, run:
```