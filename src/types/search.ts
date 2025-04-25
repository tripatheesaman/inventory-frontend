export interface SearchResult {
  id: number;
  nacCode: string;
  itemName: string;
  partNumber: string;
  equipmentNumber: string;
  currentBalance: number;
  location: string;
  cardNumber: string;
  unit?: string;
  imageUrl?: string;
  altText?: string;
  openQuantity?: number;
  openAmount?: number;
} 