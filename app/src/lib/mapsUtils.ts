// Google Maps utilities for address autocomplete and distance calculation

// Google Maps types (simplified)
declare global {
  interface Window {
    google: {
      maps: {
        Geocoder: new () => {
          geocode: (
            request: { address: string },
            callback: (results: Array<{ formatted_address: string; geometry: { location: { lat: () => number; lng: () => number } } }> | null, status: string) => void,
          ) => void
        }
        DistanceMatrixService: new () => {
          getDistanceMatrix: (
            request: {
              origins: Array<{ lat: number; lng: number }>
              destinations: Array<{ lat: number; lng: number }>
              travelMode: unknown
              unitSystem: unknown
            },
            callback: (
              response: {
                rows: Array<{
                  elements: Array<{
                    distance: { value: number }
                  }>
                }>
              } | null,
              status: string,
            ) => void,
          ) => void
        }
        TravelMode: { DRIVING: unknown }
        UnitSystem: { METRIC: unknown }
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options: { types: string[]; componentRestrictions: { country: string } },
          ) => {
            getPlace: () => {
              formatted_address?: string
              geometry?: { location: { lat: () => number; lng: () => number } }
            }
            addListener: (event: string, callback: () => void) => void
          }
        }
        event: {
          clearInstanceListeners: (instance: unknown) => void
        }
      }
    }
  }
}

export type AddressResult = {
  formatted: string
  lat: number
  lng: number
}

let mapsLoaded = false
let mapsLoading = false

export function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (mapsLoaded) return Promise.resolve()
  if (mapsLoading) {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (mapsLoaded) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)
    })
  }

  mapsLoading = true
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      mapsLoaded = true
      mapsLoading = false
      resolve()
    }
    script.onerror = () => {
      mapsLoading = false
      reject(new Error('Failed to load Google Maps'))
    }
    document.head.appendChild(script)
  })
}

export async function geocodeAddress(address: string, apiKey: string): Promise<AddressResult | null> {
  await loadGoogleMapsScript(apiKey)
  if (!window.google?.maps?.Geocoder) return null

  const geocoder = new window.google.maps.Geocoder()
  return new Promise((resolve) => {
    geocoder.geocode(
      { address },
      (
        results: Array<{ formatted_address: string; geometry: { location: { lat: () => number; lng: () => number } } }> | null,
        status: string,
      ) => {
        if (status === 'OK' && results?.[0]) {
          const loc = results[0].geometry.location
          resolve({
            formatted: results[0].formatted_address,
            lat: loc.lat(),
            lng: loc.lng(),
          })
        } else {
          resolve(null)
        }
      },
    )
  })
}

export async function calculateDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  apiKey: string,
): Promise<number | null> {
  await loadGoogleMapsScript(apiKey)
  if (!window.google?.maps?.DistanceMatrixService) return null

  const service = new window.google.maps.DistanceMatrixService()
  return new Promise((resolve) => {
    service.getDistanceMatrix(
      {
        origins: [{ lat: origin.lat, lng: origin.lng }],
        destinations: [{ lat: destination.lat, lng: destination.lng }],
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
      },
      (
        response: {
          rows: Array<{
            elements: Array<{
              distance: { value: number }
            }>
          }>
        } | null,
        status: string,
      ) => {
        if (status === 'OK' && response?.rows?.[0]?.elements?.[0]) {
          const distance = response.rows[0].elements[0].distance.value / 1000 // Convert to km
          resolve(distance)
        } else {
          resolve(null)
        }
      },
    )
  })
}

type AutocompleteInstance = {
  getPlace: () => {
    formatted_address?: string
    geometry?: { location: { lat: () => number; lng: () => number } }
  }
  addListener: (event: string, callback: () => void) => void
}

export function createAutocomplete(
  input: HTMLInputElement,
  apiKey: string,
  onPlaceSelected: (result: AddressResult) => void,
): () => void {
  let autocomplete: AutocompleteInstance | null = null

  loadGoogleMapsScript(apiKey).then(() => {
    if (!window.google?.maps?.places) return

    autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ['address'],
      componentRestrictions: { country: 'in' },
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete?.getPlace()
      if (place?.geometry?.location) {
        onPlaceSelected({
          formatted: place.formatted_address ?? '',
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        })
      }
    })
  })

  return () => {
    if (autocomplete) {
      window.google?.maps?.event?.clearInstanceListeners(autocomplete)
    }
  }
}
