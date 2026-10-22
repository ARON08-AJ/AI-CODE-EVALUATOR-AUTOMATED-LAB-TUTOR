#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "       AutoLab AI Programming Lab Platform"
echo "=========================================================="
echo ""

if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js (v18 or v20 LTS)."
    exit 1
fi

if [ ! -f "server/.env" ]; then
    echo "Creating server/.env from template..."
    cp server/.env.example server/.env
fi

if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "Installing server dependencies..."
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client && npm install && cd ..
fi

if [ ! -f "server/prisma/dev.db" ]; then
    echo "Initializing database..."
    cd server
    npx prisma db push
    npx prisma db seed
    cd ..
else
    cd server
    npx prisma generate
    cd ..
fi

echo ""
echo "=========================================================="
echo "All ready! Starting AutoLab..."
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3000"
echo "=========================================================="
echo ""

npm run dev
