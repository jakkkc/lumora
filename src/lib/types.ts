export type ListingImage = {
  path: string;
  alt: string | null;
  sort_order: number;
  is_cover: boolean;
};

export type Property = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  description: string | null;
  area: string | null;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  price_per_night: number;
  cleaning_fee: number;
  currency: string;
  min_nights: number;
  check_in_time: string;
  check_out_time: string;
  amenities: string[];
  house_rules: string | null;
  featured: boolean;
  listing_images: ListingImage[];
};

export type Vehicle = {
  id: string;
  slug: string;
  title: string;
  make: string | null;
  model: string | null;
  year: number | null;
  category: string | null;
  tagline: string | null;
  description: string | null;
  seats: number;
  transmission: "automatic" | "manual";
  fuel: string | null;
  price_per_day: number;
  driver_option: "self_drive" | "with_driver" | "both";
  driver_fee_per_day: number;
  deposit: number;
  currency: string;
  features: string[];
  featured: boolean;
  listing_images: ListingImage[];
};
