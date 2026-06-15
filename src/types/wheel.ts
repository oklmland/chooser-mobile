export interface WheelOption {
  id: string;
  label: string;
}

export interface Wheel {
  id: string;
  name: string;
  options: WheelOption[];
  createdAt: number;
  updatedAt: number;
}
