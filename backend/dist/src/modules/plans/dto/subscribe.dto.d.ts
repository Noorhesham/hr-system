export declare class SubscribeDto {
    planId: string;
    billingCycle: 'MONTHLY' | 'ANNUAL';
    cardHolderName: string;
    cardNumber: string;
    cvv: string;
    expiry: string;
    billingAddress: string;
    city: string;
    postalCode: string;
    country: string;
    promoCode?: string;
    savePaymentMethod?: boolean;
}
