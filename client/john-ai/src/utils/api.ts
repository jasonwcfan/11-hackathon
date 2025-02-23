export interface FindBusinessesRequest {
  item_type: string;
  location: string;
}

export interface CallBusinessRequest {
  business_number: string;
  business_url: string;
  business_name: string;
  service_description: string;
  user_location: string;
  detail: string;
}

export const callBusiness = async (request: CallBusinessRequest) => {
  try {
    const response = await fetch('https://64c1-38-34-121-167.ngrok-free.app/outbound-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error('Failed to call business');
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling business:', error);
    throw error;
  }
};

export const findBusinesses = async (request: FindBusinessesRequest) => {
  try {
    const response = await fetch('http://localhost:8080/find-businesses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error('Failed to find businesses');
    }

    return await response.json();
  } catch (error) {
    console.error('Error finding businesses:', error);
    throw error;
  }
};