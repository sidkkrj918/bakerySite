# Bakery Site

This project contains:

- `frontend/`: an Angular storefront for browsing bakery categories like cupcakes, cookies, and cakes.
- `backend/`: a FastAPI API that serves category data and simulates a payment gateway restricted to Sydney, Australia.

## Features

- Category selection for cupcakes, cookies, and cakes.
- Product selection with pricing.
- Checkout form connected to FastAPI.
- Payment validation limited to customers in Sydney, Australia.

## Run locally

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm start
```

The Angular app runs on `http://localhost:4200` and expects the FastAPI API at `http://127.0.0.1:8000`.
