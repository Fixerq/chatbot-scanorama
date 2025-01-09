import { PricingPlansData } from '@/types/pricing';

export const pricingPlans: PricingPlansData = {
  starter: {
    name: "Starter",
    price: "$9",
    description: "Perfect for trying out our service",
    features: [
      "5 searches per month",
      "Basic chat detection",
      "Email support"
    ],
    priceId: "price_1QfP4KEiWhAkWDnrNXFYWR9L"
  },
  pro: {
    name: "Pro",
    price: "$297",
    description: "For businesses that need more",
    features: [
      "5000 searches per month",
      "Advanced chat detection",
      "Priority support"
    ],
    priceId: "price_1QfP3LEiWhAkWDnrTYVVFBk9",
    popular: true
  },
  founders: {
    name: "Founders",
    price: "$97",
    description: "Limited time offer",
    features: [
      "Lifetime access",
      "All Pro features",
      "Early access to new features"
    ],
    priceId: "price_1QfP20EiWhAkWDnrDhllA5a1",
    special: true
  }
};