# Skyline Airways

A full-stack flight ticket booking demo with an airport-themed, responsive website and a REST API. It is designed as a polished starter that can be extended with a database, real payment provider, authentication, and live airline inventory.

## Highlights

- Flight search with airport, date, and traveller validation
- Custom radio-button trip selector and responsive airport UI
- Flight availability and inventory-aware booking creation
- Passenger and payment-method capture
- Booking confirmation, retrieval, and cancellation endpoints
- In-memory data store for instant local setup

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Service health check |
| `GET` | `/api/airports` | Supported airport list |
| `GET` | `/api/flights?from=DEL&to=BOM&date=2026-10-07&passengers=1&cabin=Economy` | Search available flights |
| `POST` | `/api/bookings` | Create a booking |
| `GET` | `/api/bookings/:reference` | Get booking details |
| `DELETE` | `/api/bookings/:reference` | Cancel a booking |

### Create booking payload

```json
{
  "flightId": "SK101",
  "date": "2026-10-07",
  "passengers": [{ "firstName": "Aarav", "lastName": "Shah" }],
  "contact": { "email": "aarav@example.com" },
  "payment": { "method": "card" }
}
```

## Production next steps

- Replace in-memory maps with PostgreSQL and migrations.
- Add authentication and role-based access for agents and customers.
- Tokenize payment details through a PCI-compliant provider.
- Integrate an airline/GDS inventory provider and queue seat holds.
- Add rate limiting, structured logging, monitoring, and test coverage.

