Payment Gateway with Multi-Method Processing and Hosted Checkout

Overview:
This project implements a containerized payment gateway system similar to platforms like Razorpay or Stripe. It allows merchants to create payment orders via API and enables customers to complete payments through a hosted checkout page.
The system supports UPI and Card payments, includes secure API authentication, payment validation logic, and state-based transaction lifecycle management.
All components are fully containerized and can be started using a single command.
Copy code

docker-compose up -d --build
System Architecture
The system consists of four main components:
API Server (Node.js + Express)
PostgreSQL Database
Merchant Dashboard (React)
Hosted Checkout Page (React)
Copy code

Merchant Dashboard (3000)
        │
        │ Authenticated API Calls
        ▼
Payment Gateway API (8000)
        │
        │ Database Queries
        ▼
PostgreSQL Database (5432)
        ▲
        │ Public API Access
Customer Checkout Page (3001)
Technology Stack
Backend
Node.js
Express.js
Database
PostgreSQL
Frontend
React
Infrastructure
Docker
Docker Compose
Nginx (for production frontend serving)
Docker Deployment
The entire application runs using Docker containers.
Start the system

docker-compose up -d --build
This will automatically start:
Service      Port
API         8000
Dashboard   3000
Checkout Page  3001
PostgreSQL   5432
No manual configuration is required.
Test Merchant (Auto Seeded)
On application startup, a test merchant is automatically created.
Credentials:
Copy code

Merchant ID:
550e8400-e29b-41d4-a716-446655440000

Email:
test@example.com

API Key:
test_key

API Secret:
test_secret
If the merchant already exists, the seeding process is skipped.
API Endpoints
Base URL

http://localhost:8000
Health Check
Endpoint

GET /health
Response

{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-01-15T10:30:00Z"
}
Create Order
Endpoint

POST /api/v1/orders
Headers

X-Api-Key
X-Api-Secret
Content-Type: application/json
Request Body

{
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt_123",
  "notes": {
    "customer_name": "John Doe"
  }
}
Response

{
  "id": "order_XYZ123456789ABCD",
  "merchant_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 50000,
  "currency": "INR",
  "status": "created"
}
Validation Rules
Amount must be ≥ 100
Authentication required
Get Order
Endpoint

GET /api/v1/orders/{order_id}
Returns order only if it belongs to authenticated merchant.
Public Order Endpoint
Used by checkout page.

GET /api/v1/orders/{order_id}/public
Authentication is not required.
Create Payment
Endpoint
Copy code

POST /api/v1/payments/public
UPI Payment Example

{
  "order_id": "order_ABC123456789XYZ",
  "method": "upi",
  "vpa": "user@upi"
}
Card Payment Example

{
  "order_id": "order_ABC123456789XYZ",
  "method": "card",
  "card": {
    "number": "4111111111111111",
    "expiry_month": "12",
    "expiry_year": "30",
    "cvv": "123",
    "holder_name": "John Doe"
  }
}
Payment Processing Logic
Payment lifecycle:

processing → success
processing → failed
Processing delay simulates real banking behavior.
Success probability:
Method
Success Rate
UPI
90%
Card
95%
When successful:
Payment status becomes success
Order status becomes paid
When failed:
Status becomes failed
Error code and description are stored
Validation Logic
UPI Validation
Regex Pattern

^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$
Examples
Valid

user@paytm
john.doe@okhdfcbank
user123@phonepe
Invalid

user @paytm
@paytm
user@@bank
user@
Card Validation
The system implements the Luhn Algorithm for card validation.
Steps
Remove spaces and dashes
Validate length (13–19 digits)
Apply Luhn checksum
Detect card network
Validate expiry date
Card Network Detection
Detected networks:
Network
Prefix
Visa
4
Mastercard
51–55
Amex
34 or 37
RuPay
60, 65, 81–89
Only the last 4 digits of the card are stored.
Full card numbers and CVV are never stored.
Database Schema
Merchants
Fields
id (UUID) name email api_key api_secret webhook_url is_active created_at updated_at

Orders
Fields
id merchant_id amount currency receipt notes status created_at updated_at 

Payments
Fields
id order_id merchant_id amount currency method status vpa card_network card_last4 error_code error_description created_at updated_at

Merchant Dashboard
Dashboard features include:
Merchant login
Create orders
View orders list
Payment status tracking
Checkout link generation
Hosted Checkout Page
Customer checkout page supports:
Order retrieval via public API
Payment method selection
UPI form
Card form
Processing state
Success and failure states
Redirect back to dashboard
End-to-End Payment Flow
Merchant logs into dashboard
Merchant creates an order
Checkout link is generated
Customer opens checkout page
Customer enters payment details
Payment validation is performed
Payment is processed
Payment status updates
Dashboard reflects payment status


Screenshots:
Screenshots included in /screenshots folder show:
Login page
Merchant dashboard
Order creation
Checkout page
UPI payment form
Card payment form
Processing state
Payment success state
Payment failure state




Setup Instructions
-----------------
Clone the repository

git clone <repository_url>
Enter project directory

cd PaymentGateway_2.0
Start services

docker-compose up -d --build
Access services
Dashboard
http://localhost:3000⁠�
Checkout Page
http://localhost:3001⁠�
API
http://localhost:8000⁠�
Health Check
http://localhost:8000/health⁠�
