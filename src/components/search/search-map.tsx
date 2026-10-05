"use client";

import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatPriceINR } from "@/lib/format";
import type { PublicListing } from "@/types/domain";

const icon = L.divIcon({
  className: "nv-marker",
  html: '<span class="nv-marker-dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export function SearchMap({ listings }: { listings: PublicListing[] }) {
  const center = listings[0] ? ([listings[0].lat, listings[0].lng] as [number, number]) : ([26.8467, 80.9462] as [number, number]);
  return (
    <div className="h-[420px] overflow-hidden rounded-3xl border border-border md:h-[560px]">
      <MapContainer center={center} zoom={12} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {listings.map((listing) => (
          <Marker key={listing.id} position={[listing.lat, listing.lng]} icon={icon} title={listing.title} alt={listing.title}>
            <Popup>
              <strong>{listing.title}</strong>
              <br />
              {formatPriceINR(listing.price)}
              <br />
              <Link href={`/property/${listing.slug}`}>View this home</Link>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
