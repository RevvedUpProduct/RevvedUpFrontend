export const ENDPOINTS = {
  rides: {
    start: '/rides/start',
    stop: (rideId) => `/rides/${rideId}/stop`,
    list: '/rides',
    byId: (rideId) => `/rides/${rideId}`,
    appendCoordinates: (rideId) => `/rides/${rideId}/coordinates`,
  },
  memories: {
    add: '/memories',
    byRide: (rideId) => `/rides/${rideId}/memories`,
    delete: (memoryId) => `/memories/${memoryId}`,
  },
};
