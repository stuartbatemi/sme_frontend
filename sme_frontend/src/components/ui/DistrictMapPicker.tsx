// src/components/ui/DistrictMapPicker.tsx
// Embedded district + ward picker for AdvisorPage Step 1.
// Replaces the old District dropdown + Ward text input.

import React, { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ── Ward data (corrected — Ilala CBD split verified against official
// admin divisions; ward count now matches source-of-truth used by the
// backend/model, not the old placeholder list) ─────────────────────
import darAdminDivisions from '../../data/dar_admin_divisions.json'

// The map still shows 5 clickable regions (no GIS boundary file exists
// for Ilala CBD as its own shape), but wards are the FULL correct set —
// Ilala CBD wards are included under the 'Ilala' map region for display,
// then silently corrected to the true district when picked (see
// WARD_TO_TRUE_DISTRICT below). This keeps what gets sent to the
// backend/model accurate even though the map shape doesn't visually split.
const WARD_DATA: Record<string, string[]> = {
  "Ilala": ["Bonyokwa", "Buguruni", "Buyuni", "Chanika", "Gerezani", "Gongo la Mboto", "Ilala", "Jangwani", "Kariakoo", "Kimanga", "Kinyerezi", "Kipawa", "Kipunguni", "Kisukulu", "Kisutu", "Kitunda", "Kivukoni", "Kivule", "Kiwalani", "Liwiti", "Majohe", "Mchafukoge", "Mchikichini", "Minazi Mirefu", "Mnyamani", "Msongola", "Mzinga", "Pugu", "Pugu Station", "Segerea", "Tabata", "Ukonga", "Upanga Magharibi", "Upanga Mashariki", "Vingunguti", "Zingiziwa"],
  "Kigamboni": ["Kibada", "Kigamboni", "Kimbiji", "Kisarawe II", "Mjimwema", "Pembamnazi", "Somangila", "Tungi", "Vijibweni"],
  "Kinondoni": ["Bunju", "Hananasif", "Kawe", "Kigogo", "Kijitonyama", "Kinondoni", "Kunduchi", "Mabwepande", "Magomeni", "Makongo", "Makumbusho", "Mbezi Juu", "Mbweni", "Mikocheni", "Msasani", "Mwananyamala", "Mzimuni", "Ndugumbi", "Tandale", "Wazo"],
  "Temeke": ["Azimio", "Buza", "Chamazi", "Chang'ombe", "Charambe", "Keko", "Kibondemaji", "Kiburugwa", "Kijichi", "Kilakala", "Kilungule", "Kurasini", "Makangarawe", "Mbagala", "Mbagala Kuu", "Mianzini", "Miburani", "Mtoni", "Sandali", "Tandika", "Temeke", "Toangoma", "Yombo Vituka"],
  "Ubungo": ["Goba", "Kibamba", "Kimara", "Kwembe", "Mabibo", "Makuburi", "Makurumla", "Manzese", "Mbezi", "Mburahati", "Msigani", "Saranga", "Sinza", "Ubungo"],
}

// Ward -> the district value that actually gets sent to the backend.
// Only wards that differ from their map region need an entry here
// (i.e. Ilala CBD wards, which visually sit under the 'Ilala' region).
const WARD_TO_TRUE_DISTRICT: Record<string, string> = {
  "Bonyokwa": "Ilala",
  "Buguruni": "Ilala",
  "Buyuni": "Ilala",
  "Chanika": "Ilala",
  "Gerezani": "Ilala CBD",
  "Gongo la Mboto": "Ilala",
  "Ilala": "Ilala",
  "Jangwani": "Ilala CBD",
  "Kariakoo": "Ilala CBD",
  "Kimanga": "Ilala",
  "Kinyerezi": "Ilala",
  "Kipawa": "Ilala",
  "Kipunguni": "Ilala",
  "Kisukulu": "Ilala",
  "Kisutu": "Ilala CBD",
  "Kitunda": "Ilala",
  "Kivukoni": "Ilala CBD",
  "Kivule": "Ilala",
  "Kiwalani": "Ilala",
  "Liwiti": "Ilala",
  "Majohe": "Ilala",
  "Mchafukoge": "Ilala CBD",
  "Mchikichini": "Ilala CBD",
  "Minazi Mirefu": "Ilala",
  "Mnyamani": "Ilala",
  "Msongola": "Ilala",
  "Mzinga": "Ilala",
  "Pugu": "Ilala",
  "Pugu Station": "Ilala",
  "Segerea": "Ilala",
  "Tabata": "Ilala",
  "Ukonga": "Ilala",
  "Upanga Magharibi": "Ilala CBD",
  "Upanga Mashariki": "Ilala CBD",
  "Vingunguti": "Ilala",
  "Zingiziwa": "Ilala",
}

// Approximate map centres per district (for fly-to)
const DISTRICT_CENTERS: Record<string, [number, number]> = {
  Kinondoni: [-6.79, 39.21],
  Ilala:     [-6.82, 39.27],
  Temeke:    [-6.95, 39.27],
  Ubungo:    [-6.85, 39.11],
  Kigamboni: [-6.92, 39.35],
}

const ACCENT = '#C6FF59'
const IDLE_STYLE: L.PathOptions = {
  color: 'rgba(255,255,255,0.55)', weight: 2, opacity: 1, fillOpacity: 0.04, fillColor: '#fff',
}
const HOVER_STYLE: L.PathOptions = {
  color: '#fff', weight: 2.5, opacity: 1, fillOpacity: 0.1, fillColor: '#fff',
}
const SELECTED_STYLE: L.PathOptions = {
  color: ACCENT, weight: 3, opacity: 1, fillOpacity: 0.18, fillColor: ACCENT,
}
const DIM_STYLE: L.PathOptions = {
  color: 'rgba(255,255,255,0.15)', weight: 1.5, opacity: 0.3, fillOpacity: 0, fillColor: '#fff',
}

interface Props {
  district: string
  ward: string
  village: string
  onDistrictChange: (d: string) => void
  onWardChange: (w: string) => void
  onVillageChange: (v: string) => void
}

export default function DistrictMapPicker({
  district, ward, village,
  onDistrictChange, onWardChange, onVillageChange,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapObj = useRef<L.Map | null>(null)
  const layers = useRef<Record<string, L.GeoJSON>>({})
  const hovered = useRef<string | null>(null)
  const [wardSearch, setWardSearch] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [loadError, setLoadError] = useState('')

  // ── Map init ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapObj.current) return

    mapObj.current = L.map(mapRef.current, {
      center: [-6.87, 39.24],
      zoom: 10,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
    })

    // Satellite tiles
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18 }
    ).addTo(mapObj.current)

    // Custom zoom (bottom-right)
    L.control.zoom({ position: 'bottomright' }).addTo(mapObj.current)

    // Load all 5 GeoJSON files
    const names = ['kinondoni', 'ilala', 'temeke', 'ubungo', 'kigamboni']
    let loaded = 0

    names.forEach(async (key) => {
      try {
        const res = await fetch(`/geojson/${key}.geojson`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const geojson = await res.json()
        const propName = geojson.features?.[0]?.properties?.name || ''
        // Map OSM name → our canonical name
        const canonical = (['Kinondoni','Ilala','Temeke','Ubungo','Kigamboni']
          .find(n => propName.toLowerCase().includes(n.toLowerCase()))
        ) || key.charAt(0).toUpperCase() + key.slice(1)

        const layer = L.geoJSON(geojson, {
          style: IDLE_STYLE,
          onEachFeature: (_feat, fl) => {
            fl.on('mouseover', () => {
              hovered.current = canonical
              if (mapRegion !== canonical) (fl as L.Path).setStyle(HOVER_STYLE)
            })
            fl.on('mouseout', () => {
              hovered.current = null
              applyAllStyles(canonical)
            })
            fl.on('click', () => handleDistrictClick(canonical))
          },
        }).addTo(mapObj.current!)

        layers.current[canonical] = layer
        loaded++
        if (loaded === names.length) setMapReady(true)
      } catch (e) {
        console.error('GeoJSON load error', key, e)
        setLoadError('Map tiles could not load. You can still pick from the list below.')
        loaded++
        if (loaded === names.length) setMapReady(true)
      }
    })

    return () => { mapObj.current?.remove(); mapObj.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Style helpers ─────────────────────────────────────────────────
  const applyAllStyles = useCallback((selectedKey: string) => {
    Object.entries(layers.current).forEach(([name, layer]) => {
      const style =
        name === selectedKey ? SELECTED_STYLE
        : selectedKey ? DIM_STYLE
        : IDLE_STYLE
      layer.setStyle(style)
    })
  }, [])

  // 'Ilala CBD' has no separate map shape — treat it as the 'Ilala'
  // region for map highlighting, fly-to, and ward-list lookup, while
  // still sending the correct true district value to the backend.
  const mapRegion = district === 'Ilala CBD' ? 'Ilala' : district

  // Re-apply styles whenever the map region changes (e.g. reset from parent)
  useEffect(() => {
    if (!mapReady) return
    applyAllStyles(mapRegion)
    if (mapRegion && DISTRICT_CENTERS[mapRegion]) {
      mapObj.current?.flyTo(DISTRICT_CENTERS[mapRegion], 12, { duration: 0.9 })
    } else if (!mapRegion) {
      mapObj.current?.flyTo([-6.87, 39.24], 10, { duration: 0.7 })
    }
  }, [mapRegion, mapReady, applyAllStyles])

  // ── District click ────────────────────────────────────────────────
  function handleDistrictClick(name: string) {
    onDistrictChange(name)
    onWardChange('')          // clear ward when district changes
    onVillageChange('')
    setWardSearch('')
  }

  // ── Ward list ─────────────────────────────────────────────────────
  const wardList = mapRegion ? WARD_DATA[mapRegion] ?? [] : []
  const filteredWards = wardSearch.trim()
    ? wardList.filter(w => w.toLowerCase().includes(wardSearch.toLowerCase()))
    : wardList

  const pickWard = (w: string) => {
    if (w === ward) {
      onWardChange('')
      return
    }
    onWardChange(w)
    // Silently correct the district to the TRUE district for this ward
    // (only differs for Ilala CBD wards — everything else is a no-op).
    const trueDistrict = WARD_TO_TRUE_DISTRICT[w] ?? mapRegion
    if (trueDistrict !== district) onDistrictChange(trueDistrict)
  }

  // ── Street suggestions ───────────────────────────────────────────
  // Pulled from the authoritative admin-divisions JSON for the current
  // true district + ward. Falls back to [] (empty datalist, pure free
  // text) if the ward isn't in the JSON for any reason — never blocks typing.
  const streetSuggestions: string[] =
    (district && ward && (darAdminDivisions as any)[district]?.[ward]) || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── MAP ── */}
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1.5px solid var(--clr-border)' }}>

        {/* instruction overlay when nothing selected */}
        {!district && mapReady && (
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(10,10,10,0.82)', color: '#fff', fontSize: 12, fontWeight: 500,
            padding: '6px 14px', borderRadius: 999, zIndex: 500, letterSpacing: '.3px',
            backdropFilter: 'blur(4px)', whiteSpace: 'nowrap',
          }}>
            Tap a district on the map
          </div>
        )}

        {/* selected district badge */}
        {district && (
          <div style={{
            position: 'absolute', top: 10, left: 12, zIndex: 500,
            background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(6px)',
            border: `1.5px solid ${ACCENT}`, color: ACCENT,
            fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 999,
            letterSpacing: '.5px', textTransform: 'uppercase',
          }}>
            {district}
            <button
              onClick={() => { onDistrictChange(''); onWardChange(''); onVillageChange(''); setWardSearch('') }}
              style={{
                marginLeft: 8, background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13, lineHeight: 1,
              }}
              aria-label="Clear district"
            >✕</button>
          </div>
        )}

        {!mapReady && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: '#0a0a0a', zIndex: 10, borderRadius: 12,
          }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Loading map…</span>
          </div>
        )}

        <div ref={mapRef} style={{ width: '100%', height: 280, background: '#0a0a0a' }} />
      </div>

      {loadError && (
        <p style={{ fontSize: 12, color: 'var(--clr-text-3)', marginTop: -4 }}>⚠ {loadError}</p>
      )}

      {/* ── FALLBACK — quick district buttons when map unavailable ── */}
      {loadError && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['Kinondoni', 'Ilala', 'Temeke', 'Ubungo', 'Kigamboni'] as const).map(d => (
            <button
              key={d}
              onClick={() => handleDistrictClick(d)}
              style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
                border: `1.5px solid ${mapRegion === d ? 'var(--clr-success)' : 'var(--clr-border)'}`,
                background: mapRegion === d ? 'var(--clr-success-lt)' : 'var(--clr-card)',
                color: mapRegion === d ? 'var(--clr-success)' : 'var(--clr-text-2)',
                fontWeight: mapRegion === d ? 700 : 400,
                transition: 'all .2s',
              }}
            >{d}</button>
          ))}
        </div>
      )}

      {/* ── WARD LIST (appears after district chosen) ── */}
      {district && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--clr-text-3)', letterSpacing: '.4px' }}>
              WARD — {mapRegion.toUpperCase()} <span style={{ fontWeight: 400, color: 'var(--clr-text-3)' }}>(optional, improves accuracy)</span>
            </label>
            {ward && (
              <button onClick={() => onWardChange('')}
                style={{ fontSize: 11, color: 'var(--clr-text-3)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Clear
              </button>
            )}
          </div>

          {/* Search box */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search wards…"
              value={wardSearch}
              onChange={e => setWardSearch(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                border: '1.5px solid var(--clr-border)',
                background: 'var(--clr-card)', color: 'var(--clr-text)',
                fontSize: 13, outline: 'none', boxSizing: 'border-box',
                transition: 'border-color .15s',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--clr-success)')}
              onBlur={e => (e.target.style.borderColor = 'var(--clr-border)')}
            />
          </div>

          {/* Ward chips */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 6,
            maxHeight: 160, overflowY: 'auto',
            paddingRight: 2,
          }}>
            {filteredWards.length === 0 && (
              <span style={{ fontSize: 13, color: 'var(--clr-text-3)' }}>No wards match your search.</span>
            )}
            {filteredWards.map(w => {
              const sel = w === ward
              return (
                <button
                  key={w}
                  onClick={() => pickWard(w)}
                  style={{
                    padding: '5px 12px', borderRadius: 999, fontSize: 12.5, cursor: 'pointer',
                    border: `1.5px solid ${sel ? 'var(--clr-success)' : 'var(--clr-border)'}`,
                    background: sel ? 'var(--clr-success-lt)' : 'var(--clr-card)',
                    color: sel ? 'var(--clr-success)' : 'var(--clr-text-2)',
                    fontWeight: sel ? 700 : 400, transition: 'all .15s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseOver={e => { if (!sel) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.4)' } }}
                  onMouseOut={e => { if (!sel) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--clr-border)' } }}
                >{w}</button>
              )
            })}
          </div>

          {ward && (
            <p style={{ fontSize: 12, color: 'var(--clr-success)', fontWeight: 600 }}>
              ✓ Ward selected: <strong>{ward}</strong>
            </p>
          )}
        </div>
      )}

      {/* ── STREET / VILLAGE (always visible after district) ── */}
      {district && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--clr-text-3)', letterSpacing: '.4px' }}>
            STREET / AREA <span style={{ fontWeight: 400 }}>(optional — pick a suggestion or type your own)</span>
          </label>
          <input
            type="text"
            list="street-suggestions"
            placeholder={`e.g. Kariakoo, Mnazi Mmoja…`}
            value={village}
            onChange={e => onVillageChange(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: '1.5px solid var(--clr-border)',
              background: 'var(--clr-card)', color: 'var(--clr-text)',
              fontSize: 13, outline: 'none', boxSizing: 'border-box',
              transition: 'border-color .15s',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--clr-border-focus, #888)')}
            onBlur={e => (e.target.style.borderColor = 'var(--clr-border)')}
          />
          {/* Suggestions only — this stays a free-text input, so a street
              not in the list can still be typed and submitted. */}
          <datalist id="street-suggestions">
            {streetSuggestions.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>
      )}
    </div>
  )
}
