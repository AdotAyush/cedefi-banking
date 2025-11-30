# Bank Admin Access Guide

## Overview

The CeDeFi Voting System runs three independent bank microservices that participate in the consensus voting mechanism. Each bank instance provides REST API endpoints for transaction approval/rejection.

## Bank Instances

### Bank A
- **Port**: 3001
- **Base URL**: http://localhost:3001
- **Bank ID**: Bank-A
- **Status**: Running (when system is started)

### Bank B
- **Port**: 3002
- **Base URL**: http://localhost:3002
- **Bank ID**: Bank-B
- **Status**: Running (when system is started)

### Bank C
- **Port**: 3003
- **Base URL**: http://localhost:3003
- **Bank ID**: Bank-C
- **Status**: Running (when system is started)

## API Endpoints

Each bank instance exposes the following REST API endpoints:

### 1. Get Bank Information
```bash
GET /bank/info
```

**Example**:
```bash
curl http://localhost:3001/bank/info
```

**Response**:
```json
{
  "bankId": "Bank-A",
  "status": "active",
  "port": 3001
}
```

---

### 2. Approve Transaction
```bash
POST /bank/approve
Content-Type: application/json
```

**Request Body**:
```json
{
  "transactionId": "TX-12345"
}
```

**Example**:
```bash
curl -X POST http://localhost:3001/bank/approve \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "TX-12345"}'
```

**Response**:
```json
{
  "success": true,
  "bankId": "Bank-A",
  "transactionId": "TX-12345",
  "decision": "approved"
}
```

---

### 3. Reject Transaction
```bash
POST /bank/reject
Content-Type: application/json
```

**Request Body**:
```json
{
  "transactionId": "TX-12345"
}
```

**Example**:
```bash
curl -X POST http://localhost:3002/bank/reject \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "TX-12345"}'
```

**Response**:
```json
{
  "success": true,
  "bankId": "Bank-B",
  "transactionId": "TX-12345",
  "decision": "rejected"
}
```

---

### 4. Health Check
```bash
GET /bank/health
```

**Example**:
```bash
curl http://localhost:3003/bank/health
```

**Response**:
```json
{
  "status": "healthy",
  "bankId": "Bank-C",
  "uptime": "2h 30m"
}
```

## Admin Credentials

### Frontend Dashboard Access

**Default Admin User**:
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Administrator
- **Access**: Full system access

> [!IMPORTANT]
> These are **demo credentials** stored in localStorage. In production, you should:
> 1. Implement proper backend authentication
> 2. Use secure password hashing (bcrypt)
> 3. Implement JWT or session-based auth
> 4. Add role-based access control (RBAC)

### Creating Additional Users

1. Navigate to http://localhost:5173/register
2. Fill in the registration form
3. Use the new credentials to login

## Starting Bank Services

### Using Master Script (Recommended)
```bash
./start-all.sh
```
This starts all services including the 3 bank instances.

### Manual Start (Individual Banks)
```bash
cd bank-service

# Start Bank A
PORT=3001 BANK_ID=Bank-A node server.js &

# Start Bank B
PORT=3002 BANK_ID=Bank-B node server.js &

# Start Bank C
PORT=3003 BANK_ID=Bank-C node server.js &
```

### Using Bank Script
```bash
cd bank-service
./start-banks.sh
```

## Stopping Bank Services

```bash
./stop-all.sh
```

Or manually:
```bash
# Find and kill bank processes
lsof -ti:3001,3002,3003 | xargs kill -9
```

## Testing Bank Connectivity

Test all banks at once:
```bash
for port in 3001 3002 3003; do
  echo "Testing Bank on port $port..."
  curl -s http://localhost:$port/bank/info | python3 -m json.tool
  echo ""
done
```

## Workflow Example

### 1. Create a Transaction (via Frontend)
- Go to Simulator page
- Fill in transaction details
- Click "Create"
- Note the transaction ID

### 2. Banks Auto-Respond
The backend automatically requests approval from all banks when a transaction is created.

### 3. Manual Bank Voting (via API)
```bash
# Bank A approves
curl -X POST http://localhost:3001/bank/approve \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "YOUR_TX_ID"}'

# Bank B approves  
curl -X POST http://localhost:3002/bank/approve \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "YOUR_TX_ID"}'

# Bank C rejects
curl -X POST http://localhost:3003/bank/reject \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "YOUR_TX_ID"}'
```

### 4. Check Transaction Status
- Go to Dashboard or Transactions page
- See the updated status (based on consensus rules)

## Consensus Rules

**Rule A**: All 3 banks approve → Transaction APPROVED  
**Rule B**: 2 out of 3 banks approve + blockchain nodes approve → Transaction APPROVED  
**Otherwise**: Transaction PENDING or REJECTED

## Troubleshooting

### Banks Not Responding
```bash
# Check if banks are running
lsof -i :3001,3002,3003

# Check bank logs
cat bank-service/logs/bank-a.log
cat bank-service/logs/bank-b.log
cat bank-service/logs/bank-c.log
```

### Port Already in Use
```bash
# Kill existing processes
./stop-all.sh

# Or manually
pkill -f "bank-service"
```

### Connection Refused
1. Ensure MongoDB is running: `mongosh --eval "db.adminCommand('ping')"`
2. Verify banks are started: `./start-all.sh`
3. Check firewall settings for ports 3001-3003

## Security Notes

> [!WARNING]
> - Bank services currently have **no authentication**
> - In production, implement API keys or OAuth
> - Use HTTPS in production
> - Implement rate limiting
> - Add request validation and sanitization
> - Enable CORS only for trusted origins

## Support

For issues or questions:
1. Check logs in `.pids/` directory
2. Review `README.md` for general setup
3. Verify all services are running with correct ports
