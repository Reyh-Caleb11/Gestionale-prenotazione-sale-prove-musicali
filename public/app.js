const rooms = [
  { id: "room-a", name: "Studio A", detail: "Sala grande", color: "#91a94e", tint: "#edf2df", rate: 25 },
  { id: "room-b", name: "Studio B", detail: "Sala vintage", color: "#dc896e", tint: "#f9e9e2", rate: 20 },
  { id: "room-c", name: "Studio C", detail: "Sala live", color: "#69a0a9", tint: "#e4f0f0", rate: 30 },
];

const roomInstruments = {
  "room-a": [
    { id: "a-drums", name: "Batteria acustica", detail: "Yamaha Stage Custom" },
    { id: "a-guitar", name: "Chitarra elettrica", detail: "Fender Player Stratocaster" },
    { id: "a-guitar-amp", name: "Amplificatore chitarra", detail: "Fender Hot Rod Deluxe" },
    { id: "a-bass-amp", name: "Amplificatore basso", detail: "Ampeg BA-210" },
    { id: "a-keyboard", name: "Tastiera", detail: "Nord Electro 6D" },
    { id: "a-mic-1", name: "Microfono voce 1", detail: "Shure SM58" },
    { id: "a-mic-2", name: "Microfono voce 2", detail: "Shure SM58" },
  ],
  "room-b": [
    { id: "b-drums", name: "Batteria acustica", detail: "Ludwig Classic Maple" },
    { id: "b-guitar", name: "Chitarra elettrica", detail: "Gibson Les Paul Studio" },
    { id: "b-guitar-amp", name: "Amplificatore chitarra", detail: "Vox AC30" },
    { id: "b-bass-amp", name: "Amplificatore basso", detail: "Markbass CMD 121P" },
    { id: "b-keyboard", name: "Tastiera", detail: "Yamaha CK61" },
    { id: "b-mic", name: "Microfono voce", detail: "Shure SM58" },
  ],
  "room-c": [
    { id: "c-drums", name: "Batteria acustica", detail: "Pearl Export" },
    { id: "c-guitar", name: "Chitarra elettrica", detail: "Fender Player Telecaster" },
    { id: "c-guitar-amp", name: "Amplificatore chitarra", detail: "Marshall DSL40" },
    { id: "c-bass", name: "Basso elettrico", detail: "Fender Player Jazz Bass" },
    { id: "c-bass-amp", name: "Amplificatore basso", detail: "Ampeg SVT-210AV" },
    { id: "c-keyboard", name: "Tastiera", detail: "Roland Juno-DS61" },
    { id: "c-mic-1", name: "Microfono voce 1", detail: "Shure SM58" },
    { id: "c-mic-2", name: "Microfono voce 2", detail: "Shure SM58" },
  ],
};

const storageKey = "riff-bookings-v1";
const startHour = 8;
const endHour = 23;
const hourHeight = 60;
const weekdayNames = ["DOM", "LUN", "MAR", "MER", "GIO", "VEN", "SAB"];
const monthNames = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const shortMonthNames = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
const $ = (selector) => document.querySelector(selector);
const bookingDialog = $("#bookingDialog");
const bookingForm = $("#bookingForm");
let weekStart = mondayOf(new Date());
let selectedRoom = "all";
let dayMode = false;
let selectedView = "home";
let availabilityRoom = rooms[0].id;
let availabilityDuration = 2;
let availabilityStart = dateKey(new Date());
let selectedAvailabilityDate = availabilityStart;
let bookings = loadBookings();
let selectedInstrumentIds = [];
let pendingBooking = null;

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mondayOf(date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function loadBookings() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    return Array.isArray(stored) ? stored.filter((booking) => !String(booking.id).startsWith("sample-")) : [];
  } catch {
    return [];
  }
}

function saveBookings() {
  localStorage.setItem(storageKey, JSON.stringify(bookings));
}

function getRoom(roomId) {
  return rooms.find((room) => room.id === roomId) || rooms[0];
}

function formatCurrency(value) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function renderRoomControls() {
  $("#roomFilters").innerHTML = rooms.map((room) => `
    <button class="room-filter ${selectedRoom === room.id ? "selected" : ""}" type="button" data-room-filter="${room.id}" aria-pressed="${selectedRoom === room.id}">
      <span class="room-dot" style="background:${room.color}"></span><span>${room.name}</span>
    </button>`).join("");
  $("#roomSelect").innerHTML = '<option value="all">Tutte le sale</option>' + rooms.map((room) => `<option value="${room.id}">${room.name}</option>`).join("");
  $("#roomSelect").value = selectedRoom;
  $("#bookingRoom").innerHTML = rooms.map((room) => `<option value="${room.id}">${room.name} · ${room.detail}</option>`).join("");
  $("#availabilityRoomSelect").innerHTML = rooms.map((room) => `<option value="${room.id}">${room.name} · ${room.detail}</option>`).join("");
  $("#availabilityRoomSelect").value = availabilityRoom;
}

function renderStats() {
  const weekEnd = addDays(weekStart, 7);
  const weekBookings = bookings.filter((booking) => {
    const date = new Date(`${booking.date}T00:00:00`);
    return date >= weekStart && date < weekEnd;
  });
  const hours = weekBookings.reduce((total, booking) => total + Number(booking.duration), 0);
  const revenue = weekBookings.reduce((total, booking) => total + Number(booking.price || 0), 0);
  $("#statBookings").textContent = String(weekBookings.length).padStart(2, "0");
  $("#statHours").textContent = String(hours);
  $("#statRevenue").textContent = formatCurrency(revenue);
  $("#bookingNavCount").textContent = String(bookings.length).padStart(2, "0");
  $("#bookingTrend").textContent = `${weekBookings.filter((booking) => booking.status === "confirmed").length} confermate`;
}

function renderBookingRooms() {
  $("#bookingRooms").innerHTML = rooms.map((room, index) => `
    <article class="booking-room" style="--room-color:${room.color};--room-tint:${room.tint}">
      <div class="room-card-top"><span class="room-card-number">0${index + 1}</span><span class="room-card-dot"></span></div>
      <div class="room-card-info"><h3>${room.name}</h3><span>${room.detail}</span></div>
      <div class="room-card-bottom"><span><strong>${formatCurrency(room.rate)}</strong> / ora</span><button type="button" data-book-room="${room.id}" aria-label="Prenota ${room.name}">Prenota <span aria-hidden="true">→</span></button></div>
    </article>`).join("");
}

function getAvailableStarts(date, room, duration) {
  const starts = [];
  const now = new Date();
  const isToday = date === dateKey(now);
  const earliestToday = Math.ceil((now.getHours() * 60 + now.getMinutes()) / 30) * 30;
  for (let minutes = startHour * 60; minutes + duration * 60 <= endHour * 60; minutes += 30) {
    if (isToday && minutes < earliestToday) continue;
    const start = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    if (checkAvailability({ date, room, start, duration })) starts.push(start);
  }
  return starts;
}

function renderAvailability() {
  const room = getRoom(availabilityRoom);
  const lastDay = addDays(new Date(`${availabilityStart}T00:00:00`), 6);
  $("#availabilityRangeLabel").textContent = `${new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short" }).format(new Date(`${availabilityStart}T00:00:00`))} – ${new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short" }).format(lastDay)}`;
  $("#availabilityRate").innerHTML = `<strong>${formatCurrency(room.rate * availabilityDuration)}</strong><span>totali · ${formatCurrency(room.rate)}/ora</span>`;
  $("#slotDurationLabel").textContent = `${availabilityDuration} ${availabilityDuration === 1 ? "ora" : "ore"}`;
  const days = Array.from({ length: 7 }, (_, index) => addDays(new Date(`${availabilityStart}T00:00:00`), index));
  $("#availabilityDays").innerHTML = days.map((date) => {
    const key = dateKey(date);
    const starts = getAvailableStarts(key, availabilityRoom, availabilityDuration);
    const dayLabel = key === dateKey(new Date()) ? "Oggi" : weekdayNames[date.getDay()];
    return `<button class="availability-day ${selectedAvailabilityDate === key ? "selected" : ""}" type="button" data-availability-date="${key}" aria-pressed="${selectedAvailabilityDate === key}"><span>${dayLabel}</span><strong>${date.getDate()}</strong><small>${starts.length ? `${starts.length} orari` : "Completo"}</small></button>`;
  }).join("");
  const chosenDate = new Date(`${selectedAvailabilityDate}T00:00:00`);
  $("#slotsTitle").textContent = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" }).format(chosenDate);
  const starts = getAvailableStarts(selectedAvailabilityDate, availabilityRoom, availabilityDuration);
  $("#slotsSubtitle").textContent = starts.length ? `${starts.length} orari liberi in ${room.name}` : `Nessun orario libero in ${room.name}`;
  $("#timeSlots").innerHTML = starts.length
    ? starts.map((start) => `<button class="time-slot" type="button" data-slot-start="${start}" data-slot-date="${selectedAvailabilityDate}"><span>${start}</span><small>${formatEnd(start, availabilityDuration)}</small></button>`).join("")
    : `<div class="availability-empty"><span aria-hidden="true">◷</span><strong>Qui la sala è al completo.</strong><span>Prova un altro giorno o una durata diversa.</span></div>`;
  $("#previousAvailabilityDays").disabled = availabilityStart <= dateKey(new Date());
}

function renderBookings() {
  const search = $("#bookingSearch").value.trim().toLocaleLowerCase("it");
  const status = $("#bookingStatusFilter").value;
  const visible = [...bookings]
    .filter((booking) => status === "all" || booking.status === status)
    .filter((booking) => `${booking.band} ${getRoom(booking.room).name}`.toLocaleLowerCase("it").includes(search))
    .sort((left, right) => `${left.date} ${left.start}`.localeCompare(`${right.date} ${right.start}`));
  $("#bookingsCount").textContent = `${visible.length} ${visible.length === 1 ? "prenotazione" : "prenotazioni"}`;
  $("#bookingList").innerHTML = visible.length ? visible.map((booking) => {
    const room = getRoom(booking.room);
    const date = new Date(`${booking.date}T00:00:00`);
    return `<article class="booking-list-row"><div class="booking-date-badge"><span>${weekdayNames[date.getDay()]}</span><strong>${date.getDate()}</strong><small>${shortMonthNames[date.getMonth()]}</small></div><div class="booking-list-main"><strong>${escapeHtml(booking.band)}</strong><span>${room.name} · ${booking.start}–${formatEnd(booking.start, Number(booking.duration))} · ${booking.duration} ${booking.duration === 1 ? "ora" : "ore"}</span></div><div class="booking-list-meta"><span class="booking-status ${booking.status}">${booking.status === "pending" ? "In attesa" : "Confermata"}</span><strong>${formatCurrency(Number(booking.price || 0))}</strong></div></article>`;
  }).join("") : `<div class="bookings-empty"><span class="empty-calendar-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 10h16"/></svg></span><strong>${search || status !== "all" ? "Nessuna prenotazione trovata" : "Ancora nessuna prova in agenda"}</strong><span>${search || status !== "all" ? "Modifica i filtri di ricerca." : "Scegli un giorno e un orario per prenotare la tua sala."}</span>${search || status !== "all" ? "" : '<button type="button" class="empty-book-button" data-view="availability">Vedi disponibilità <span aria-hidden="true">→</span></button>'}</div>`;
}

function setView(view) {
  selectedView = view;
  const labels = { home: "Prenota una sala", availability: "Disponibilità", bookings: "Prenotazioni", management: "Calendario" };
  document.querySelectorAll(".view-panel").forEach((panel) => {
    const active = panel.id === `${view}View`;
    panel.classList.toggle("active", active);
    panel.hidden = !active;
  });
  document.querySelectorAll("[data-view]").forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  $("#viewBreadcrumb").textContent = labels[view];
  if (view === "availability") renderAvailability();
  if (view === "bookings") renderBookings();
  if (view === "management") renderCalendar();
}

function renderCalendar() {
  const grid = $("#calendarGrid");
  const todayKey = dateKey(new Date());
  const visibleDays = dayMode ? [new Date(weekStart)] : Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  if (dayMode) {
    const chosenDay = window.selectedCalendarDay;
    visibleDays[0] = chosenDay && dateKey(chosenDay) >= dateKey(weekStart) && dateKey(chosenDay) <= dateKey(addDays(weekStart, 6)) ? chosenDay : new Date(weekStart);
  }
  grid.classList.toggle("day-mode", dayMode);
  const header = `<div class="calendar-corner"></div>${visibleDays.map((date) => `
    <div class="day-header ${dateKey(date) === todayKey ? "today" : ""}"><span>${weekdayNames[date.getDay()]}</span><strong>${date.getDate()}</strong></div>`).join("")}`;
  const axis = `<div class="time-axis">${Array.from({ length: endHour - startHour + 1 }, (_, index) => {
    const hour = startHour + index;
    return `<span class="time-label" style="top:${index * hourHeight}px">${String(hour).padStart(2, "0")}:00</span>`;
  }).join("")}</div>`;
  const columns = visibleDays.map((date) => {
    const day = dateKey(date);
    const events = bookings.filter((booking) => booking.date === day && (selectedRoom === "all" || booking.room === selectedRoom));
    const slots = Array.from({ length: (endHour - startHour) * 2 }, (_, index) => {
      const minutes = startHour * 60 + index * 30;
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      return `<button class="slot-button" type="button" style="top:${index * hourHeight / 2}px" data-date="${day}" data-start="${time}" aria-label="Prenota il ${date.getDate()} alle ${time}"></button>`;
    }).join("");
    const eventMarkup = events.map((booking) => {
      const room = getRoom(booking.room);
      const [hour, minute] = booking.start.split(":").map(Number);
      const top = ((hour * 60 + minute) - startHour * 60) / 60 * hourHeight;
      const height = Number(booking.duration) * hourHeight;
      return `<button class="booking-event ${booking.status}" type="button" style="top:${top}px;height:${height - 3}px;--room-color:${room.color};--event-bg:${room.tint}" data-booking-id="${booking.id}" aria-label="${booking.band}, ${room.name}, ${booking.start}, ${booking.duration} ore">
        <span class="event-time">${booking.start} – ${formatEnd(booking.start, Number(booking.duration))}</span><span class="event-name">${escapeHtml(booking.band)}</span><span class="event-room">${room.name}${booking.status === "pending" ? " · In attesa" : ""}</span>
      </button>`;
    }).join("");
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const currentLine = day === todayKey && nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60
      ? `<span class="current-time-line" style="top:${(nowMinutes - startHour * 60) / 60 * hourHeight}px"></span>` : "";
    return `<div class="day-column ${day === todayKey ? "today-column" : ""}" data-day="${day}">${slots}${eventMarkup}${currentLine}</div>`;
  }).join("");
  grid.innerHTML = `${header}${axis}${columns}`;
  const last = addDays(weekStart, 6);
  $("#weekTitle").textContent = weekStart.getMonth() === last.getMonth()
    ? `${weekStart.getDate()}–${last.getDate()} ${monthNames[last.getMonth()]} ${last.getFullYear()}`
    : `${weekStart.getDate()} ${shortMonthNames[weekStart.getMonth()]} – ${last.getDate()} ${shortMonthNames[last.getMonth()]} ${last.getFullYear()}`;
  renderStats();
}

function formatEnd(start, duration) {
  const [hours, minutes] = start.split(":").map(Number);
  const total = hours * 60 + minutes + duration * 60;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function populateStartTimes() {
  const select = $("#bookingStart");
  select.innerHTML = Array.from({ length: (endHour - startHour) * 2 }, (_, index) => {
    const minutes = startHour * 60 + index * 30;
    const value = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    return `<option value="${value}">${value}</option>`;
  }).join("");
}

function openBooking(booking = null, defaults = {}) {
  bookingForm.reset();
  pendingBooking = null;
  $("#bookingDetailsStep").hidden = false;
  $("#bookingReviewStep").hidden = true;
  $("#bookingEntryActions").hidden = false;
  $("#bookingReviewActions").hidden = true;
  $("#bookingAdminFields").hidden = !booking;
  $("#formError").textContent = "";
  $("#bookingId").value = booking?.id || "";
  selectedInstrumentIds = Array.isArray(booking?.instruments) ? [...booking.instruments] : [];
  $("#instrumentAvailability").hidden = true;
  $("#toggleInstrumentAvailability").setAttribute("aria-expanded", "false");
  $("#toggleInstrumentAvailability").querySelector("span").textContent = "Mostra strumenti disponibili";
  $("#dialogTitle").textContent = booking ? "Modifica prenotazione" : "Nuova prenotazione";
  $(".save-booking").textContent = booking ? "Controlla le modifiche" : "Controlla prenotazione";
  $("#deleteBookingButton").hidden = !booking;
  $("#bandName").value = booking?.band || "";
  $("#bookingRoom").value = booking?.room || defaults.room || (selectedRoom === "all" ? availabilityRoom : selectedRoom);
  $("#bookingDate").value = booking?.date || defaults.date || dateKey(new Date());
  $("#bookingStart").value = booking?.start || defaults.start || "10:00";
  $("#bookingDuration").value = String(booking?.duration || defaults.duration || 2);
  $("#bookingStatus").value = booking?.status || "confirmed";
  $("#bookingPrice").value = booking?.price ?? getRoom($("#bookingRoom").value).rate * Number($("#bookingDuration").value);
  renderInstrumentAvailability();
  bookingDialog.showModal();
  $("#bandName").focus();
}

function checkAvailability(candidate) {
  const candidateStart = candidate.start.split(":").reduce((total, part) => total * 60 + Number(part), 0);
  const candidateEnd = candidateStart + Number(candidate.duration) * 60;
  return !bookings.some((booking) => {
    if (booking.id === candidate.id || booking.room !== candidate.room || booking.date !== candidate.date) return false;
    const bookingStart = booking.start.split(":").reduce((total, part) => total * 60 + Number(part), 0);
    const bookingEnd = bookingStart + Number(booking.duration) * 60;
    return candidateStart < bookingEnd && candidateEnd > bookingStart;
  });
}

function getAvailableInstruments(candidate) {
  const [candidateHour, candidateMinute] = candidate.start.split(":").map(Number);
  const candidateStart = candidateHour * 60 + candidateMinute;
  const candidateEnd = candidateStart + Number(candidate.duration) * 60;
  const occupiedIds = new Set();
  bookings.forEach((booking) => {
    if (booking.id === candidate.id || booking.room !== candidate.room || booking.date !== candidate.date) return;
    const [bookingHour, bookingMinute] = booking.start.split(":").map(Number);
    const bookingStart = bookingHour * 60 + bookingMinute;
    const bookingEnd = bookingStart + Number(booking.duration) * 60;
    if (candidateStart < bookingEnd && candidateEnd > bookingStart) {
      (Array.isArray(booking.instruments) ? booking.instruments : []).forEach((id) => occupiedIds.add(id));
    }
  });
  return (roomInstruments[candidate.room] || []).map((instrument) => ({
    ...instrument,
    available: !occupiedIds.has(instrument.id),
  }));
}

function renderInstrumentAvailability() {
  const candidate = {
    id: $("#bookingId").value,
    room: $("#bookingRoom").value,
    date: $("#bookingDate").value,
    start: $("#bookingStart").value,
    duration: Number($("#bookingDuration").value),
  };
  const room = getRoom(candidate.room);
  const instruments = getAvailableInstruments(candidate);
  selectedInstrumentIds = selectedInstrumentIds.filter((id) => instruments.some((instrument) => instrument.id === id && instrument.available));
  const end = candidate.start ? formatEnd(candidate.start, candidate.duration) : "";
  const date = candidate.date ? new Intl.DateTimeFormat("it-IT", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${candidate.date}T00:00:00`)) : "Seleziona un giorno";
  $("#instrumentRoomLabel").textContent = `Attrezzatura · ${room.name}`;
  $("#instrumentTimeLabel").textContent = candidate.start ? `${date} · ${candidate.start}–${end}` : date;
  $("#instrumentList").innerHTML = instruments.length ? instruments.map((instrument) => {
    const selected = selectedInstrumentIds.includes(instrument.id);
    return `<label class="instrument-option ${instrument.available ? "" : "unavailable"} ${selected ? "selected" : ""}"><input type="checkbox" value="${instrument.id}" ${selected ? "checked" : ""} ${instrument.available ? "" : "disabled"}><span class="instrument-option-check" aria-hidden="true"></span><span class="instrument-option-copy"><strong>${instrument.name}</strong><small>${instrument.detail}</small></span><span class="instrument-option-status">${instrument.available ? "Disponibile" : "Già riservato"}</span></label>`;
  }).join("") : `<p class="instrument-empty">Non ci sono strumenti registrati per questa sala.</p>`;
}

function renderBookingReview(booking) {
  const room = getRoom(booking.room);
  const date = new Date(`${booking.date}T00:00:00`);
  const instrumentNames = (roomInstruments[booking.room] || [])
    .filter((instrument) => booking.instruments.includes(instrument.id))
    .map((instrument) => instrument.name);
  $("#reviewBand").textContent = booking.band;
  $("#reviewRoom").textContent = `${room.name} · ${room.detail}`;
  $("#reviewDateTime").textContent = `${new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date)} · ${booking.start}–${formatEnd(booking.start, booking.duration)}`;
  $("#reviewDuration").textContent = `${booking.duration} ${booking.duration === 1 ? "ora" : "ore"}`;
  $("#reviewInstruments").textContent = instrumentNames.length ? instrumentNames.join(", ") : "Nessuno strumento aggiunto";
  $("#reviewPrice").textContent = formatCurrency(booking.price);
  $("#reviewStatus").textContent = booking.status === "pending" ? "In attesa" : "Confermata";
  $("#reviewStatus").className = `review-status ${booking.status}`;
}

function handleSubmit(event) {
  event.preventDefault();
  const formData = new FormData(bookingForm);
  const existingId = $("#bookingId").value;
  const booking = {
    id: existingId || `booking-${Date.now()}`,
    band: String(formData.get("bandName")).trim(),
    room: formData.get("room"),
    date: formData.get("date"),
    start: formData.get("start"),
    duration: Number(formData.get("duration")),
    status: formData.get("status"),
    price: Number(formData.get("price")) || 0,
    instruments: [...selectedInstrumentIds],
  };
  if (!booking.band) return;
  if (formatEnd(booking.start, booking.duration) > "23:00") {
    $("#formError").textContent = "La sala chiude alle 23:00. Riduci la durata o cambia orario.";
    return;
  }
  if (!checkAvailability(booking)) {
    $("#formError").textContent = "Questa sala è già prenotata in quell'orario. Scegli un altro slot.";
    return;
  }
  const availableInstrumentIds = new Set(getAvailableInstruments(booking).map((instrument) => instrument.id));
  if (booking.instruments.some((id) => !availableInstrumentIds.has(id))) {
    $("#formError").textContent = "Uno strumento selezionato non è più disponibile. Aggiorna la verifica.";
    $("#instrumentAvailability").hidden = false;
    renderInstrumentAvailability();
    return;
  }
  pendingBooking = booking;
  renderBookingReview(booking);
  $("#dialogTitle").textContent = existingId ? "Conferma le modifiche" : "Conferma la prenotazione";
  $("#bookingDetailsStep").hidden = true;
  $("#bookingReviewStep").hidden = false;
  $("#bookingEntryActions").hidden = true;
  $("#bookingReviewActions").hidden = false;
  $("#formError").textContent = "";
}

function confirmPendingBooking() {
  if (!pendingBooking) return;
  const wasEdit = bookings.some((booking) => booking.id === pendingBooking.id);
  if (!checkAvailability(pendingBooking)) {
    $("#formError").textContent = "Questo orario è stato appena prenotato. Torna ai dettagli e scegli un altro slot.";
    $("#bookingDetailsStep").hidden = false;
    $("#bookingReviewStep").hidden = true;
    $("#bookingEntryActions").hidden = false;
    $("#bookingReviewActions").hidden = true;
    pendingBooking = null;
    return;
  }
  const availableInstrumentIds = new Set(getAvailableInstruments(pendingBooking).map((instrument) => instrument.id));
  if (pendingBooking.instruments.some((id) => !availableInstrumentIds.has(id))) {
    $("#formError").textContent = "Uno strumento non è più libero in questo orario. Aggiorna la selezione prima di confermare.";
    $("#bookingDetailsStep").hidden = false;
    $("#bookingReviewStep").hidden = true;
    $("#bookingEntryActions").hidden = false;
    $("#bookingReviewActions").hidden = true;
    $("#instrumentAvailability").hidden = false;
    renderInstrumentAvailability();
    pendingBooking = null;
    return;
  }
  const booking = pendingBooking;
  bookings = wasEdit
    ? bookings.map((item) => item.id === booking.id ? booking : item)
    : [...bookings, booking];
  saveBookings();
  weekStart = mondayOf(new Date(`${booking.date}T00:00:00`));
  window.selectedCalendarDay = new Date(`${booking.date}T00:00:00`);
  $("#bookingNoticeTitle").textContent = wasEdit ? "Modifiche salvate" : "Prenotazione confermata";
  $("#bookingNoticeDetails").textContent = `${getRoom(booking.room).name} · ${new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long" }).format(new Date(`${booking.date}T00:00:00`))} · ${booking.start}–${formatEnd(booking.start, booking.duration)}`;
  $("#bookingNotice").hidden = false;
  bookingDialog.close();
  pendingBooking = null;
  renderCalendar();
  renderAvailability();
  renderBookings();
}

$("#todayLabel").textContent = new Intl.DateTimeFormat("it-IT", { weekday: "short", day: "numeric", month: "short" }).format(new Date());
renderRoomControls();
populateStartTimes();
renderCalendar();
renderBookingRooms();
renderAvailability();
renderBookings();
setView("home");

$("#previousWeek").addEventListener("click", () => { weekStart = addDays(weekStart, -7); renderCalendar(); });
$("#nextWeek").addEventListener("click", () => { weekStart = addDays(weekStart, 7); renderCalendar(); });
$("#todayButton").addEventListener("click", () => { weekStart = mondayOf(new Date()); window.selectedCalendarDay = new Date(); renderCalendar(); });
$("#newBookingButton").addEventListener("click", () => openBooking());

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) setView(viewButton.dataset.view);
});

$("#startBookingButton").addEventListener("click", () => setView("availability"));
$("#seeAvailabilityButton").addEventListener("click", () => setView("availability"));
$("#roomsAvailabilityButton").addEventListener("click", () => setView("availability"));
$("#seeBookingsButton").addEventListener("click", () => setView("bookings"));
$("#bookingsNewButton").addEventListener("click", () => setView("availability"));

$("#bookingRooms").addEventListener("click", (event) => {
  const button = event.target.closest("[data-book-room]");
  if (!button) return;
  availabilityRoom = button.dataset.bookRoom;
  $("#availabilityRoomSelect").value = availabilityRoom;
  setView("availability");
});

$("#availabilityRoomSelect").addEventListener("change", (event) => {
  availabilityRoom = event.target.value;
  renderAvailability();
});

$("#availabilityDuration").addEventListener("change", (event) => {
  availabilityDuration = Number(event.target.value);
  renderAvailability();
});

$("#availabilityDays").addEventListener("click", (event) => {
  const button = event.target.closest("[data-availability-date]");
  if (!button) return;
  selectedAvailabilityDate = button.dataset.availabilityDate;
  renderAvailability();
});

$("#previousAvailabilityDays").addEventListener("click", () => {
  if (availabilityStart <= dateKey(new Date())) return;
  availabilityStart = dateKey(addDays(new Date(`${availabilityStart}T00:00:00`), -7));
  selectedAvailabilityDate = availabilityStart;
  renderAvailability();
});

$("#nextAvailabilityDays").addEventListener("click", () => {
  availabilityStart = dateKey(addDays(new Date(`${availabilityStart}T00:00:00`), 7));
  selectedAvailabilityDate = availabilityStart;
  renderAvailability();
});

$("#timeSlots").addEventListener("click", (event) => {
  const button = event.target.closest("[data-slot-start]");
  if (!button) return;
  openBooking(null, { date: button.dataset.slotDate, start: button.dataset.slotStart, room: availabilityRoom, duration: availabilityDuration });
});

$("#bookingSearch").addEventListener("input", renderBookings);
$("#bookingStatusFilter").addEventListener("change", renderBookings);
$("#confirmBookingButton").addEventListener("click", confirmPendingBooking);
$("#backToBookingButton").addEventListener("click", () => {
  $("#bookingDetailsStep").hidden = false;
  $("#bookingReviewStep").hidden = true;
  $("#bookingEntryActions").hidden = false;
  $("#bookingReviewActions").hidden = true;
  $("#dialogTitle").textContent = $("#bookingId").value ? "Modifica prenotazione" : "Nuova prenotazione";
  $("#formError").textContent = "";
  pendingBooking = null;
});
$("#bookingNoticeView").addEventListener("click", () => {
  $("#bookingNotice").hidden = true;
  setView("bookings");
});
$("#dismissBookingNotice").addEventListener("click", () => { $("#bookingNotice").hidden = true; });

$("#weekViewButton").addEventListener("click", () => {
  dayMode = false;
  $("#weekViewButton").classList.add("active");
  $("#weekViewButton").setAttribute("aria-pressed", "true");
  $("#dayViewButton").classList.remove("active");
  $("#dayViewButton").setAttribute("aria-pressed", "false");
  renderCalendar();
});

$("#dayViewButton").addEventListener("click", () => {
  dayMode = true;
  window.selectedCalendarDay = new Date();
  $("#dayViewButton").classList.add("active");
  $("#dayViewButton").setAttribute("aria-pressed", "true");
  $("#weekViewButton").classList.remove("active");
  $("#weekViewButton").setAttribute("aria-pressed", "false");
  renderCalendar();
});

$("#roomSelect").addEventListener("change", (event) => {
  selectedRoom = event.target.value;
  renderRoomControls();
  renderCalendar();
});

$("#roomFilters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-room-filter]");
  if (!button) return;
  selectedRoom = selectedRoom === button.dataset.roomFilter ? "all" : button.dataset.roomFilter;
  renderRoomControls();
  renderCalendar();
});

$("#calendarGrid").addEventListener("click", (event) => {
  const eventButton = event.target.closest("[data-booking-id]");
  if (eventButton) {
    const booking = bookings.find((item) => item.id === eventButton.dataset.bookingId);
    if (booking) openBooking(booking);
    return;
  }
  const slot = event.target.closest("[data-date][data-start]");
  if (slot) openBooking(null, { date: slot.dataset.date, start: slot.dataset.start });
});

bookingForm.addEventListener("change", (event) => {
  if (event.target.id === "bookingRoom" && !$("#bookingId").value) {
    $("#bookingPrice").value = getRoom(event.target.value).rate * Number($("#bookingDuration").value);
  }
  if (event.target.id === "bookingDuration" && !$("#bookingId").value) {
    $("#bookingPrice").value = getRoom($("#bookingRoom").value).rate * Number(event.target.value);
  }
  if (event.target.matches(".instrument-option input")) {
    selectedInstrumentIds = [...document.querySelectorAll(".instrument-option input:checked")].map((input) => input.value);
    renderInstrumentAvailability();
  }
  if (["bookingRoom", "bookingDate", "bookingStart", "bookingDuration"].includes(event.target.id)) renderInstrumentAvailability();
});

$("#toggleInstrumentAvailability").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const panel = $("#instrumentAvailability");
  panel.hidden = !panel.hidden;
  button.setAttribute("aria-expanded", String(!panel.hidden));
  button.querySelector("span").textContent = panel.hidden ? "Mostra strumenti disponibili" : "Nascondi strumenti disponibili";
  if (!panel.hidden) renderInstrumentAvailability();
});

bookingForm.addEventListener("submit", handleSubmit);
$("#deleteBookingButton").addEventListener("click", () => {
  const id = $("#bookingId").value;
  if (!id || !window.confirm("Eliminare questa prenotazione?")) return;
  bookings = bookings.filter((booking) => booking.id !== id);
  saveBookings();
  bookingDialog.close();
  renderCalendar();
  renderAvailability();
  renderBookings();
});

$(".close-dialog").addEventListener("click", () => bookingDialog.close());
$(".cancel-dialog").addEventListener("click", () => bookingDialog.close());
bookingDialog.addEventListener("click", (event) => {
  if (event.target === bookingDialog) bookingDialog.close();
});