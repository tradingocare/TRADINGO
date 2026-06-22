export interface StateData {
  id: string;
  name: string;
  citiesCovered: number;
  productsListed: number;
  activeSellers: number;
  activeBuyers: number;
  rfqsPosted: number;
  ordersCompleted: number;
  tradeVolume: number;
  verifiedCompanies: number;
  topIndustries: string[];
  majorCities: string[];
  categories: string[];
  trendingCategories: string[];
  image?: string;
  servicesCount: number;
  heroImage: string | null;
}

export interface DashboardStats {
  totalStates: number;
  totalCities: number;
  activeBuyers: number;
  activeSellers: number;
  productsListed: number;
  rfqsPosted: number;
  ordersCompleted: number;
  totalTradeVolume: number;
  verifiedCompanies: number;
  categoriesAvailable: number;
  activeIndustries: number;
  newBusinessesAdded: number;
}

export interface IndiaIntelligence {
  manufacturingHotspots: { name: string; value: string; trend: 'up' | 'down' | 'stable' }[];
  fastestGrowingStates: { name: string; growth: string; rank: number }[];
  trendingIndustries: { name: string; momentum: string; direction: 'up' | 'down' }[];
  topCategories: { name: string; count: number }[];
  mostActiveRegions: { name: string; activity: string }[];
  emergingOpportunities: { name: string; potential: string }[];
}

export const dashboardStats: DashboardStats = {
  totalStates: 36,
  totalCities: 2900,
  activeBuyers: 520000,
  activeSellers: 130000,
  productsListed: 10000000,
  rfqsPosted: 340000,
  ordersCompleted: 892340,
  totalTradeVolume: 28400000000,
  verifiedCompanies: 98500,
  categoriesAvailable: 1248,
  activeIndustries: 48,
  newBusinessesAdded: 12560,
};

export const statesData: StateData[] = [
  { id: 'AP', name: 'Andhra Pradesh', citiesCovered: 189, productsListed: 78200, activeSellers: 5670, activeBuyers: 12890, rfqsPosted: 21400, ordersCompleted: 41200, tradeVolume: 987600000, verifiedCompanies: 4230, topIndustries: ['Automobile', 'Textiles', 'Food Processing', 'Pharmaceuticals'], majorCities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool'], categories: ['Auto Parts', 'Textiles', 'Food Products', 'Pharma'], trendingCategories: ['Auto Parts', 'Pharma', 'Processed Foods'], servicesCount: 27400, heroImage: null },
  { id: 'AR', name: 'Arunachal Pradesh', citiesCovered: 24, productsListed: 4200, activeSellers: 890, activeBuyers: 2340, rfqsPosted: 3800, ordersCompleted: 7200, tradeVolume: 45600000, verifiedCompanies: 560, topIndustries: ['Agriculture', 'Handicrafts', 'Food Processing'], majorCities: ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang'], categories: ['Agricultural Produce', 'Handicrafts', 'Organic Products'], trendingCategories: ['Organic Products', 'Handicrafts'], servicesCount: 1500, heroImage: null },
  { id: 'AS', name: 'Assam', citiesCovered: 56, productsListed: 34500, activeSellers: 4120, activeBuyers: 9870, rfqsPosted: 15600, ordersCompleted: 29800, tradeVolume: 234500000, verifiedCompanies: 2890, topIndustries: ['Agriculture', 'Textiles', 'Food Processing', 'Handicrafts'], majorCities: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Tezpur'], categories: ['Tea', 'Silk', 'Agricultural Produce', 'Handicrafts'], trendingCategories: ['Tea Exports', 'Silk Products', 'Organic Tea'], servicesCount: 12100, heroImage: 'https://images.unsplash.com/photo-1566378246595-4a3d82e5e4d6?w=150&h=150&fit=crop' },
  { id: 'BR', name: 'Bihar', citiesCovered: 98, productsListed: 56700, activeSellers: 6780, activeBuyers: 15670, rfqsPosted: 24500, ordersCompleted: 47800, tradeVolume: 567800000, verifiedCompanies: 5120, topIndustries: ['Agriculture', 'Food Processing', 'Textiles', 'MSME'], majorCities: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia'], categories: ['Agricultural Produce', 'Food Products', 'Textiles', 'Handicrafts'], trendingCategories: ['Food Processing', 'Textiles', 'Handicrafts'], servicesCount: 19800, heroImage: 'https://images.unsplash.com/photo-1590080874088-eec0e5e1b7d4?w=150&h=150&fit=crop' },
  { id: 'CH', name: 'Chandigarh', citiesCovered: 1, productsListed: 8900, activeSellers: 1560, activeBuyers: 3890, rfqsPosted: 6200, ordersCompleted: 12400, tradeVolume: 178900000, verifiedCompanies: 1340, topIndustries: ['Electronics', 'IT Services', 'Pharmaceuticals'], majorCities: ['Chandigarh'], categories: ['Electronics', 'Software', 'Pharma'], trendingCategories: ['IT Services', 'Electronics'], servicesCount: 3100, heroImage: null },
  { id: 'CG', name: 'Chhattisgarh', citiesCovered: 42, productsListed: 28900, activeSellers: 3450, activeBuyers: 7890, rfqsPosted: 12400, ordersCompleted: 23400, tradeVolume: 345600000, verifiedCompanies: 2670, topIndustries: ['Steel', 'Chemicals', 'Construction', 'Agriculture'], majorCities: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg'], categories: ['Steel', 'Chemicals', 'Construction Materials', 'Agricultural'], trendingCategories: ['Steel', 'Construction Materials', 'Chemicals'], servicesCount: 10100, heroImage: null },
  { id: 'DL', name: 'Delhi', citiesCovered: 11, productsListed: 234000, activeSellers: 18900, activeBuyers: 45600, rfqsPosted: 67800, ordersCompleted: 134500, tradeVolume: 4567000000, verifiedCompanies: 15670, topIndustries: ['Electronics', 'Textiles', 'Automobile', 'Pharmaceuticals', 'IT Services'], majorCities: ['New Delhi', 'Dwarka', 'Rohini', 'Saket', 'Karol Bagh'], categories: ['Electronics', 'Garments', 'Auto Parts', 'Pharma', 'IT Solutions'], trendingCategories: ['Electronics', 'IT Solutions', 'Auto Parts'], servicesCount: 81900, heroImage: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=150&h=150&fit=crop' },
  { id: 'GA', name: 'Goa', citiesCovered: 12, productsListed: 12300, activeSellers: 1890, activeBuyers: 4560, rfqsPosted: 7800, ordersCompleted: 14500, tradeVolume: 198700000, verifiedCompanies: 1450, topIndustries: ['Food Processing', 'Pharmaceuticals', 'Handicrafts'], majorCities: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'], categories: ['Seafood', 'Pharma', 'Handicrafts', 'Beverages'], trendingCategories: ['Seafood Exports', 'Pharma', 'Beverages'], servicesCount: 4300, heroImage: null },
  { id: 'GJ', name: 'Gujarat', citiesCovered: 215, productsListed: 345000, activeSellers: 23400, activeBuyers: 56700, rfqsPosted: 89000, ordersCompleted: 178000, tradeVolume: 7890000000, verifiedCompanies: 19800, topIndustries: ['Chemicals', 'Automobile', 'Textiles', 'Pharmaceuticals', 'Engineering'], majorCities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'], categories: ['Chemicals', 'Auto Parts', 'Textiles', 'Pharma', 'Engineering'], trendingCategories: ['Chemicals', 'Auto Parts', 'Pharma', 'Engineering'], servicesCount: 120800, heroImage: 'https://images.unsplash.com/photo-1593246049224-5cde8f0ce6b8?w=150&h=150&fit=crop' },
  { id: 'HR', name: 'Haryana', citiesCovered: 78, productsListed: 156000, activeSellers: 11200, activeBuyers: 28900, rfqsPosted: 45600, ordersCompleted: 89000, tradeVolume: 3456000000, verifiedCompanies: 8900, topIndustries: ['Automobile', 'Electronics', 'Agriculture', 'Engineering'], majorCities: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal'], categories: ['Auto Parts', 'Electronics', 'Agricultural', 'Engineering'], trendingCategories: ['Auto Parts', 'Electronics', 'Engineering'], servicesCount: 54600, heroImage: null },
  { id: 'HP', name: 'Himachal Pradesh', citiesCovered: 38, productsListed: 18900, activeSellers: 2340, activeBuyers: 5670, rfqsPosted: 8900, ordersCompleted: 16700, tradeVolume: 189400000, verifiedCompanies: 1890, topIndustries: ['Food Processing', 'Agriculture', 'Handicrafts'], majorCities: ['Shimla', 'Dharamshala', 'Mandi', 'Solan', 'Kullu'], categories: ['Processed Foods', 'Agricultural', 'Handicrafts', 'Apparel'], trendingCategories: ['Processed Foods', 'Handicrafts', 'Organic'], servicesCount: 6600, heroImage: null },
  { id: 'JK', name: 'Jammu & Kashmir', citiesCovered: 45, productsListed: 23400, activeSellers: 3120, activeBuyers: 6780, rfqsPosted: 11200, ordersCompleted: 21500, tradeVolume: 234500000, verifiedCompanies: 2340, topIndustries: ['Handicrafts', 'Agriculture', 'Food Processing', 'Textiles'], majorCities: ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Kathua'], categories: ['Handicrafts', 'Dry Fruits', 'Apparel', 'Agricultural'], trendingCategories: ['Handicrafts Exports', 'Dry Fruits', 'Saffron'], servicesCount: 8200, heroImage: null },
  { id: 'JH', name: 'Jharkhand', citiesCovered: 35, productsListed: 19800, activeSellers: 2890, activeBuyers: 6780, rfqsPosted: 10200, ordersCompleted: 19800, tradeVolume: 267800000, verifiedCompanies: 2120, topIndustries: ['Steel', 'Construction', 'Chemicals', 'Agriculture'], majorCities: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar'], categories: ['Steel', 'Construction Materials', 'Chemicals', 'Agricultural'], trendingCategories: ['Steel', 'Construction', 'Mining'], servicesCount: 6900, heroImage: null },
  { id: 'KA', name: 'Karnataka', citiesCovered: 198, productsListed: 298000, activeSellers: 19800, activeBuyers: 45600, rfqsPosted: 72300, ordersCompleted: 145000, tradeVolume: 6789000000, verifiedCompanies: 16700, topIndustries: ['Electronics', 'Automobile', 'Pharmaceuticals', 'IT Services', 'Textiles'], majorCities: ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belagavi'], categories: ['Electronics', 'Auto Parts', 'Pharma', 'IT Solutions', 'Textiles'], trendingCategories: ['IT Solutions', 'Electronics', 'Pharma', 'Auto Parts'], servicesCount: 104300, heroImage: 'https://images.unsplash.com/photo-1596178060671-7a80dc8051f2?w=150&h=150&fit=crop' },
  { id: 'KL', name: 'Kerala', citiesCovered: 112, productsListed: 89000, activeSellers: 8900, activeBuyers: 23400, rfqsPosted: 34500, ordersCompleted: 67800, tradeVolume: 1567000000, verifiedCompanies: 6780, topIndustries: ['Food Processing', 'Pharmaceuticals', 'Handicrafts', 'Textiles'], majorCities: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Alappuzha'], categories: ['Food Products', 'Pharma', 'Handicrafts', 'Textiles', 'Seafood'], trendingCategories: ['Seafood Exports', 'Pharma', 'Food Processing', 'IT Services'], servicesCount: 31200, heroImage: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=150&h=150&fit=crop' },
  { id: 'LD', name: 'Lakshadweep', citiesCovered: 4, productsListed: 890, activeSellers: 120, activeBuyers: 340, rfqsPosted: 560, ordersCompleted: 1100, tradeVolume: 12300000, verifiedCompanies: 89, topIndustries: ['Food Processing', 'Fisheries'], majorCities: ['Kavaratti', 'Agatti', 'Minicoy', 'Andrott'], categories: ['Seafood', 'Coconut Products', 'Handicrafts'], trendingCategories: ['Seafood Exports', 'Coconut Products'], servicesCount: 300, heroImage: null },
  { id: 'MP', name: 'Madhya Pradesh', citiesCovered: 145, productsListed: 98700, activeSellers: 8900, activeBuyers: 23450, rfqsPosted: 37800, ordersCompleted: 72300, tradeVolume: 2345000000, verifiedCompanies: 7230, topIndustries: ['Agriculture', 'Automobile', 'Textiles', 'Construction'], majorCities: ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain'], categories: ['Agricultural', 'Auto Parts', 'Textiles', 'Construction'], trendingCategories: ['Auto Parts', 'Agriculture', 'Textiles'], servicesCount: 34500, heroImage: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=150&h=150&fit=crop' },
  { id: 'MH', name: 'Maharashtra', citiesCovered: 289, productsListed: 456000, activeSellers: 31200, activeBuyers: 72300, rfqsPosted: 112000, ordersCompleted: 223000, tradeVolume: 12345000000, verifiedCompanies: 24500, topIndustries: ['Automobile', 'Pharmaceuticals', 'Electronics', 'Textiles', 'Chemicals', 'Engineering'], majorCities: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik'], categories: ['Auto Parts', 'Pharma', 'Electronics', 'Textiles', 'Chemicals', 'Engineering'], trendingCategories: ['Auto Parts', 'Pharma', 'Electronics', 'Engineering'], servicesCount: 159600, heroImage: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=150&h=150&fit=crop' },
  { id: 'MN', name: 'Manipur', citiesCovered: 18, productsListed: 5600, activeSellers: 890, activeBuyers: 2100, rfqsPosted: 3400, ordersCompleted: 6700, tradeVolume: 56700000, verifiedCompanies: 670, topIndustries: ['Handicrafts', 'Agriculture', 'Textiles'], majorCities: ['Imphal', 'Bishnupur', 'Thoubal', 'Churachandpur'], categories: ['Handicrafts', 'Agricultural', 'Textiles'], trendingCategories: ['Handicrafts', 'Organic Products'], servicesCount: 2000, heroImage: null },
  { id: 'ML', name: 'Meghalaya', citiesCovered: 16, productsListed: 4800, activeSellers: 780, activeBuyers: 1890, rfqsPosted: 2900, ordersCompleted: 5600, tradeVolume: 45600000, verifiedCompanies: 560, topIndustries: ['Agriculture', 'Food Processing', 'Handicrafts'], majorCities: ['Shillong', 'Tura', 'Nongstoin', 'Jowai'], categories: ['Agricultural', 'Processed Foods', 'Handicrafts'], trendingCategories: ['Organic Products', 'Handicrafts', 'Tourism'], servicesCount: 1700, heroImage: null },
  { id: 'MZ', name: 'Mizoram', citiesCovered: 12, productsListed: 3400, activeSellers: 560, activeBuyers: 1340, rfqsPosted: 2100, ordersCompleted: 4100, tradeVolume: 34500000, verifiedCompanies: 340, topIndustries: ['Agriculture', 'Handicrafts'], majorCities: ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip'], categories: ['Agricultural', 'Handicrafts'], trendingCategories: ['Bamboo Products', 'Organic Agriculture'], servicesCount: 1200, heroImage: null },
  { id: 'NL', name: 'Nagaland', citiesCovered: 14, productsListed: 3900, activeSellers: 670, activeBuyers: 1560, rfqsPosted: 2600, ordersCompleted: 5100, tradeVolume: 38900000, verifiedCompanies: 450, topIndustries: ['Agriculture', 'Handicrafts', 'Food Processing'], majorCities: ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang'], categories: ['Agricultural', 'Handicrafts', 'Processed Foods'], trendingCategories: ['Organic Products', 'Handicrafts', 'Chili Products'], servicesCount: 1400, heroImage: null },
  { id: 'OD', name: 'Odisha', citiesCovered: 78, productsListed: 45600, activeSellers: 5670, activeBuyers: 12340, rfqsPosted: 19800, ordersCompleted: 38900, tradeVolume: 567800000, verifiedCompanies: 4560, topIndustries: ['Steel', 'Food Processing', 'Textiles', 'Handicrafts'], majorCities: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur'], categories: ['Steel', 'Processed Foods', 'Textiles', 'Handicrafts'], trendingCategories: ['Steel', 'Handicrafts', 'Textiles'], servicesCount: 16000, heroImage: null },
  { id: 'PY', name: 'Puducherry', citiesCovered: 6, productsListed: 6700, activeSellers: 1120, activeBuyers: 2890, rfqsPosted: 4500, ordersCompleted: 8900, tradeVolume: 123400000, verifiedCompanies: 890, topIndustries: ['Food Processing', 'Textiles', 'Pharmaceuticals'], majorCities: ['Puducherry', 'Karaikal', 'Yanam', 'Mahe'], categories: ['Processed Foods', 'Textiles', 'Pharma'], trendingCategories: ['Pharma', 'Processed Foods'], servicesCount: 2300, heroImage: null },
  { id: 'PB', name: 'Punjab', citiesCovered: 89, productsListed: 78900, activeSellers: 7800, activeBuyers: 18900, rfqsPosted: 29800, ordersCompleted: 57800, tradeVolume: 1234500000, verifiedCompanies: 6230, topIndustries: ['Agriculture', 'Food Processing', 'Textiles', 'MSME'], majorCities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda'], categories: ['Agricultural', 'Processed Foods', 'Textiles', 'Auto Parts'], trendingCategories: ['Food Processing', 'Textiles', 'Auto Parts'], servicesCount: 27600, heroImage: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=150&h=150&fit=crop' },
  { id: 'RJ', name: 'Rajasthan', citiesCovered: 156, productsListed: 134000, activeSellers: 10200, activeBuyers: 25600, rfqsPosted: 41200, ordersCompleted: 81200, tradeVolume: 2890000000, verifiedCompanies: 8450, topIndustries: ['Textiles', 'Handicrafts', 'Construction', 'Chemicals', 'Engineering'], majorCities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner'], categories: ['Textiles', 'Handicrafts', 'Construction Materials', 'Chemicals', 'Engineering'], trendingCategories: ['Handicrafts Exports', 'Textiles', 'Engineering', 'Chemicals'], servicesCount: 46900, heroImage: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=150&h=150&fit=crop' },
  { id: 'SK', name: 'Sikkim', citiesCovered: 8, productsListed: 2800, activeSellers: 450, activeBuyers: 1120, rfqsPosted: 1800, ordersCompleted: 3400, tradeVolume: 28900000, verifiedCompanies: 280, topIndustries: ['Agriculture', 'Food Processing', 'Handicrafts'], majorCities: ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan'], categories: ['Organic Products', 'Processed Foods', 'Handicrafts'], trendingCategories: ['Organic Products', 'Handicrafts'], servicesCount: 1000, heroImage: null },
  { id: 'TN', name: 'Tamil Nadu', citiesCovered: 420, productsListed: 389000, activeSellers: 25600, activeBuyers: 58900, rfqsPosted: 92300, ordersCompleted: 185000, tradeVolume: 8900000000, verifiedCompanies: 19800, topIndustries: ['Automobile', 'Textiles', 'Electronics', 'Pharmaceuticals', 'Engineering'], majorCities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'], categories: ['Auto Parts', 'Textiles', 'Electronics', 'Pharma', 'Engineering'], trendingCategories: ['Auto Parts', 'Electronics', 'Textiles', 'Pharma'], servicesCount: 136200, heroImage: 'https://images.unsplash.com/photo-1563191794-b0e1e2e56e2c?w=150&h=150&fit=crop' },
  { id: 'TS', name: 'Telangana', citiesCovered: 98, productsListed: 178000, activeSellers: 12300, activeBuyers: 31200, rfqsPosted: 48900, ordersCompleted: 96700, tradeVolume: 4567000000, verifiedCompanies: 10200, topIndustries: ['Pharmaceuticals', 'Electronics', 'IT Services', 'Textiles'], majorCities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'], categories: ['Pharma', 'Electronics', 'IT Solutions', 'Textiles'], trendingCategories: ['Pharma', 'IT Solutions', 'Electronics'], servicesCount: 62300, heroImage: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=150&h=150&fit=crop' },
  { id: 'TR', name: 'Tripura', citiesCovered: 14, productsListed: 4100, activeSellers: 780, activeBuyers: 1780, rfqsPosted: 2900, ordersCompleted: 5600, tradeVolume: 45600000, verifiedCompanies: 450, topIndustries: ['Agriculture', 'Handicrafts', 'Food Processing'], majorCities: ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar'], categories: ['Agricultural', 'Handicrafts', 'Processed Foods'], trendingCategories: ['Bamboo Products', 'Handicrafts', 'Organic'], servicesCount: 1400, heroImage: null },
  { id: 'UP', name: 'Uttar Pradesh', citiesCovered: 380, productsListed: 256000, activeSellers: 18900, activeBuyers: 45600, rfqsPosted: 72300, ordersCompleted: 142000, tradeVolume: 5678000000, verifiedCompanies: 14500, topIndustries: ['Agriculture', 'Food Processing', 'Textiles', 'MSME', 'Construction'], majorCities: ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Noida'], categories: ['Agricultural', 'Processed Foods', 'Textiles', 'Construction', 'Handicrafts'], trendingCategories: ['Food Processing', 'Textiles', 'MSME', 'Handicrafts'], servicesCount: 89600, heroImage: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=150&h=150&fit=crop' },
  { id: 'UK', name: 'Uttarakhand', citiesCovered: 28, productsListed: 15600, activeSellers: 2340, activeBuyers: 5670, rfqsPosted: 8900, ordersCompleted: 17200, tradeVolume: 198500000, verifiedCompanies: 1890, topIndustries: ['Food Processing', 'Agriculture', 'Pharmaceuticals', 'Handicrafts'], majorCities: ['Dehradun', 'Haridwar', 'Rishikesh', 'Nainital', 'Haldwani'], categories: ['Processed Foods', 'Agricultural', 'Pharma', 'Handicrafts'], trendingCategories: ['Pharma', 'Organic Products', 'Processed Foods'], servicesCount: 5500, heroImage: null },
  { id: 'WB', name: 'West Bengal', citiesCovered: 178, productsListed: 189000, activeSellers: 14500, activeBuyers: 34500, rfqsPosted: 52300, ordersCompleted: 103000, tradeVolume: 3890000000, verifiedCompanies: 11200, topIndustries: ['Textiles', 'Food Processing', 'Steel', 'Chemicals', 'Handicrafts'], majorCities: ['Kolkata', 'Howrah', 'Durgapur', 'Siliguri', 'Asansol'], categories: ['Textiles', 'Processed Foods', 'Steel', 'Chemicals', 'Handicrafts'], trendingCategories: ['Textiles', 'Handicrafts', 'Food Processing', 'Chemicals'], servicesCount: 66200, heroImage: 'https://images.unsplash.com/photo-1590079651737-0cb37cafea43?w=150&h=150&fit=crop' },
];

export const indiaIntelligence: IndiaIntelligence = {
  manufacturingHotspots: [
    { name: 'Maharashtra', value: 'Pune-Mumbai-Nagpur Auto & Pharma Belt', trend: 'up' },
    { name: 'Tamil Nadu', value: 'Chennai-Coimbatore Auto & Electronics Hub', trend: 'up' },
    { name: 'Gujarat', value: 'Ahmedabad-Surat Chemical & Textile Corridor', trend: 'up' },
    { name: 'Karnataka', value: 'Bengaluru Electronics & IT Manufacturing Hub', trend: 'up' },
    { name: 'Uttar Pradesh', value: 'Noida-Lucknow MSME & Food Processing Belt', trend: 'up' },
    { name: 'Telangana', value: 'Hyderabad Pharma & Electronics Cluster', trend: 'stable' },
  ],
  fastestGrowingStates: [
    { name: 'Maharashtra', growth: '+34.5%', rank: 1 },
    { name: 'Karnataka', growth: '+31.2%', rank: 2 },
    { name: 'Tamil Nadu', growth: '+28.9%', rank: 3 },
    { name: 'Gujarat', growth: '+27.6%', rank: 4 },
    { name: 'Uttar Pradesh', growth: '+24.3%', rank: 5 },
  ],
  trendingIndustries: [
    { name: 'Electric Vehicles', momentum: '+89%', direction: 'up' },
    { name: 'Pharmaceuticals', momentum: '+67%', direction: 'up' },
    { name: 'Electronics Manufacturing', momentum: '+72%', direction: 'up' },
    { name: 'Food Processing', momentum: '+55%', direction: 'up' },
    { name: 'Green Energy', momentum: '+94%', direction: 'up' },
  ],
  topCategories: [
    { name: 'Auto Parts & Components', count: 124500 },
    { name: 'Pharmaceuticals & APIs', count: 98700 },
    { name: 'Textiles & Apparel', count: 87600 },
    { name: 'Electronics & Components', count: 76500 },
    { name: 'Food Products & Processing', count: 65400 },
  ],
  mostActiveRegions: [
    { name: 'Western India', activity: 'Highest Trade Volume' },
    { name: 'Southern India', activity: 'Most Active Buyers' },
    { name: 'Northern India', activity: 'Fastest Growth' },
    { name: 'Eastern India', activity: 'Emerging Hub' },
  ],
  emergingOpportunities: [
    { name: 'EV Battery Manufacturing', potential: 'High' },
    { name: 'Medical Devices', potential: 'Very High' },
    { name: 'Semiconductor Assembly', potential: 'High' },
    { name: 'Green Hydrogen', potential: 'Very High' },
    { name: 'AI & Robotics', potential: 'High' },
  ],
};

export function formatVolume(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n}`;
}

export function formatNumber(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
}

export function formatIndian(n: number): string {
  if (n >= 1e7) return `${(n / 1e7).toFixed(1)}Cr+`;
  if (n >= 1e5) return `${(n / 1e5).toFixed(1)}L+`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K+`;
  return n.toString();
}
