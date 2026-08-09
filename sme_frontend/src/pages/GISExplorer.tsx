import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import gsap from 'gsap'
import 'leaflet/dist/leaflet.css'
import '../styles/gis-explorer.css'

// District data with coordinates and metadata
const DISTRICTS = {
  kinondoni: {
    name: 'Kinondoni',
    subtitle: 'Municipal Council',
    center: [-6.7924, 39.2083],
    bounds: [[-6.5, 39.0], [-7.0, 39.4]],
    population: '1,254,000',
    area: '533 km²',
    wards: 35,
    schools: 245,
    hospitals: 12,
    description: 'The largest district in Dar es Salaam, known for its commercial and residential development.',
  },
  ilala: {
    name: 'Ilala',
    subtitle: 'Municipal Council',
    center: [-6.8, 39.27],
    bounds: [[-6.6, 39.1], [-7.0, 39.4]],
    population: '1,089,000',
    area: '470 km²',
    wards: 32,
    schools: 198,
    hospitals: 15,
    description: 'The central business district and heart of Dar es Salaam.',
  },
  temeke: {
    name: 'Temeke',
    subtitle: 'Municipal Council',
    center: [-6.95, 39.27],
    bounds: [[-6.8, 39.1], [-7.1, 39.4]],
    population: '385,000',
    area: '534 km²',
    wards: 18,
    schools: 89,
    hospitals: 6,
    description: 'Southern district with growing industrial and residential areas.',
  },
  ubungo: {
    name: 'Ubungo',
    subtitle: 'Municipal Council',
    center: [-6.85, 39.1],
    bounds: [[-6.7, 38.95], [-7.0, 39.25]],
    population: '567,000',
    area: '580 km²',
    wards: 26,
    schools: 134,
    hospitals: 8,
    description: 'Western district with mixed commercial and residential zones.',
  },
  kigamboni: {
    name: 'Kigamboni',
    subtitle: 'Municipal Council',
    center: [-6.92, 39.35],
    bounds: [[-6.8, 39.25], [-7.05, 39.5]],
    population: '286,000',
    area: '246 km²',
    wards: 14,
    schools: 67,
    hospitals: 4,
    description: 'Eastern district across the harbor with emerging development.',
  },
}

interface District {
  name: string
  subtitle: string
  center: [number, number]
  bounds: [[number, number], [number, number]]
  population: string
  area: string
  wards: number
  schools: number
  hospitals: number
  description: string
}

export default function GISExplorer() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const districtLayers = useRef<{ [key: string]: L.GeoJSON }>({})
  const districtLabels = useRef<{ [key: string]: L.Marker }>({})

  useEffect(() => {
    if (!mapContainer.current) return

    // Initialize map
    map.current = L.map(mapContainer.current, {
      center: [-6.8, 39.27],
      zoom: 11,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      touchZoom: true,
    })

    // Add satellite imagery from ESRI
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 18,
        attribution: '© Esri',
      }
    ).addTo(map.current)

    // Create district boundaries as GeoJSON
    Object.entries(DISTRICTS).forEach(([key, district]) => {
      const bounds = district.bounds
      const geoJSON = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [bounds[0][1], bounds[0][0]],
              [bounds[1][1], bounds[0][0]],
              [bounds[1][1], bounds[1][0]],
              [bounds[0][1], bounds[1][0]],
              [bounds[0][1], bounds[0][0]],
            ],
          ],
        },
        properties: { name: district.name },
      }

      const layer = L.geoJSON(geoJSON, {
        style: {
          color: 'rgba(255, 255, 255, 0.3)',
          weight: 2,
          opacity: 0.5,
          fillOpacity: 0,
        },
        onEachFeature: (feature, featureLayer) => {
          featureLayer.on('click', () => handleDistrictClick(key))
          featureLayer.on('mouseover', () => {
            if (selectedDistrict !== key) {
              featureLayer.setStyle({
                color: 'rgba(255, 255, 255, 0.6)',
                opacity: 0.8,
              })
            }
          })
          featureLayer.on('mouseout', () => {
            if (selectedDistrict !== key) {
              featureLayer.setStyle({
                color: 'rgba(255, 255, 255, 0.3)',
                opacity: 0.5,
              })
            }
          })
        },
      }).addTo(map.current!)

      districtLayers.current[key] = layer
    })

    // Simulate loading completion
    setTimeout(() => {
      setIsLoading(false)
      animateLoadingComplete()
    }, 2000)

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [])

  const animateLoadingComplete = () => {
    gsap.to('.gis-map-container', {
      opacity: 1,
      duration: 0.8,
      ease: 'power2.inOut',
    })
  }

  const handleDistrictClick = (districtKey: string) => {
    const district = DISTRICTS[districtKey as keyof typeof DISTRICTS]
    setSelectedDistrict(districtKey)

    // Animate camera to district
    if (map.current) {
      gsap.to(map.current, {
        duration: 1.2,
        ease: 'power2.inOut',
        onUpdate: () => {
          map.current?.setView(district.center, 13)
        },
      })
    }

    // Animate district highlight
    const layer = districtLayers.current[districtKey]
    if (layer) {
      layer.setStyle({
        color: '#C6FF59',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.15,
        fillColor: '#C6FF59',
      })
    }

    // Animate other districts to darker
    Object.entries(districtLayers.current).forEach(([key, otherLayer]) => {
      if (key !== districtKey) {
        otherLayer.setStyle({
          color: 'rgba(255, 255, 255, 0.15)',
          opacity: 0.2,
          fillOpacity: 0,
        })
      }
    })

    // Show district label
    gsap.fromTo(
      '.district-label',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.6 }
    )

    // Show info panel
    gsap.fromTo(
      '.info-panel',
      { x: 400, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.8, ease: 'power2.out', delay: 0.4 }
    )
  }

  const handleClosePanel = () => {
    setSelectedDistrict(null)

    // Reset all districts
    Object.entries(districtLayers.current).forEach(([, layer]) => {
      layer.setStyle({
        color: 'rgba(255, 255, 255, 0.3)',
        weight: 2,
        opacity: 0.5,
        fillOpacity: 0,
      })
    })

    // Hide info panel
    gsap.to('.info-panel', {
      x: 400,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.in',
    })

    // Hide label
    gsap.to('.district-label', {
      opacity: 0,
      y: 20,
      duration: 0.4,
      ease: 'power2.in',
    })

    // Reset map view
    if (map.current) {
      gsap.to(map.current, {
        duration: 1,
        ease: 'power2.inOut',
        onUpdate: () => {
          map.current?.setView([-6.8, 39.27], 11)
        },
      })
    }
  }

  const selectedDistrictData = selectedDistrict
    ? DISTRICTS[selectedDistrict as keyof typeof DISTRICTS]
    : null

  return (
    <div className="gis-explorer-container">
      {/* Loading Screen */}
      {isLoading && (
        <div className="loading-screen">
          <div className="loading-content">
            <h1 className="loading-title">DAR ES SALAAM</h1>
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className={`gis-map-container ${isLoading ? 'opacity-0' : ''}`}>
        <div ref={mapContainer} className="map-element"></div>

        {/* Top Left Header */}
        <div className="top-left-header">
          <h1 className="header-title">DAR ES SALAAM</h1>
          <p className="header-subtitle">Interactive District Explorer</p>
        </div>

        {/* Top Right Menu */}
        <div className="top-right-menu">
          <button className="menu-button" aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>

        {/* Bottom Left Coordinates */}
        <div className="bottom-left-coords">
          <p className="coords-text">-6.8° S, 39.3° E</p>
        </div>

        {/* Bottom Right Zoom Controls */}
        <div className="bottom-right-zoom">
          <button className="zoom-button zoom-in" onClick={() => map.current?.zoomIn()}>
            +
          </button>
          <button className="zoom-button zoom-out" onClick={() => map.current?.zoomOut()}>
            −
          </button>
        </div>

        {/* District Label */}
        {selectedDistrictData && (
          <div className="district-label">
            <h2 className="label-title">{selectedDistrictData.name}</h2>
            <p className="label-subtitle">{selectedDistrictData.subtitle}</p>
          </div>
        )}

        {/* Info Panel */}
        {selectedDistrictData && (
          <div className="info-panel">
            <button className="panel-close" onClick={handleClosePanel}>
              ✕
            </button>

            <div className="panel-header">
              <h2 className="panel-title">{selectedDistrictData.name}</h2>
              <p className="panel-description">{selectedDistrictData.description}</p>
            </div>

            <div className="panel-stats">
              <div className="stat-item">
                <span className="stat-label">Population</span>
                <span className="stat-value">{selectedDistrictData.population}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Area</span>
                <span className="stat-value">{selectedDistrictData.area}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Wards</span>
                <span className="stat-value">{selectedDistrictData.wards}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Schools</span>
                <span className="stat-value">{selectedDistrictData.schools}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Hospitals</span>
                <span className="stat-value">{selectedDistrictData.hospitals}</span>
              </div>
            </div>

            <div className="panel-buttons">
              <button className="panel-btn btn-primary">View Wards</button>
              <button className="panel-btn btn-secondary">Projects</button>
              <button className="panel-btn btn-secondary">Statistics</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
