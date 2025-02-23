
export interface BusinessInfo {
  url: string; //url=link and it is primary key
  name: string;
  address: string;
  phone: string;
  quote: number; //quote is the price of the product
  notes: string; 
}

export interface SellerInfo {
  name: string;
  distance: number;
  productName: string;
  notes: string;
  price: number;
  phone?: string;
}

