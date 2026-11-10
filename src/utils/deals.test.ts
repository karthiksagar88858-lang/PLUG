import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRentalBreakEven, filterListings, validateListingForm, CampusListing } from './deals';

test('calculateRentalBreakEven advises rent when total rental is cheaper than purchase', () => {
  // Buy drafter for ₹800 vs rent at ₹5/day for 60 days (₹300)
  const result = calculateRentalBreakEven(800, 5, 60);
  assert.equal(result.recommendation, 'RENT');
  assert.equal(result.totalRentalCost, 300);
  assert.equal(result.savingsAmount, 500);
});

test('calculateRentalBreakEven advises buy when rental exceeds purchase price', () => {
  // Buy cycle for ₹2200 vs rent at ₹25/day for 120 days (₹3000)
  const result = calculateRentalBreakEven(2200, 25, 120);
  assert.equal(result.recommendation, 'BUY');
  assert.equal(result.totalRentalCost, 3000);
  assert.equal(result.savingsAmount, 800);
  assert.equal(result.breakEvenDays, 88);
});

test('filterListings accurately filters by category and search keyword', () => {
  const dummyListings: CampusListing[] = [
    {
      id: '1',
      title: 'Avon Next 21-Speed Bicycle with lock',
      category: 'Cycles & EV',
      price: 2200,
      rentPrice: 25,
      imageUrl: '',
      location: 'Law Gate',
      timeAgo: 'Today',
      isUmsVerified: false,
    },
    {
      id: '2',
      title: '1st Year B.Tech Books Bundle (Maths, BEE,...)',
      category: 'Books & Notes',
      price: 450,
      imageUrl: '',
      location: 'UniMall Basement',
      timeAgo: 'Just now',
      isUmsVerified: true,
    },
  ];

  const searchCycle = filterListings(dummyListings, { searchQuery: 'Bicycle' });
  assert.equal(searchCycle.length, 1);
  assert.equal(searchCycle[0].id, '1');

  const filterBooks = filterListings(dummyListings, { category: 'Books & Notes' });
  assert.equal(filterBooks.length, 1);
  assert.equal(filterBooks[0].id, '2');

  const filterUms = filterListings(dummyListings, { filterType: 'ums' });
  assert.equal(filterUms.length, 1);
  assert.equal(filterUms[0].id, '2');
});

test('validateListingForm requires title length, category and location', () => {
  const invalid = validateListingForm({ title: 'Hi' });
  assert.equal(invalid.isValid, false);
  assert.ok(invalid.errors.title);
  assert.ok(invalid.errors.category);

  const valid = validateListingForm({
    title: 'Casio Scientific Calculator fx-991EX',
    category: 'Lab & Drafters',
    price: 600,
    location: 'BH-4 Boys Hostel',
  });
  assert.equal(valid.isValid, true);
  assert.equal(Object.keys(valid.errors).length, 0);
});

test('validateListingForm requires customCategory when category is Others', () => {
  const invalidOthers = validateListingForm({
    title: 'Yamaha Acoustic Guitar F280',
    category: 'Others',
    price: 4500,
    location: 'GH-2 Girls Hostel',
  });
  assert.equal(invalidOthers.isValid, false);
  assert.ok(invalidOthers.errors.customCategory);

  const validOthers = validateListingForm({
    title: 'Yamaha Acoustic Guitar F280',
    category: 'Others',
    customCategory: 'Guitar',
    price: 4500,
    location: 'GH-2 Girls Hostel',
  });
  assert.equal(validOthers.isValid, true);
  assert.equal(Object.keys(validOthers.errors).length, 0);
});

test('filterListings finds items by customCategory under Others', () => {
  const items: CampusListing[] = [
    {
      id: 'g-1',
      title: 'Yamaha Acoustic Guitar F280 with Padded Bag',
      category: 'Others',
      customCategory: 'Guitar',
      price: 4500,
      imageUrl: '',
      location: 'GH-2',
      timeAgo: 'Just now',
      isUmsVerified: true,
    },
    {
      id: 't-1',
      title: 'Foldable Wooden Study Table for Hostel Bed',
      category: 'Others',
      customCategory: 'Study Table',
      price: 450,
      imageUrl: '',
      location: 'BH-3',
      timeAgo: '2h ago',
      isUmsVerified: true,
    },
  ];

  // Filter by category Others
  const othersList = filterListings(items, { category: 'Others' });
  assert.equal(othersList.length, 2);

  // Search by customCategory 'Guitar'
  const guitarSearch = filterListings(items, { searchQuery: 'Guitar' });
  assert.equal(guitarSearch.length, 1);
  assert.equal(guitarSearch[0].id, 'g-1');

  // Search by customCategory 'Study Table'
  const tableSearch = filterListings(items, { searchQuery: 'Study Table' });
  assert.equal(tableSearch.length, 1);
  assert.equal(tableSearch[0].id, 't-1');
});
