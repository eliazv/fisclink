#!/bin/bash
# FiscLink - Avvio completo dev (Docker + App + Workers)
# Uso: bash scripts/dev-start.sh
# Ctrl+C per fermare tutto

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}  FiscLink — Dev Environment${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

cleanup() {
  echo ""
  echo -e "${YELLOW}Spegnimento in corso...${NC}"
  kill $NEXT_PID $WORKER_PID 2>/dev/null
  wait $NEXT_PID $WORKER_PID 2>/dev/null
  echo -e "${GREEN}Processi fermati. Docker resta attivo.${NC}"
  echo -e "${CYAN}Per fermare anche Docker: docker compose down${NC}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# 1. Docker
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}[ERRORE] Docker non in esecuzione. Avvialo e riprova.${NC}"
  exit 1
fi

echo -e "${CYAN}[1/4]${NC} Avvio PostgreSQL + Redis..."
docker compose up -d --wait 2>/dev/null || docker compose up -d
sleep 2

# 2. Migrazioni
echo -e "${CYAN}[2/4]${NC} Migrazioni database..."
npx prisma migrate deploy 2>/dev/null || npx prisma migrate dev --name init 2>/dev/null
npx prisma generate 2>/dev/null

# 3. Next.js in background
echo -e "${CYAN}[3/4]${NC} Avvio Next.js..."
npm run dev &
NEXT_PID=$!

# 4. Workers in background
sleep 2
echo -e "${CYAN}[4/4]${NC} Avvio Workers BullMQ..."
npm run worker &
WORKER_PID=$!

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}  Tutto attivo!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "  App:       ${BLUE}http://localhost:3000${NC}"
echo -e "  Dashboard: ${BLUE}http://localhost:3000/dashboard${NC}"
echo -e "  DB Studio: ${CYAN}npm run db:studio${NC}"
echo ""
echo -e "  ${YELLOW}Ctrl+C per fermare app + workers${NC}"
echo ""

wait $NEXT_PID $WORKER_PID
