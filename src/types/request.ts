export interface RequestCartItem {
  id: string;
  nacCode: string;
  itemName: string;
  requestQuantity: number;
  partNumber: string;
  equipmentNumber: string;
  specifications: string;
  image?: File;
  unit: string;
}

export interface RequestData {
  requestDate: string;
  requestNumber: string;
  items: {
    nacCode: string;
    partNumber: string;
    itemName: string;
    requestQuantity: number;
    equipmentNumber: string;
    specifications: string;
  }[];
  remarks: string;
  requestedBy: string;
} 