// Garment price list (in INR)
const GARMENT_PRICES = {
  SHIRT: { name: 'Shirt', price: 40 },
  PANTS: { name: 'Pants', price: 50 },
  SAREE: { name: 'Saree', price: 120 },
  SUIT: { name: 'Suit', price: 200 },
  JACKET: { name: 'Jacket', price: 150 },
  KURTA: { name: 'Kurta', price: 60 },
  LEHENGA: { name: 'Lehenga', price: 250 },
  BLANKET: { name: 'Blanket', price: 180 },
  BEDSHEET: { name: 'Bedsheet', price: 100 },
  CURTAIN: { name: 'Curtain', price: 80 },
  DRESS: { name: 'Dress', price: 90 },
  COAT: { name: 'Coat', price: 175 },
  SWEATER: { name: 'Sweater', price: 70 },
  DUPATTA: { name: 'Dupatta', price: 45 },
  TIE: { name: 'Tie', price: 30 },
};

const ORDER_STATUSES = {
  RECEIVED: 'RECEIVED',
  PROCESSING: 'PROCESSING',
  READY: 'READY',
  DELIVERED: 'DELIVERED',
};

// Status flow — only valid transitions allowed
const VALID_STATUS_TRANSITIONS = {
  RECEIVED: ['PROCESSING'],
  PROCESSING: ['READY'],
  READY: ['DELIVERED'],
  DELIVERED: [],
};

// Estimated delivery days from order creation
const ESTIMATED_DELIVERY_DAYS = 3;

module.exports = {
  GARMENT_PRICES,
  ORDER_STATUSES,
  VALID_STATUS_TRANSITIONS,
  ESTIMATED_DELIVERY_DAYS,
};
