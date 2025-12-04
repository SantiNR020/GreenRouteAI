import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ChangeView({ center, zoom }) {
    const map = useMap();
    map.setView(center, zoom);
    return null;
}

const MapComponent = ({ routeData, obstacles = [] }) => {
    const defaultCenter = [37.310142, -5.940794]; // Universidad Loyola
    const defaultZoom = 13;

    let positions = [];
    let center = defaultCenter;
    let zoom = defaultZoom;

    if (routeData && routeData.paths && routeData.paths.length > 0) {
        const path = routeData.paths[0];
        positions = path.points.coordinates.map(coord => [coord[1], coord[0]]); // GeoJSON is [lng, lat], Leaflet is [lat, lng]
        if (positions.length > 0) {
            center = positions[0];
            zoom = 15;
        }
    }

    // Custom Icon for Obstacles
    const obstacleIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    return (
        <div className="h-[600px] w-full rounded-lg overflow-hidden shadow-lg border border-gray-200">
            <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <ChangeView center={center} zoom={zoom} />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {positions.length > 0 && (
                    <>
                        <Polyline positions={positions} color="blue" />
                        <Marker position={positions[0]}>
                            <Popup>Start</Popup>
                        </Marker>
                        <Marker position={positions[positions.length - 1]}>
                            <Popup>End</Popup>
                        </Marker>
                    </>
                )}

                {obstacles.map((obs, idx) => (
                    <Marker key={idx} position={[obs.lat, obs.lng]} icon={obstacleIcon}>
                        <Popup>
                            <div className="text-center">
                                <strong className="text-red-600">Obstacle Detected</strong>
                                <p>{obs.types.join(", ")}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
