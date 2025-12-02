// Comprehensive mapping of Indian states/UTs and their major cities
// Used for location filtering and job posting

export const indianLocations: { [key: string]: string[] } = {
  // States
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Pasighat"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur"],
  "Chhattisgarh": ["Raipur", "Bilaspur", "Durg", "Bhilai"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Karnal"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Belgaum", "Hubli"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Ujjain"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
  "Manipur": ["Imphal", "Thoubal"],
  "Meghalaya": ["Shillong", "Tura"],
  "Mizoram": ["Aizawl", "Lunglei"],
  "Nagaland": ["Kohima", "Dimapur"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur"],
  "Punjab": ["Amritsar", "Ludhiana", "Jalandhar", "Patiala"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Kota", "Udaipur", "Ajmer"],
  "Sikkim": ["Gangtok", "Namchi"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli"],
  "Telangana": ["Hyderabad", "Warangal", "Karimnagar"],
  "Tripura": ["Agartala", "Udaipur"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Varanasi", "Agra", "Ghaziabad"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani"],
  "West Bengal": ["Kolkata", "Siliguri", "Asansol", "Durgapur"],
  
  // Union Territories
  "Delhi": ["New Delhi"],
  "Jammu & Kashmir": ["Srinagar", "Jammu"],
  "Ladakh": ["Leh"],
  "Puducherry": ["Pondicherry"],
  "Chandigarh": ["Chandigarh"],
  "Andaman & Nicobar Islands": ["Port Blair"],
  "Dadra & Nagar Haveli & Daman & Diu": ["Daman", "Silvassa"],
  "Lakshadweep": ["Kavaratti"]
};

// Get all states sorted alphabetically
export const getAllStates = (): string[] => {
  return Object.keys(indianLocations).sort();
};

// Get cities for a specific state
export const getCitiesForState = (state: string): string[] => {
  return indianLocations[state] || [];
};

// Parse location string (format: "City, State") and return components
export const parseLocation = (location: string): { city: string; state: string } => {
  if (!location) return { city: "", state: "" };
  
  const parts = location.split(",").map(part => part.trim());
  if (parts.length === 2) {
    return { city: parts[0], state: parts[1] };
  } else if (parts.length === 1) {
    // Could be just state or just city
    const possibleState = parts[0];
    if (indianLocations[possibleState]) {
      return { city: "", state: possibleState };
    }
    return { city: parts[0], state: "" };
  }
  
  return { city: "", state: "" };
};

// Check if a location matches the filter criteria
export const matchesLocationFilter = (
  jobLocation: string,
  filterState: string,
  filterCity: string
): boolean => {
  if (!filterState && !filterCity) return true; // No filter applied
  
  const { city, state } = parseLocation(jobLocation);
  
  // If both state and city filters are set
  if (filterState && filterCity) {
    return (
      state.toLowerCase() === filterState.toLowerCase() &&
      city.toLowerCase() === filterCity.toLowerCase()
    );
  }
  
  // If only state filter is set
  if (filterState) {
    return state.toLowerCase() === filterState.toLowerCase();
  }
  
  // If only city filter is set (shouldn't happen with cascading dropdown, but handle it)
  if (filterCity) {
    return city.toLowerCase() === filterCity.toLowerCase();
  }
  
  return true;
};
