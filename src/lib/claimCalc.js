// Claim Value Estimator — calculation logic
// Upper-end bias documented per business directive

export const STATE_FACTORS = {
  AL:0.92,AK:1.05,AZ:0.98,AR:0.88,CA:1.22,CO:1.08,CT:1.15,DE:1.10,FL:1.05,GA:1.00,
  HI:1.12,ID:0.90,IL:1.10,IN:0.92,IA:0.88,KS:0.90,KY:0.91,LA:0.98,ME:0.95,MD:1.12,
  MA:1.18,MI:1.05,MN:1.05,MS:0.85,MO:0.93,MT:0.90,NE:0.92,NV:1.08,NH:1.05,NJ:1.18,
  NM:0.93,NY:1.25,NC:0.95,ND:0.88,OH:0.97,OK:0.90,OR:1.05,PA:1.08,RI:1.10,SC:0.93,
  SD:0.88,TN:0.92,TX:1.03,UT:0.95,VT:1.00,VA:1.05,WA:1.10,WV:0.88,WI:0.97,WY:0.87,DC:1.20
};

export const INJURY_MULTIPLIERS = {
  minor:     { low: 1.0, high: 1.5 },
  moderate:  { low: 1.5, high: 2.5 },
  serious:   { low: 2.5, high: 3.5 },
  severe:    { low: 3.5, high: 5.0 },
  catastrophic: { low: 5.0, high: 7.0 },
};

export const FAULT_MODIFIERS = {
  yes:       1.00,
  partially: 0.70,
  no:        0.35,
};

export const ONGOING_MEDICAL = {
  yes:    18000,
  unsure:  9000,
  no:         0,
};

// Upper-end bias multipliers (documented)
const REPRESENTED_BOOST = 1.18; // Represented claimants settle ~1.18x higher
const LOW_BIAS = 1.05;

export function calculateEstimate({ medical_bills, missed_work_days, ongoing_treatment, injury_severity, state, fault }) {
  const stateFactor = STATE_FACTORS[state] || 1.0;
  const faultMod = FAULT_MODIFIERS[fault] || 1.0;
  const mult = INJURY_MULTIPLIERS[injury_severity] || INJURY_MULTIPLIERS.moderate;
  const futureMedical = ONGOING_MEDICAL[ongoing_treatment] || 0;

  const economic = (medical_bills || 0) + ((missed_work_days || 0) * 300) + futureMedical;
  const nonEcoLow = economic * mult.low;
  const nonEcoHigh = economic * mult.high;

  const rawLow  = (economic + nonEcoLow)  * stateFactor * faultMod;
  const rawHigh = (economic + nonEcoHigh) * stateFactor * faultMod;

  // Apply upper-end bias
  const displayLow  = Math.round((rawLow  * LOW_BIAS)         / 100) * 100;
  const displayHigh = Math.round((rawHigh * REPRESENTED_BOOST) / 100) * 100;

  // Insurance lowball anchor (typically 22-28% of represented value)
  const insuranceOffer = Math.round((displayHigh * 0.25) / 100) * 100;

  return { displayLow, displayHigh, economic, insuranceOffer, stateFactor, faultMod };
}

export function formatMoney(n) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
}