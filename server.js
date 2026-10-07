const express = require('express');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const airports = [
  { code: 'DEL', city: 'New Delhi', airport: 'Indira Gandhi International' },
  { code: 'BOM', city: 'Mumbai', airport: 'Chhatrapati Shivaji Maharaj International' },
  { code: 'BLR', city: 'Bengaluru', airport: 'Kempegowda International' },
  { code: 'DXB', city: 'Dubai', airport: 'Dubai International' },
  { code: 'SIN', city: 'Singapore', airport: 'Changi Airport' },
  { code: 'LHR', city: 'London', airport: 'Heathrow Airport' }
];

const flights = [
  { id: 'SK101', from: 'DEL', to: 'BOM', depart: '06:40', arrive: '08:55', duration: '2h 15m', stops: 0, fare: 5499, cabin: 'Economy', seats: 9 },
  { id: 'SK215', from: 'DEL', to: 'BOM', depart: '10:15', arrive: '12:35', duration: '2h 20m', stops: 0, fare: 6199, cabin: 'Economy', seats: 6 },
  { id: 'SK337', from: 'DEL', to: 'BOM', depart: '16:30', arrive: '18:45', duration: '2h 15m', stops: 0, fare: 7299, cabin: 'Economy', seats: 4 },
  { id: 'SK502', from: 'DEL', to: 'DXB', depart: '21:10', arrive: '23:45', duration: '3h 05m', stops: 0, fare: 15899, cabin: 'Economy', seats: 12 }
];

const bookings = new Map();
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '');

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'Skyline Airways API' }));
app.get('/api/airports', (_req, res) => res.json(airports));

app.get('/api/flights', (req, res) => {
  const { from = 'DEL', to = 'BOM', date, passengers = 1, cabin = 'Economy' } = req.query;
  if (!validDate(date)) return res.status(400).json({ error: 'A valid departure date is required (YYYY-MM-DD).' });
  if (from === to) return res.status(400).json({ error: 'Origin and destination must be different.' });
  const count = Number(passengers);
  if (!Number.isInteger(count) || count < 1 || count > 9) return res.status(400).json({ error: 'Passengers must be between 1 and 9.' });
  const results = flights
    .filter((flight) => flight.from === from && flight.to === to && flight.cabin === cabin && flight.seats >= count)
    .map((flight) => ({ ...flight, date, total: flight.fare * count }));
  res.json({ search: { from, to, date, passengers: count, cabin }, flights: results });
});

app.post('/api/bookings', (req, res) => {
  const { flightId, date, passengers, contact, payment } = req.body || {};
  const flight = flights.find((item) => item.id === flightId);
  if (!flight || !validDate(date) || !Array.isArray(passengers) || !passengers.length) {
    return res.status(400).json({ error: 'Flight, departure date, and at least one passenger are required.' });
  }
  if (passengers.length > flight.seats || passengers.some((p) => !p.firstName || !p.lastName)) {
    return res.status(400).json({ error: 'Passenger details are incomplete or seats are unavailable.' });
  }
  if (!contact?.email || !/^\S+@\S+\.\S+$/.test(contact.email) || !payment?.method) {
    return res.status(400).json({ error: 'A valid email address and payment method are required.' });
  }
  flight.seats -= passengers.length;
  const reference = `SKY-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const booking = { reference, status: 'CONFIRMED', flight: { ...flight }, date, passengers, contact, total: flight.fare * passengers.length, createdAt: new Date().toISOString() };
  bookings.set(reference, booking);
  res.status(201).json(booking);
});

app.get('/api/bookings/:reference', (req, res) => {
  const booking = bookings.get(req.params.reference.toUpperCase());
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  res.json(booking);
});

app.delete('/api/bookings/:reference', (req, res) => {
  const booking = bookings.get(req.params.reference.toUpperCase());
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  if (booking.status === 'CANCELLED') return res.status(409).json({ error: 'Booking is already cancelled.' });
  booking.status = 'CANCELLED';
  flights.find((flight) => flight.id === booking.flight.id).seats += booking.passengers.length;
  res.json(booking);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

app.listen(PORT, () => console.log(`Skyline Airways is ready at http://localhost:${PORT}`));
