/**
 * MapView Component
 * =================
 * Renders an interactive Mapbox GL JS map.
 *
 * Two modes:
 *   1. View mode (default): displays existing site polygons as a GeoJSON layer
 *   2. Draw mode (drawMode=true): enables Mapbox Draw for polygon creation
 *
 * The polygon drawing flow:
 *   1. User clicks the polygon draw tool in the Mapbox Draw toolbar
 *   2. User clicks to place vertices, double-clicks to close the polygon
 *   3. Mapbox Draw fires a 'draw.create' event with a GeoJSON Feature
 *   4. We extract feature.geometry and call onPolygonDrawn(geometry)
 *   5. The parent component sends this geometry to the backend API
 *
 * Why GeoJSON with coordinates [longitude, latitude]?
 *   Mapbox uses the GeoJSON standard (RFC 7946) where coordinates are [lon, lat]
 *   not [lat, lon]. PostGIS also uses this order with SRID 4326 (WGS84).
 */

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

// Mapbox token from environment variable
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || "";

export default function MapView({
  sites = [], // Array of site objects with GeoJSON geometry
  drawMode = false, // If true, enable Mapbox Draw for polygon creation
  onPolygonDrawn, // Callback: called with the drawn GeoJSON geometry
  onSiteClick, // Callback: called with the site object when user clicks a polygon
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);

  // Initialize the map once on mount
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      // Default center: Amazon basin (fits both demo sites nicely)
      center: sites.length > 0 ? getCentroid(sites) : [-59.9, -3.2],
      zoom: sites.length > 0 ? 6 : 4,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;

    map.on("load", () => {
      // Add sites as a GeoJSON source + polygon fill layer
      const geojsonData = buildGeoJSON(sites);

      map.addSource("sites", {
        type: "geojson",
        data: geojsonData,
      });

      // Semi-transparent fill
      map.addLayer({
        id: "sites-fill",
        type: "fill",
        source: "sites",
        paint: {
          "fill-color": "#16a34a",
          "fill-opacity": 0.3,
        },
      });

      // Outline
      map.addLayer({
        id: "sites-outline",
        type: "line",
        source: "sites",
        paint: {
          "line-color": "#15803d",
          "line-width": 2,
        },
      });

      // Click on a polygon to view site details
      map.on("click", "sites-fill", (e) => {
        const feature = e.features[0];
        if (feature && onSiteClick) {
          const site = sites.find((s) => s.id === feature.properties.id);
          if (site) onSiteClick(site);
        }
      });

      // Show pointer cursor when hovering polygons
      map.on("mouseenter", "sites-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "sites-fill", () => {
        map.getCanvas().style.cursor = "";
      });

      // If draw mode is enabled, add Mapbox Draw control
      if (drawMode) {
        const draw = new MapboxDraw({
          displayControlsDefault: false,
          controls: { polygon: true, trash: true },
        });
        map.addControl(draw, "top-right");
        drawRef.current = draw;

        // When a polygon is drawn, call the parent callback
        map.on("draw.create", (e) => {
          const feature = e.features[0];
          if (feature && onPolygonDrawn) {
            // geometry is { type: "Polygon", coordinates: [...] }
            onPolygonDrawn(feature.geometry);
          }
        });
      }
    });

    return () => map.remove();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update the GeoJSON source when sites change (after adding a new site)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("sites");
    if (source) {
      source.setData(buildGeoJSON(sites));
    }
  }, [sites]);

  return (
    <div className="map-wrapper">
      <div ref={mapContainerRef} className="map-container" />
      {drawMode && (
        <div className="map-instructions">
          🖊 Click the polygon tool (top-right) to start drawing a site boundary. Double-click to
          finish.
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildGeoJSON(sites) {
  return {
    type: "FeatureCollection",
    features: sites
      .filter((s) => s.geometry)
      .map((s) => ({
        type: "Feature",
        geometry: s.geometry,
        properties: { id: s.id, name: s.name },
      })),
  };
}

function getCentroid(sites) {
  // Use the first site's first coordinate as the map center
  const first = sites.find((s) => s.geometry?.coordinates?.[0]?.[0]);
  if (!first) return [-59.9, -3.2];
  const coords = first.geometry.coordinates[0];
  const lons = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  return [
    lons.reduce((a, b) => a + b, 0) / lons.length,
    lats.reduce((a, b) => a + b, 0) / lats.length,
  ];
}
