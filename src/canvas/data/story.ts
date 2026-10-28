// Who the player is helping and what they're booking. Change these and every
// level, message and generated snippet follows.

export const PERSONA = {
  name: 'Raj',
  city: 'Indore',
  userId: 42,
  sid: '8f3a'
};

export const TRIP = {
  site: 'railkhidki.in',
  brand: 'RailKhidki',
  train: 'Avantika Express',
  from: 'Indore',
  to: 'Mumbai',
  coach: 'B2',
  fare: 1845
};

// AC 3-tier bay layout: 8 berths per bay
export const BERTH_TYPES = ['Lower', 'Middle', 'Upper', 'Lower', 'Middle', 'Upper', 'Side lower', 'Side upper'];
export const berthType = (berth: string) => BERTH_TYPES[(Number(berth) - 1) % 8];
export const BERTHS_TAKEN = new Set(['2', '3', '6', '8', '10', '15']);
export const DEFAULT_BERTH = '12';

// Indian digit grouping: 1,20,000 and 21 crore
export const inr = (n: number) => Math.round(n).toLocaleString('en-IN');
export const inrWords = (n: number) =>
  n >= 1e7 ? `${+(n / 1e7).toFixed(1)} crore` : n >= 1e5 ? `${+(n / 1e5).toFixed(1)} lakh` : inr(n);
