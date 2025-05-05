export interface ReceiveCartItem {
  id: string;
  nacCode: string;
  itemName: string;
  receiveQuantity: number;
  partNumber: string;
  equipmentNumber: string;
  location: string;
  cardNumber: string;
  image: File | undefined;
  unit: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: Date;
  requestedQuantity: number;
  isLocationChanged: boolean;
  isCardNumberChanged: boolean;
}

export interface ReceiveData {
  receiveDate: string;
  receiveNumber: string;
  remarks: string;
  receivedBy: string;
  items: {
    nacCode: string;
    partNumber: string;
    itemName: string;
    receiveQuantity: number;
    equipmentNumber: string;
    imagePath: string;
    unit: string;
    supplierName: string;
    invoiceNumber: string;
    invoiceDate: string;
  }[];
} 