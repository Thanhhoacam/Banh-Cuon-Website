// Firebase Auth types
export type User = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

// Food types
export type Food = {
  _id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  category?: string;
  isBestSeller?: boolean;
  description?: string;
  imageUrl?: string;
};

export type FirestoreFood = {
  name: string;
  price: number;
  isAvailable: boolean;
  category?: string;
  isBestSeller?: boolean;
  description?: string;
  imageUrl?: string;
};

// Order types
export type Order = {
  _id: string;
  tableNumber: number;
  status: "pending" | "preparing" | "done" | "paid" | "cancelled";
  total: number;
  items: OrderItem[];
  note?: string;
  createdAt: number;
};

export type OrderItem = {
  food: string; // food ID
  quantity: number;
  price: number;
};

export type FirestoreOrder = {
  tableNumber: number;
  status: "pending" | "preparing" | "done" | "paid" | "cancelled";
  total: number;
  items: OrderItem[];
  note?: string;
  createdAt: number;
};

// Payment types
export type Payment = {
  _id: string;
  tableNumber: number;
  items: OrderItem[];
  totalAmount: number;
  method?: "cash" | "card" | "momo" | "zalo";
  status: "paid";
  createdAt: number;
  orderIds: string[];
};

export type FirestorePayment = {
  tableNumber: number;
  items: OrderItem[];
  totalAmount: number;
  status: "paid";
  createdAt: number;
  orderIds: string[];
};

// Table types
export type Table = {
  _id: string;
  number: number;
  isOccupied: boolean;
  createdAt: number;
};

export type FirestoreTable = {
  number: number;
  isOccupied: boolean;
  createdAt: number;
};

// Stats types
export type StatsResponse = {
  daily: { _id: string; revenue: number }[];
  weeklyAvg?: { _id: number; avgCount: number }[];
  totalRevenue: number;
  totalOrders: number;
};

export type DailyRevenue = {
  date: string;
  revenue: number;
};

// Cart types
export type CartItem = {
  id: string;
  q: number;
  food: Food;
};

// Category types
export type Category = {
  _id: string;
  name: string;
  createdAt: number;
};

export type FirestoreCategory = {
  name: string;
  createdAt: number;
};

// API Response types
export type ApiResponse<T> = {
  data: T;
  success: boolean;
  message?: string;
};
