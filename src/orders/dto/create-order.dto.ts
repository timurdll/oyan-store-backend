import { Language } from '@prisma/client';

export class CreateOrderDto {
  product: {
    productId: number;
    quantity: number;
  }[];
  phoneNumber: string;
  fullName: string;
  email: string;
  address: {
    city: string;
    street: string;
    houseNumber: string;
    entrance?: string;
    apartment: string;
  };
  paymentData: {
    paymentMethod: string[];
  };
  totalAmount: number;
  legalEntityInfo?: {
    companyName: string;
    bin: string;
    companyAddress: string;
    companyPhone: string;
    postalCode: string;
    iik: string;
    bik: string;
    bankName: string;
  };
}

export class QuickPurchaseDto {
  fullName: string;
  phoneNumber: string;
  productId: number;
}

export interface OrderWithTranslations {
  id: number;
  userId: number;
  status: string;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
  phoneNumber: string;
  legalEntityInfo?: string;
  products: {
    id: number;
    quantity: number;
    product: {
      id: number;
      name: string;
      price: number;
      cover_image: string;
      translations: {
        id: number;
        language: Language;
        name: string;
      }[];
    };
  }[];
}
