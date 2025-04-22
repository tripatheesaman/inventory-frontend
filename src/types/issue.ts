export interface IssueItem {
  id: string; // Unique ID for the cart item
  nacCode: string;
  itemName: string;
  quantity: number;
  equipmentNumber: string;
  currentBalance: number;
  partNumber: string;
}

export interface IssueCartItem extends IssueItem {
  selectedEquipment: string;
  issueQuantity: number;
}

export interface IssueRequest {
  issueDate: string; // ISO date string
  items: {
    nacCode: string;
    quantity: number;
    equipmentNumber: string;
    partNumber: string;
  }[];
  issuedBy: {
    name: string;
    staffId: string;
  };
}

export interface EquipmentSuggestion {
  value: string;
  label: string;
} 