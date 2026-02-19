@echo off
SETLOCAL EnableDelayedExpansion

echo ==========================================
echo  PharmaGuard Environment Setup
echo ==========================================

:: 1. Check if 'venv' exists
IF EXIST "venv" (
    echo [INFO] Virtual environment 'venv' already exists.
) ELSE (
    echo [INFO] Creating virtual environment 'venv'...
    python -m venv venv
    IF %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to create virtual environment. Please ensure 'python' is in your PATH.
        pause
        exit /b 1
    )
    echo [SUCCESS] Virtual environment created.
)

:: 2. Activate venv
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to activate virtual environment.
    pause
    exit /b 1
)

:: 3. Upgrade pip
echo [INFO] Upgrading pip...
python -m pip install --upgrade pip

:: 4. Install dependencies
IF EXIST "requirements.txt" (
    echo [INFO] Installing dependencies from 'requirements.txt'...
    pip install -r requirements.txt
    IF %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies.
        pause
        exit /b 1
    )
    echo [SUCCESS] Dependencies installed!
) ELSE (
    echo [WARNING] 'requirements.txt' not found. Skipping dependency installation.
)

echo.
echo ==========================================
echo  SETUP COMPLETE!
echo ==========================================
echo.
echo Your C: drive is safe! The environment is isolated in the 'venv' folder.
echo To run the app, make sure your venv is active and run:
echo    streamlit run app.py
echo.
pause
