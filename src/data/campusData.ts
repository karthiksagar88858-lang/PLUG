import { CampusListing } from '../utils/deals';

export interface CampusCategory {
  id: string;
  name: string;
  sub: string;
  iconName: string;
  tag?: string;
}

export const CATEGORIES: CampusCategory[] = [
  {
    id: 'cycles',
    name: 'Cycles & EV',
    sub: 'Block Commute',
    iconName: 'Bike',
  },
  {
    id: 'books',
    name: 'Books & Notes',
    sub: 'B.Tech / MBA / Law',
    iconName: 'BookOpen',
  },
  {
    id: 'lab',
    name: 'Lab & Drafters',
    sub: 'EG & Chemistry',
    iconName: 'Compass',
    tag: '₹10/D',
  },
  {
    id: 'hostel',
    name: 'Hostel & PG',
    sub: 'Coolers / Induction',
    iconName: 'Bed',
  },
  {
    id: 'tech',
    name: 'Mobiles & Tech',
    sub: 'Laptops / Sci-Calcs',
    iconName: 'Laptop',
  },
  {
    id: 'sports',
    name: 'Gym & Sports',
    sub: 'Badminton / Kits',
    iconName: 'Dumbbell',
  },
  {
    id: 'others',
    name: 'Others',
    sub: 'Anything Else',
    iconName: 'MoreHorizontal',
  },
];

export interface RentalItem {
  id: string;
  title: string;
  sub: string;
  ratePerDay: number;
  imageUrl: string;
  deposit: number;
  availableAt: string;
}

export const DAILY_RENTALS: RentalItem[] = [];

// Empty initial listings: Only items posted by real users are displayed
export const INITIAL_LISTINGS: CampusListing[] = [];


export const CAMPUS_LOCATIONS = [
  'All Campus & Law Gate',
  'UniMall & Food Court',
  'Law Gate Market',
  'BH-1 to BH-4 (Boys Hostels)',
  'BH-5 to BH-8 (Boys Hostels)',
  'GH-1 to GH-4 (Girls Hostels)',
  'Block 28 & 34 (Labs)',
  'Deep Nagar PG Area',
  'Green Valley PG Area',
];

// Real database chats: Zero mock conversations
export const MOCK_CHATS: any[] = [];

