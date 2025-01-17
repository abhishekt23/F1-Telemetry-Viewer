import React from "react";
import "./TrackMap.css";
import { Tooltip } from "react-tooltip";

function TrackMap({ trackData }) {
    const { circuitImage, sectors } = trackData;

    return (
        <div className="track-map-container">
            <h3>{trackData.trackName} Circuit</h3>
            <div className="map-container">
                <img src={circuitImage} alt={`${trackData.trackName} Circuit`} className="track-image" />
                <svg
                    className="track-overlay"
                    viewBox="0 0 800 600" // Adjust to match the image resolution
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {sectors.map((sector) => (
                        <line
                            key={sector.id}
                            x1={sector.x1}
                            y1={sector.y1}
                            x2={sector.x2}
                            y2={sector.y2}
                            stroke="blue"
                            strokeWidth="3"
                            data-tooltip-id="track-tooltip"
                            data-tooltip-content={`Sector ${sector.id}: ${sector.time}s`}
                            style={{ cursor: "pointer" }}
                        />
                    ))}
                </svg>
            </div>
            <Tooltip id="track-tooltip" />
        </div>
    );
}

export default TrackMap;
