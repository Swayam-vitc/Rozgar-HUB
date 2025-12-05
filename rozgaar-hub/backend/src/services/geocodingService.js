import axios from 'axios';

const OPENCAGE_API_KEY = 'b2d8b3c807b248fa91a81a40908cf677';
const OPENCAGE_API_URL = 'https://api.opencagedata.com/geocode/v1/json';

/**
 * Geocode an address to get coordinates and location details
 * @param {string} address - The address to geocode
 * @returns {Promise<Object>} Location data with coordinates
 */
export const geocodeAddress = async (address) => {
    try {
        if (!address || address.trim() === '') {
            return {
                success: false,
                error: 'Address is required'
            };
        }

        const response = await axios.get(OPENCAGE_API_URL, {
            params: {
                q: address,
                key: OPENCAGE_API_KEY,
                limit: 1,
                no_annotations: 1
            }
        });

        if (response.data.results && response.data.results.length > 0) {
            const result = response.data.results[0];
            const components = result.components;

            return {
                success: true,
                location: {
                    lat: result.geometry.lat,
                    lng: result.geometry.lng,
                    city: components.city || components.town || components.village || '',
                    state: components.state || '',
                    country: components.country || '',
                    formatted: result.formatted
                }
            };
        } else {
            return {
                success: false,
                error: 'Location not found'
            };
        }
    } catch (error) {
        console.error('Geocoding error:', error);
        return {
            success: false,
            error: error.message || 'Failed to geocode address'
        };
    }
};

/**
 * Reverse geocode coordinates to get address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Address data
 */
export const reverseGeocode = async (lat, lng) => {
    try {
        const response = await axios.get(OPENCAGE_API_URL, {
            params: {
                q: `${lat},${lng}`,
                key: OPENCAGE_API_KEY,
                limit: 1,
                no_annotations: 1
            }
        });

        if (response.data.results && response.data.results.length > 0) {
            const result = response.data.results[0];
            const components = result.components;

            return {
                success: true,
                location: {
                    lat: result.geometry.lat,
                    lng: result.geometry.lng,
                    city: components.city || components.town || components.village || '',
                    state: components.state || '',
                    country: components.country || '',
                    formatted: result.formatted
                }
            };
        } else {
            return {
                success: false,
                error: 'Address not found'
            };
        }
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return {
            success: false,
            error: error.message || 'Failed to reverse geocode'
        };
    }
};
