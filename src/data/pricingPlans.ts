import { PricingPlansData } from '@/types/pricing';

export const pricingPlans: PricingPlansData = {
  starter: {
    name: "Starter",
    price: "$97",
    description: "Perfect for small businesses and solo entrepreneurs looking to get started with chatbot prospecting",
    features: [
      "500 Website Searches",
      "Local Business Discovery",
      "Basic Analytics",
      "CSV Uploads",
      "Email Support"
    ],
    priceId: "price_1QfP4KEiWhAkWDnrNXFYWR9L"
  },
  pro: {
    name: "Premium",
    price: "$297",
    description: "The ultimate plan for enterprises and agencies with high-volume prospecting needs",
    features: [
      "5000 Website Searches",
      "Comprehensive Analytics",
      "Global Business Discovery",
      "CSV Uploads",
      "Priority Support"
    ],
    priceId: "price_1QfP3LEiWhAkWDnrTYVVFBk9",
    popular: true
  },
  founders: {
    name: "Founders",
    price: "$97",
    description: "Limited time offer",
    features: [
      "Unlimited searches",
      "All Premium features",
      "Comprehensive Analytics",
      "Global Business Discovery",
      "CSV Uploads",
      "Priority Support",
      "Early access to new features"
    ],
    priceId: "price_1QfP20EiWhAkWDnrDhllA5a1",
    special: true
  }
};