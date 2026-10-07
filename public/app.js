const state = { selected: null, lastSearch: null };
const $ = (selector) => document.querySelector(selector);
const today = new Date().toISOString().slice(0, 10);
$('#date').min = today;
$('#date').value = today;

function money(value) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value); }
function showMessage(text) { const box = $('#message'); box.textContent = text; box.classList.add('show'); }
function clearMessage() { $('#message').classList.remove('show'); }
function airportOption(airport) { return `<option value="${airport.code}">${airport.city} (${airport.code})</option>`; }

async function loadAirports() {
  const response = await fetch('/api/airports'); const airports = await response.json();
  $('#from').innerHTML = airports.map(airportOption).join(''); $('#to').innerHTML = airports.map(airportOption).join('');
  $('#from').value = 'DEL'; $('#to').value = 'BOM';
}

function renderFlights(results) {
  const list = $('#flightList');
  if (!results.length) { list.innerHTML = '<div class="message show">No flights match this search. Try a different route or travel date.</div>'; return; }
  list.innerHTML = results.map((flight) => `<article class="flight-card"><div class="flight-id">${flight.id}<span>SKYLINE AIRWAYS</span></div><div class="schedule"><div><div class="time">${flight.depart}</div><div class="airport">${flight.from}</div></div><div class="route-line">${flight.duration}<br>NONSTOP</div><div><div class="time">${flight.arrive}</div><div class="airport">${flight.to}</div></div></div><div class="meta">${flight.seats} seats left<br>${flight.cabin}</div><div class="fare">${money(flight.total)}<span>total fare</span></div><button class="select-flight" data-id="${flight.id}">Select</button></article>`).join('');
  document.querySelectorAll('.select-flight').forEach((button) => button.addEventListener('click', () => { state.selected = results.find((flight) => flight.id === button.dataset.id); openBooking(); }));
}

async function search(event) {
  if (event) event.preventDefault(); clearMessage();
  const query = new URLSearchParams({ from: $('#from').value, to: $('#to').value, date: $('#date').value, passengers: $('#passengers').value, cabin: 'Economy' });
  try { const response = await fetch(`/api/flights?${query}`); const data = await response.json(); if (!response.ok) throw new Error(data.error); state.lastSearch = data.search; $('#routeNote').textContent = `${$('#from').selectedOptions[0].text} to ${$('#to').selectedOptions[0].text} · ${data.search.passengers} traveller${data.search.passengers > 1 ? 's' : ''}`; renderFlights(data.flights); $('#flights').scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (error) { showMessage(error.message); }
}

function openBooking() {
  const flight = state.selected; const count = state.lastSearch.passengers;
  $('#bookingFormWrap').innerHTML = `<form class="booking-form" id="bookingForm"><p class="eyebrow">COMPLETE YOUR BOOKING</p><h2>${flight.from} <span>→</span> ${flight.to}</h2><p>${flight.id} · ${state.lastSearch.date} · ${money(flight.total)} total</p><div class="form-grid"><label>FIRST NAME<input name="firstName" required autocomplete="given-name" /></label><label>LAST NAME<input name="lastName" required autocomplete="family-name" /></label><label>EMAIL ADDRESS<input name="email" type="email" required autocomplete="email" /></label><label>PAYMENT METHOD<select name="payment"><option value="card">Credit or debit card</option><option value="upi">UPI</option></select></label></div><button class="confirm-btn">Confirm booking for ${count} traveller${count > 1 ? 's' : ''}</button></form>`;
  $('#bookingForm').addEventListener('submit', submitBooking); $('#bookingDialog').showModal();
}

async function submitBooking(event) {
  event.preventDefault(); const form = new FormData(event.currentTarget); const count = state.lastSearch.passengers;
  const passenger = { firstName: form.get('firstName'), lastName: form.get('lastName') };
  const body = { flightId: state.selected.id, date: state.lastSearch.date, passengers: Array.from({ length: count }, () => passenger), contact: { email: form.get('email') }, payment: { method: form.get('payment') } };
  const button = event.currentTarget.querySelector('button'); button.disabled = true; button.textContent = 'Confirming...';
  try { const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const booking = await response.json(); if (!response.ok) throw new Error(booking.error); $('#bookingFormWrap').innerHTML = `<section class="confirmation"><p class="eyebrow">BOOKING CONFIRMED</p><h2>You are cleared for takeoff.</h2><p>Your booking reference</p><strong>${booking.reference}</strong><p>${booking.flight.from} → ${booking.flight.to} · ${booking.date}<br>Confirmation sent to ${booking.contact.email}</p></section>`; } catch (error) { button.disabled = false; button.textContent = 'Confirm booking'; showMessage(error.message); $('#bookingDialog').close(); } }

$('#searchForm').addEventListener('submit', search);
$('#swap').addEventListener('click', () => { const origin = $('#from').value; $('#from').value = $('#to').value; $('#to').value = origin; });
$('#closeDialog').addEventListener('click', () => $('#bookingDialog').close());
$('#lookupForm').addEventListener('submit', async (event) => { event.preventDefault(); const ref = $('#reference').value.trim(); if (!ref) return; const result = $('#bookingResult'); const response = await fetch(`/api/bookings/${encodeURIComponent(ref)}`); const booking = await response.json(); result.className = 'booking-result'; result.innerHTML = response.ok ? `<strong>${booking.reference} · ${booking.status}</strong><br>${booking.flight.from} → ${booking.flight.to} on ${booking.date}<br>${booking.passengers.length} traveller(s) · ${money(booking.total)}` : booking.error; });
loadAirports().then(search);
