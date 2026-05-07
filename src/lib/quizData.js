export const CAC_QUIZ_STEPS = [
  {
    id: "accident_type",
    type: "single_select",
    question: "What type of accident were you involved in?",
    options: [
      { label: "Car Accident", value: "car", icon: "Car" },
      { label: "Truck Accident", value: "truck", icon: "Truck" },
      { label: "Motorcycle Accident", value: "motorcycle", icon: "Bike" },
      { label: "Slip & Fall", value: "slip_fall", icon: "AlertTriangle" },
      { label: "Work Accident", value: "work", icon: "HardHat" },
      { label: "Medical Malpractice", value: "medical", icon: "Stethoscope" },
      { label: "Other", value: "other", icon: "HelpCircle" },
    ],
  },
  {
    id: "state",
    type: "state_select",
    question: "In which state did the accident occur?",
  },
  {
    id: "at_fault",
    type: "single_select",
    question: "Were you at fault for the accident?",
    options: [
      { label: "No, the other party was at fault", value: "no" },
      { label: "Partially at fault", value: "partial" },
      { label: "Yes, I was at fault", value: "yes", dq_flag: "hard_dq" },
      { label: "I'm not sure", value: "unsure" },
    ],
  },
  {
    id: "injury_severity",
    type: "single_select",
    question: "How severe were your injuries?",
    options: [
      { label: "Minor (bruises, small cuts)", value: "minor" },
      { label: "Moderate (broken bones, sprains)", value: "moderate" },
      { label: "Severe (hospitalization required)", value: "severe" },
      { label: "Life-threatening / permanent disability", value: "critical" },
      { label: "No injuries", value: "none", dq_flag: "hard_dq" },
    ],
  },
  {
    id: "medical_treatment",
    type: "single_select",
    question: "Have you received medical treatment?",
    options: [
      { label: "Yes, currently in treatment", value: "current" },
      { label: "Yes, treatment completed", value: "completed" },
      { label: "No, but I plan to", value: "planned" },
      { label: "No, and I don't plan to", value: "none", dq_flag: "soft_dq" },
    ],
  },
  {
    id: "time_since_accident",
    type: "single_select",
    question: "How long ago did the accident happen?",
    options: [
      { label: "Less than 1 month", value: "under_1m" },
      { label: "1-6 months", value: "1_6m" },
      { label: "6-12 months", value: "6_12m" },
      { label: "1-2 years", value: "1_2y" },
      { label: "More than 2 years", value: "over_2y", dq_flag: "soft_dq" },
    ],
  },
  {
    id: "contact",
    type: "contact_form",
    question: "Great news! You may qualify for compensation. Enter your details to get started.",
  },
];

export const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","District of Columbia"
];