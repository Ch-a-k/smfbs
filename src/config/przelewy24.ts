export type P24Environment = 'sandbox' | 'production';

interface Przelewy24Config {
  merchantId: string;
  posId: string;
  apiKey: string;
  crcKey: string;
  environment: P24Environment;
  baseUrl: string;
}

const config: Przelewy24Config = {
  merchantId: process.env.P24_MERCHANT_ID || '',
  posId: process.env.P24_POS_ID || '',
  apiKey: process.env.P24_API_KEY || '',
  crcKey: process.env.P24_CRC_KEY || '',
  environment: (process.env.P24_ENVIRONMENT as P24Environment) || 'sandbox',
  baseUrl: process.env.P24_ENVIRONMENT === 'production' 
    ? 'https://secure.przelewy24.pl' 
    : 'https://sandbox.przelewy24.pl',
};

export default config; 