// Types for predefined extra fees
export interface ExtraFee {
  id: string;
  label: string;
  price: number;
  enabled: boolean;
  unit?: string; // Optional unit for fees like fuel (per liter)
}

// Types for custom extra fees
export interface CustomFee {
  id: string;
  label: string;
  price: number;
}

// Types for all extra fees
export interface ExtraFees {
  predefined: ExtraFee[];
  custom: CustomFee[];
}