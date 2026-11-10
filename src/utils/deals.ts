export interface ProductRating {
  userId: string;
  userName: string;
  rating: number; // 1 to 5
  review?: string;
  createdAt: string;
}

export interface CampusListing {
  id: string;
  title: string;
  category: string; // 'Cycles & EV' | 'Books & Notes' | 'Lab & Drafters' | 'Hostel & PG' | 'Mobiles & Tech' | 'Gym & Sports'
  price: number;
  rentPrice?: number;
  rentPeriod?: 'day' | 'mo' | 'week';
  badge?: string; // 'BUY / RENT' | 'BUNDLE' | 'HOSTEL FIT' | 'FOR RENT' | 'PG READY' | 'FOR SALE'
  badgeColor?: 'yellow' | 'dark' | 'emerald';
  imageUrl: string;
  location: string;
  timeAgo: string;
  isUmsVerified: boolean;
  sellerName?: string;
  sellerReg?: string;
  sellerBranch?: string;
  description?: string;
  specs?: string[];
  depositAmount?: number;
  sellerId?: string;
  sellerAvatar?: string;
  sellerPhone?: string;
  sellerUpiId?: string; // e.g. yourname@upi
  sellerUpiApp?: 'googlepay' | 'phonepe' | 'paytm' | 'other';
  sellerQrScannerUrl?: string; // QR code image/snapshot for PhonePe / Google Pay
  type?: 'sale' | 'rent' | 'hostel' | 'both';
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
  ratings?: ProductRating[];
  averageRating?: number;
  totalRatingsCount?: number;
  customCategory?: string; // Specific item type when category is 'Others' (e.g. Guitar, Study Table)
  status?: 'active' | 'sold' | 'rented'; // Listing status (default: 'active')
}

export interface RentalEconomics {
  totalRentalCost: number;
  buyPrice: number;
  breakEvenDays: number;
  recommendation: 'RENT' | 'BUY';
  savingsAmount: number;
  advice: string;
}

/**
 * Calculates whether renting or buying is more economical for a student's semester duration.
 * Average semester in LPU is roughly 120 days of active instruction.
 */
export function calculateRentalBreakEven(
  buyPrice: number,
  dailyRentRate: number,
  durationDays: number = 90
): RentalEconomics {
  if (buyPrice <= 0 || dailyRentRate <= 0) {
    return {
      totalRentalCost: 0,
      buyPrice,
      breakEvenDays: 0,
      recommendation: 'BUY',
      savingsAmount: 0,
      advice: 'Invalid pricing parameters.',
    };
  }

  const totalRentalCost = dailyRentRate * durationDays;
  const breakEvenDays = Math.ceil(buyPrice / dailyRentRate);

  if (totalRentalCost < buyPrice) {
    return {
      totalRentalCost,
      buyPrice,
      breakEvenDays,
      recommendation: 'RENT',
      savingsAmount: buyPrice - totalRentalCost,
      advice: `Renting for ${durationDays} days costs ₹${totalRentalCost}, saving ₹${buyPrice - totalRentalCost} compared to buying upfront. Ideal for 1-semester courses like EG-101.`,
    };
  } else {
    return {
      totalRentalCost,
      buyPrice,
      breakEvenDays,
      recommendation: 'BUY',
      savingsAmount: totalRentalCost - buyPrice,
      advice: `Buying at ₹${buyPrice} is better than renting beyond ${breakEvenDays} days (₹${totalRentalCost} total rent). You can resell on PLUG at semester end!`,
    };
  }
}

export interface FilterCriteria {
  category?: string;
  searchQuery?: string;
  filterType?: 'all' | 'sale' | 'rent' | 'hostel' | 'ums';
  location?: string;
}

/**
 * Pure filter logic for campus listings
 */
export function filterListings(
  listings: CampusListing[],
  criteria: FilterCriteria
): CampusListing[] {
  return listings.filter((item) => {
    // Category filter
    if (criteria.category && criteria.category !== 'All' && item.category !== criteria.category) {
      return false;
    }

    // Filter tab (All, For Sale, Rentals, Hostel & PG, UMS)
    if (criteria.filterType === 'sale' && !item.price) {
      return false;
    }
    if (criteria.filterType === 'rent' && (!item.rentPrice || item.rentPrice <= 0)) {
      return false;
    }
    if (criteria.filterType === 'hostel' && item.category !== 'Hostel & PG' && item.type !== 'hostel') {
      return false;
    }
    if (criteria.filterType === 'ums' && !item.isUmsVerified) {
      return false;
    }

    // Location filter
    if (criteria.location && criteria.location !== 'All Campus' && !item.location.toLowerCase().includes(criteria.location.toLowerCase())) {
      return false;
    }

    // Search query
    if (criteria.searchQuery && criteria.searchQuery.trim().length > 0) {
      const q = criteria.searchQuery.toLowerCase().trim();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchCustomCategory = item.customCategory?.toLowerCase().includes(q) ?? false;
      const matchLocation = item.location.toLowerCase().includes(q);
      const matchSpecs = item.specs?.some(s => s.toLowerCase().includes(q)) ?? false;
      return matchTitle || matchCategory || matchCustomCategory || matchLocation || matchSpecs;
    }

    return true;
  });
}

/**
 * Validates new student listing post
 */
export function validateListingForm(data: Partial<CampusListing>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  if (!data.title || data.title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters long.';
  }

  if (!data.category) {
    errors.category = 'Please choose a category.';
  } else if (data.category === 'Others' && (!data.customCategory || data.customCategory.trim().length === 0)) {
    errors.customCategory = 'Please enter the item category or item name (e.g. Guitar, Study Table).';
  }

  if (data.price !== undefined && data.price <= 0 && (!data.rentPrice || data.rentPrice <= 0)) {
    errors.price = 'Please set either a valid purchase price or daily rental rate.';
  }

  if (!data.location || data.location.trim().length === 0) {
    errors.location = 'Please specify a campus pickup location (e.g. UniMall, BH-4).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
