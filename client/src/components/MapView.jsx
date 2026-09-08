import React, { useEffect, useRef } from "react";

/**
 * Interactive job-location map using Leaflet + OpenStreetMap tiles, loaded via
 * CDN in index.html (no API key required, no paid mapping service). Renders
 * nothing but a helpful placeholder if the job has no coordinates on file.
 */
export default function MapView({ latitude, longitude, label }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!window.L || latitude == null || longitude == null) return;

    if (!mapRef.current) {
      mapRef.current = window.L.map(containerRef.current, {
        scrollWheelZoom: false,
      }).setView([latitude, longitude], 12);

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(mapRef.current);

      window.L.marker([latitude, longitude]).addTo(mapRef.current).bindPopup(label || "Job location");
    } else {
      mapRef.current.setView([latitude, longitude], 12);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  if (latitude == null || longitude == null) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-400 dark:text-slate-500">
        No map coordinates on file for this job's location.
      </div>
    );
  }

  return <div ref={containerRef} className="rounded-xl overflow-hidden h-64 w-full border border-slate-200 dark:border-slate-700" />;
}
