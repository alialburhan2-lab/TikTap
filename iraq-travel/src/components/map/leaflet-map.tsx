"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";

export type MapMarker = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  color?: string;
  html?: string;
};

export type MapLine = { points: [number, number][]; color?: string; dashed?: boolean };

const MAPBOX = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function tileLayer() {
  if (MAPBOX) {
    return L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${MAPBOX}`, {
      tileSize: 512, zoomOffset: -1, maxZoom: 18,
      attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    });
  }
  return L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  });
}

function dot(color: string, selected: boolean) {
  const size = selected ? 22 : 16;
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.45)"></span>`,
  });
}

/** Thin imperative Leaflet wrapper (avoids SSR; markers are colour-coded divIcons). */
export default function LeafletMap({
  markers, lines = [], center = [33.2, 43.9], zoom = 6, height = 420, selectedId, onSelect, fitToMarkers = true,
}: {
  markers: MapMarker[]; lines?: MapLine[]; center?: [number, number]; zoom?: number; height?: number | string;
  selectedId?: string | null; onSelect?: (id: string) => void; fitToMarkers?: boolean;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!el.current || map.current) return;
    map.current = L.map(el.current, { scrollWheelZoom: false }).setView(center, zoom);
    tileLayer().addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = map.current;
    const g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    for (const ln of lines) {
      L.polyline(ln.points, { color: ln.color ?? "#b8892b", weight: 3, dashArray: ln.dashed ? "6 8" : undefined }).addTo(g);
    }
    for (const mk of markers) {
      const marker = L.marker([mk.lat, mk.lng], { icon: dot(mk.color ?? "#0f2a4a", mk.id === selectedId), title: mk.title, alt: mk.title, keyboard: true });
      if (mk.html) marker.bindPopup(mk.html, { maxWidth: 260 });
      marker.on("click", () => onSelectRef.current?.(mk.id));
      marker.addTo(g);
    }
    if (fitToMarkers && markers.length > 1) {
      m.fitBounds(L.latLngBounds(markers.map((x) => [x.lat, x.lng] as [number, number])), { padding: [30, 30], maxZoom: 12 });
    } else if (markers.length === 1) {
      m.setView([markers[0].lat, markers[0].lng], Math.max(zoom, 11));
    }
  }, [markers, lines, selectedId, fitToMarkers, zoom]);

  return <div ref={el} style={{ height }} className="z-0 w-full overflow-hidden rounded-2xl ring-1 ring-river-900/10" />;
}
