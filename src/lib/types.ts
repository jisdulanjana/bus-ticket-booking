export type Bus = {
  id: string;
  name: string;
  seat_count: number;
  layout: { rows: number; cols: number; seats: string[] };
};

export type Trip = {
  id: string;
  origin: string;
  destination: string;
  depart_at: string;
  price_cents: number;
  status: string;
  buses: Bus;
};

export type SeatsResponse = {
  trip_id: string;
  layout: { layout: Bus["layout"]; seat_count: number };
  taken_seats: string[];
};

export type Booking = {
  id: string;
  trip_id: string;
  customer_name: string;
  email: string;
  amount_cents: number;
  status: "pending" | "paid" | "expired" | "cancelled";
  hold_expires_at: string;
  created_at: string;
  booking_seats: { seat_no: string }[];
};

export function formatLkr(cents: number) {
  return `Rs. ${(cents / 100).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`;
}
