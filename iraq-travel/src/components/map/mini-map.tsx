"use client";

import dynamic from "next/dynamic";
import type { MapMarker } from "./leaflet-map";

const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => <div className="h-[320px] w-full animate-pulse rounded-2xl bg-sand-200" />,
});

export function MiniMap({ markers, height = 320 }: { markers: MapMarker[]; height?: number }) {
  return <LeafletMap markers={markers} height={height} />;
}
