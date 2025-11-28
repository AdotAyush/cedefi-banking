@echo off
start "Bank A" cmd /k "set PORT=3001 && set BANK_ID=BankA && set BANK_PRIVATE_KEY=0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef && npm start"
start "Bank B" cmd /k "set PORT=3002 && set BANK_ID=BankB && set BANK_PRIVATE_KEY=0x1123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef && npm start"
start "Bank C" cmd /k "set PORT=3003 && set BANK_ID=BankC && set BANK_PRIVATE_KEY=0x2123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef && npm start"
echo Started Bank A (3001), Bank B (3002), Bank C (3003)
