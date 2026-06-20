import { useState } from 'react';

// Legend item
const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-4 h-4 rounded-sm border ${color}`} />
    <span className="text-xs text-gray-500">{label}</span>
  </div>
);

// Individual seat button
const Seat = ({ seatId, isOccupied, isSelected, isExitRow, isExtraLegroom, size, onClick }) => {
  const base = `rounded-sm flex items-center justify-center text-xs font-semibold transition-all duration-150 select-none`;

  let colorClass = '';
  if (isOccupied) {
    colorClass = 'bg-gray-200 border border-gray-300 text-gray-400 cursor-not-allowed';
  } else if (isSelected) {
    colorClass = 'bg-primary-600 border-2 border-primary-700 text-white cursor-pointer shadow-md';
  } else if (isExitRow) {
    colorClass =
      'bg-amber-50 border border-amber-400 text-amber-700 cursor-pointer hover:border-amber-500 hover:bg-amber-100';
  } else if (isExtraLegroom) {
    colorClass =
      'bg-green-50 border border-green-400 text-green-700 cursor-pointer hover:border-green-500 hover:bg-green-100';
  } else {
    colorClass =
      'bg-white border border-gray-300 text-gray-600 cursor-pointer hover:border-primary-400 hover:bg-primary-50';
  }

  const sizeClass =
    size === 'large'
      ? 'w-12 h-12'
      : size === 'medium'
      ? 'w-10 h-10'
      : 'w-7 h-7';

  return (
    <button
      type="button"
      disabled={isOccupied}
      onClick={() => !isOccupied && onClick && onClick(seatId)}
      className={`${base} ${colorClass} ${sizeClass}`}
      title={seatId}
    >
      {isSelected ? '✓' : ''}
    </button>
  );
};

// ── Economy (30 rows × 6 columns A–F) ──────────────────────────────────────
const EconomyMap = ({ seatsData, selectedSeats, onSeatToggle, maxSelectable }) => {
  // Build a lookup: seatId → { isOccupied, isExitRow, isExtraLegroom }
  const seatLookup = {};
  (seatsData || []).forEach((s) => {
    seatLookup[s.seat] = s;
  });

  const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
  const rows = Array.from({ length: 30 }, (_, i) => i + 1);

  const toggleSeat = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      // Deselect
      onSeatToggle(selectedSeats.filter((s) => s !== seatId));
    } else if (selectedSeats.length < maxSelectable) {
      // Select when under limit
      onSeatToggle([...selectedSeats, seatId]);
    } else if (maxSelectable === 1) {
      // Replace the single selection so user can always change their seat
      onSeatToggle([seatId]);
    }
    // When limit > 1 is reached, user must deselect first
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-max">
        {/* Column header */}
        <div className="flex items-center mb-1 pl-8">
          {columns.map((col, i) => (
            <div key={col} className="flex items-center">
              <div className="w-7 text-center text-xs font-bold text-gray-400">{col}</div>
              {i === 2 && <div className="w-6" />}
            </div>
          ))}
        </div>

        {/* Rows */}
        {rows.map((row) => (
          <div key={row} className="flex items-center mb-1">
            {/* Row number */}
            <div className="w-7 text-right pr-1 text-xs text-gray-400 font-medium">{row}</div>

            {/* Seats */}
            {columns.map((col, i) => {
              const seatId = `${row}${col}`;
              const info = seatLookup[seatId] || {};
              return (
                <div key={col} className="flex items-center">
                  <Seat
                    seatId={seatId}
                    isOccupied={info.isOccupied || false}
                    isSelected={selectedSeats.includes(seatId)}
                    isExitRow={info.isExitRow || false}
                    isExtraLegroom={info.isExtraLegroom || false}
                    size="small"
                    onClick={() => toggleSeat(seatId)}
                  />
                  {/* Gap between C and D */}
                  {i === 2 && <div className="w-6" />}
                  {/* Gap between seats */}
                  {i !== 2 && i < 5 && <div className="w-1" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Business (5 rows × 4 seats A–D, 2-2) ──────────────────────────────────
const BusinessMap = ({ seatsData, selectedSeats, onSeatToggle, maxSelectable }) => {
  const seatLookup = {};
  (seatsData || []).forEach((s) => {
    seatLookup[s.seat] = s;
  });

  const columns = ['A', 'B', 'C', 'D'];
  const rows = Array.from({ length: 5 }, (_, i) => i + 1);

  const toggleSeat = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      // Deselect
      onSeatToggle(selectedSeats.filter((s) => s !== seatId));
    } else if (selectedSeats.length < maxSelectable) {
      // Select when under limit
      onSeatToggle([...selectedSeats, seatId]);
    } else if (maxSelectable === 1) {
      // Replace the single selection so user can always change their seat
      onSeatToggle([seatId]);
    }
    // When limit > 1 is reached, user must deselect first
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-max">
        {/* Column header */}
        <div className="flex items-center mb-2 pl-10">
          {columns.map((col, i) => (
            <div key={col} className="flex items-center">
              <div className="w-10 text-center text-xs font-bold text-gray-400">{col}</div>
              {i === 1 && <div className="w-8" />}
            </div>
          ))}
        </div>

        {rows.map((row) => (
          <div key={row} className="flex items-center mb-2">
            <div className="w-8 text-right pr-2 text-xs text-gray-400 font-medium">{row}</div>
            {columns.map((col, i) => {
              const seatId = `${row}${col}`;
              const info = seatLookup[seatId] || {};
              return (
                <div key={col} className="flex items-center">
                  <Seat
                    seatId={seatId}
                    isOccupied={info.isOccupied || false}
                    isSelected={selectedSeats.includes(seatId)}
                    isExitRow={info.isExitRow || false}
                    isExtraLegroom={info.isExtraLegroom || false}
                    size="medium"
                    onClick={() => toggleSeat(seatId)}
                  />
                  {i === 1 && <div className="w-8" />}
                  {i !== 1 && i < 3 && <div className="w-1.5" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── First class (3 rows × 3 pods A-C-F) ────────────────────────────────────
const FirstMap = ({ seatsData, selectedSeats, onSeatToggle, maxSelectable }) => {
  const seatLookup = {};
  (seatsData || []).forEach((s) => {
    seatLookup[s.seat] = s;
  });

  const columns = ['A', 'C', 'F'];
  const rows = Array.from({ length: 3 }, (_, i) => i + 1);

  const toggleSeat = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      // Deselect
      onSeatToggle(selectedSeats.filter((s) => s !== seatId));
    } else if (selectedSeats.length < maxSelectable) {
      // Select when under limit
      onSeatToggle([...selectedSeats, seatId]);
    } else if (maxSelectable === 1) {
      // Replace the single selection so user can always change their seat
      onSeatToggle([seatId]);
    }
    // When limit > 1 is reached, user must deselect first
  };

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-max">
        {/* Column header */}
        <div className="flex items-center mb-2 pl-10">
          {columns.map((col, i) => (
            <div key={col} className="flex items-center">
              <div className="w-12 text-center text-xs font-bold text-gray-400">{col}</div>
              {i === 0 && <div className="w-8" />}
            </div>
          ))}
        </div>

        {rows.map((row) => (
          <div key={row} className="flex items-center mb-3">
            <div className="w-8 text-right pr-2 text-xs text-gray-400 font-medium">{row}</div>
            {columns.map((col, i) => {
              const seatId = `${row}${col}`;
              const info = seatLookup[seatId] || {};
              return (
                <div key={col} className="flex items-center">
                  <Seat
                    seatId={seatId}
                    isOccupied={info.isOccupied || false}
                    isSelected={selectedSeats.includes(seatId)}
                    isExitRow={info.isExitRow || false}
                    isExtraLegroom={info.isExtraLegroom || false}
                    size="large"
                    onClick={() => toggleSeat(seatId)}
                  />
                  {i === 0 && <div className="w-8" />}
                  {i === 1 && <div className="w-2" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main SeatMap component ──────────────────────────────────────────────────
const SeatMap = ({ seatClass = 'economy', seats = [], selectedSeats = [], onSeatToggle, maxSelectable = 1 }) => {
  const classLabel =
    seatClass === 'business'
      ? 'Business Class'
      : seatClass === 'first'
      ? 'First Class'
      : 'Economy Class';

  const MapComponent =
    seatClass === 'business'
      ? BusinessMap
      : seatClass === 'first'
      ? FirstMap
      : EconomyMap;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{classLabel} Seat Map</h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          {selectedSeats.length}/{maxSelectable} selected
        </span>
      </div>

      {/* Cabin diagram */}
      <div className="bg-gray-50 rounded-xl p-4 overflow-auto max-h-96">
        {/* Nose of plane */}
        <div className="flex justify-center mb-3">
          <div className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200">
            ✈ Front of Aircraft
          </div>
        </div>

        <div className="flex justify-center">
          <MapComponent
            seatsData={seats}
            selectedSeats={selectedSeats}
            onSeatToggle={onSeatToggle}
            maxSelectable={maxSelectable}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        <LegendItem color="bg-white border-gray-300" label="Available" />
        <LegendItem color="bg-primary-600 border-primary-700" label="Selected" />
        <LegendItem color="bg-gray-200 border-gray-300" label="Occupied" />
        <LegendItem color="bg-amber-50 border-amber-400" label="Exit Row" />
        <LegendItem color="bg-green-50 border-green-400" label="Extra Legroom" />
      </div>

      {/* Selected seats display */}
      {selectedSeats.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-gray-600">Selected:</span>
          {selectedSeats.map((s) => (
            <span
              key={s}
              className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {selectedSeats.length >= maxSelectable && (
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
          Maximum seats selected. Deselect a seat to choose a different one.
        </p>
      )}
    </div>
  );
};

export default SeatMap;
