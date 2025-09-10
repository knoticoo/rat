#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="rats-food-guide"
APP_PORT=3500
APP_DIR="/workspace"
PID_FILE="/tmp/${APP_NAME}.pid"
LOG_FILE="/tmp/${APP_NAME}.log"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Node.js is installed
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    print_status "Node.js version: $NODE_VERSION"
}

# Function to check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    NPM_VERSION=$(npm --version)
    print_status "npm version: $NPM_VERSION"
}

# Function to stop the service
stop_service() {
    print_status "Checking for running service..."
    
    # First, try to stop by PID file
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            print_status "Stopping service (PID: $PID)..."
            kill $PID
            sleep 2
            
            # Force kill if still running
            if ps -p $PID > /dev/null 2>&1; then
                print_warning "Service still running, force killing..."
                kill -9 $PID
            fi
            
            print_success "Service stopped successfully"
        else
            print_warning "PID file exists but process is not running"
        fi
        rm -f "$PID_FILE"
    fi
    
    # Check for processes using the port using fuser or netstat
    PORT_PID=""
    
    # Try fuser first
    if command -v fuser &> /dev/null; then
        PORT_PID=$(fuser $APP_PORT/tcp 2>/dev/null)
    # Try netstat if fuser not available
    elif command -v netstat &> /dev/null; then
        PORT_PID=$(netstat -tlnp 2>/dev/null | grep ":$APP_PORT " | awk '{print $7}' | cut -d'/' -f1)
    # Try ss if netstat not available
    elif command -v ss &> /dev/null; then
        PORT_PID=$(ss -tlnp 2>/dev/null | grep ":$APP_PORT " | awk '{print $6}' | cut -d',' -f2 | cut -d'=' -f2)
    # Fallback: check all node processes
    else
        PORT_PID=$(ps aux | grep "node.*server.js" | grep -v grep | awk '{print $2}')
    fi
    
    if [ ! -z "$PORT_PID" ]; then
        print_status "Found process using port $APP_PORT (PID: $PORT_PID), stopping..."
        kill $PORT_PID 2>/dev/null
        sleep 2
        
        # Check if still running and force kill
        if ps -p $PORT_PID > /dev/null 2>&1; then
            print_warning "Process still running, force killing..."
            kill -9 $PORT_PID 2>/dev/null
            sleep 1
        fi
        
        print_success "Process on port $APP_PORT stopped"
    else
        print_status "No service currently running on port $APP_PORT"
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ ! -f "$APP_DIR/package.json" ]; then
        print_error "package.json not found in $APP_DIR"
        exit 1
    fi
    
    cd "$APP_DIR"
    npm install --production
    
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
}

# Function to start the service
start_service() {
    print_status "Starting service on port $APP_PORT..."
    
    cd "$APP_DIR"
    
    # Start service with nohup for SSH disconnection persistence
    nohup node server.js > "$LOG_FILE" 2>&1 &
    PID=$!
    
    # Save PID
    echo $PID > "$PID_FILE"
    
    # Wait a moment and check if service started successfully
    sleep 3
    
    if ps -p $PID > /dev/null 2>&1; then
        print_success "Service started successfully (PID: $PID)"
        print_status "Service is running on http://localhost:$APP_PORT"
        print_status "Logs are being written to: $LOG_FILE"
        print_status "PID file: $PID_FILE"
        
        # Test if service is responding
        if curl -s -f http://localhost:$APP_PORT > /dev/null 2>&1; then
            print_success "Service is responding to HTTP requests"
        else
            print_warning "Service started but not responding to HTTP requests yet"
        fi
    else
        print_error "Failed to start service"
        print_error "Check logs: $LOG_FILE"
        exit 1
    fi
}

# Function to show service status
show_status() {
    print_status "Service Status:"
    echo "================"
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            print_success "Service is running (PID: $PID)"
            print_status "Port: $APP_PORT"
            print_status "Log file: $LOG_FILE"
            print_status "URL: http://localhost:$APP_PORT"
        else
            print_warning "PID file exists but service is not running"
        fi
    else
        PORT_PID=$(lsof -ti:$APP_PORT 2>/dev/null)
        if [ ! -z "$PORT_PID" ]; then
            print_warning "Something is running on port $APP_PORT (PID: $PORT_PID) but no PID file found"
        else
            print_status "Service is not running"
        fi
    fi
}

# Function to show logs
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        print_status "Showing last 50 lines of logs:"
        echo "================================"
        tail -50 "$LOG_FILE"
    else
        print_warning "No log file found at $LOG_FILE"
    fi
}

# Function to restart service
restart_service() {
    print_status "Restarting service..."
    stop_service
    sleep 2
    start_service
}

# Main script logic
main() {
    print_status "🐀 Rats Food Guide Deployment Script"
    print_status "====================================="
    
    # Check prerequisites
    check_nodejs
    check_npm
    
    # Parse command line arguments
    case "${1:-deploy}" in
        "start")
            start_service
            ;;
        "stop")
            stop_service
            ;;
        "restart")
            restart_service
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs
            ;;
        "deploy"|"")
            print_status "Full deployment (stop + install + start)"
            stop_service
            install_dependencies
            start_service
            ;;
        *)
            echo "Usage: $0 {deploy|start|stop|restart|status|logs}"
            echo ""
            echo "Commands:"
            echo "  deploy  - Stop service, install dependencies, and start (default)"
            echo "  start   - Start the service"
            echo "  stop    - Stop the service"
            echo "  restart - Restart the service"
            echo "  status  - Show service status"
            echo "  logs    - Show service logs"
            exit 1
            ;;
    esac
    
    print_success "Script completed successfully!"
}

# Run main function
main "$@"