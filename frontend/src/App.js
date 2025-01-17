import React, { useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    LinearScale,
    Title,
    Tooltip,
    Legend,
    CategoryScale,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import "./App.css";

ChartJS.register(
    LineElement,
    PointElement,
    LinearScale,
    Title,
    Tooltip,
    Legend,
    CategoryScale,
    zoomPlugin
);

const trackImages = {
    Bahrain: "/Bahrain_Circuit.avif",
    Monaco: "/Monaco_Circuit.avif",
    Silverstone: "/Silverstone_Circuit.avif",
    Singapore: "/Singapore_Circuit.avif",
    Qatar: "/Qatar_Circuit.avif",
    Canada: "/Canada_Circuit.avif",
    Abu_Dhabi: "/Abu_Dhabi_Circuit.avif",
};

const funFacts = {
    Bahrain: [
        "Bahrain hosted the first F1 race in the Middle East in 2004.",
        "It is known for its desert backdrop and night races.",
        "The track features a 1 km straight, ideal for overtaking.",
    ],
    Monaco: [
        "The Monaco Grand Prix is one of the most prestigious races in F1.",
        "It is known for its narrow streets and sharp corners.",
        "Qualifying is crucial due to limited overtaking opportunities.",
    ],
    Silverstone: [
        "Silverstone hosted the first F1 World Championship race in 1950.",
        "The circuit is one of the fastest tracks on the calendar.",
        "Famous corners include Maggotts, Becketts, and Chapel.",
    ],
    Singapore: [
        "The Singapore Grand Prix was the first night race in F1 history.",
        "The Marina Bay Street Circuit is known for its cityscape views.",
        "It has 23 corners, making it one of the most technical tracks.",
    ],
    Qatar: [
        "The Qatar Grand Prix debuted in 2021 at the Losail International Circuit.",
        "It is known for its flowing layout and floodlit races.",
        "The circuit features long straights and high-speed corners.",
    ],
    Canada: [
        "The Circuit Gilles Villeneuve is named after the legendary driver Gilles Villeneuve.",
        "The track is famous for the 'Wall of Champions.'",
        "It is known for its high-speed straights and tight corners.",
    ],
    Abu_Dhabi: [
        "The Yas Marina Circuit hosts the final race of the F1 season.",
        "The track features a unique pit exit that passes under the circuit.",
        "It offers stunning sunset views during the race.",
    ],
};

const availableTracks = Object.keys(trackImages);

const graphTypes = [
    {
        title: "Speed vs. Distance",
        dataKey: "speed",
        labelY: "Speed (km/h)",
        stroke1: "#007bff",
        stroke2: "#ff4500",
    },
    {
        title: "Throttle vs. Distance",
        dataKey: "throttle",
        labelY: "Throttle (%)",
        stroke1: "#28a745",
        stroke2: "#dc3545",
    },
    {
        title: "Brake Usage vs. Distance",
        dataKey: "brake",
        labelY: "Brake Usage (True/False)",
        stroke1: "#17a2b8",
    },
];

function App() {
    const [driver1, setDriver1] = useState("");
    const [driver2, setDriver2] = useState("");
    const [track, setTrack] = useState("Bahrain");
    const [year, setYear] = useState("");
    const [session, setSession] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [telemetry, setTelemetry] = useState(null);
    const [currentGraphIndex, setCurrentGraphIndex] = useState(0);
    const [analysis, setAnalysis] = useState("");
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);

    // Temporary state for user inputs
    const [tempDriver1, setTempDriver1] = useState("");
    const [tempDriver2, setTempDriver2] = useState("");
    const [tempTrack, setTempTrack] = useState("Bahrain");
    const [tempYear, setTempYear] = useState("");
    const [tempSession, setTempSession] = useState("");

    // Fetch Telemetry Handler
    const handleFetchTelemetry = () => {
        // Update main state for display purposes (optional)
        setDriver1(tempDriver1);
        setDriver2(tempDriver2);
        setTrack(tempTrack);
        setYear(tempYear);
        setSession(tempSession);
    
        // Pass the values directly to fetchTelemetry
        fetchTelemetry(tempDriver1, tempDriver2, tempTrack, tempYear, tempSession);
    };

    const fetchTelemetry = async (driver1, driver2, track, year, session) => {
        setLoading(true);
        setError(null);
        setTelemetry(null);
        setAnalysis(""); // Reset AI analysis
        setLoadingAnalysis(false); // Reset AI analysis loading state
    
        try {
            const response1 = await axios.get("http://127.0.0.1:5001/api/telemetry", {
                params: { driver: driver1, track, year, session },
            });
            const response2 = await axios.get("http://127.0.0.1:5001/api/telemetry", {
                params: { driver: driver2, track, year, session },
            });
    
            const circuitImage = trackImages[track] || "/default_circuit.png";
    
            const fetchedTelemetry = {
                driver1: { ...response1.data },
                driver2: { ...response2.data },
                circuitImage,
                funFacts: funFacts[track],
            };
            
            console.log(fetchedTelemetry.driver1, fetchedTelemetry.driver2); // Log the raw telemetry data here
            setTelemetry(fetchedTelemetry);
            
        } catch (err) {
            console.error(err);
            setError("Failed to fetch telemetry data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const analyzeData = async () => {
        if (!telemetry) return;
        setLoadingAnalysis(true);

        try {
            const response = await axios.post("http://127.0.0.1:5001/api/analyze", { telemetry });
            setAnalysis(response.data.analysis);
        } catch (err) {
            console.error(err);
            alert("Failed to analyze data.");
        } finally {
            setLoadingAnalysis(false);
        }
    };

    const renderGraph = (graphType) => {
        if (!telemetry || !telemetry.driver1[graphType.dataKey]) {
            return <p>No data available for {graphType.title}</p>;
        }

        const labels = telemetry.driver1[graphType.dataKey].map((_, index) => index);

        const data = {
            labels,
            datasets: [
                {
                    label: driver1,
                    data: telemetry.driver1[graphType.dataKey],
                    borderColor: graphType.stroke1,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                },
                telemetry.driver2[graphType.dataKey] && {
                    label: driver2,
                    data: telemetry.driver2[graphType.dataKey],
                    borderColor: graphType.stroke2,
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                },
            ].filter(Boolean),
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "top" },
                tooltip: { mode: "index", intersect: false },
                zoom: {
                    pan: { enabled: true, mode: "x" },
                    zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" },
                },
            },
            scales: {
                x: { title: { display: true, text: "Distance (m)" } },
                y: { title: { display: true, text: graphType.labelY } },
            },
        };

        return (
            <div style={{ height: "350px", width: "100%" }}>
                <Line data={data} options={options} />
            </div>
        );
    };

    return (
        <div className="app-container">
            <h1>F1 Telemetry Viewer</h1>
            <div className="form">
                <input
                    type="text"
                    placeholder="Driver 1 (e.g., VER)"
                    value={tempDriver1}
                    onChange={(e) => setTempDriver1(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Driver 2 (e.g., LEC)"
                    value={tempDriver2}
                    onChange={(e) => setTempDriver2(e.target.value)}
                />
                <select
                    value={tempTrack}
                    onChange={(e) => setTempTrack(e.target.value)}
                    >
                    {availableTracks.map((trackName) => (
                        <option key={trackName} value={trackName}>
                            {trackName}
                        </option>
                    ))}
                </select>
                <input
                    type="number"
                    placeholder="Year (e.g., 2024)"
                    value={tempYear}
                    onChange={(e) => setTempYear(e.target.value)}
                />
                <input
                    type="text"
                    placeholder="Session (e.g., Q)"
                    value={tempSession}
                    onChange={(e) => setTempSession(e.target.value)}
                />
                <button onClick={handleFetchTelemetry}>Fetch Telemetry</button>
            </div>

            {loading && (
                <div className="loading">
                    <div className="spinner"></div>
                </div>
            )}
            {error && <p className="error">{error}</p>}
            {telemetry && (
                <>
                    <div className="telemetry-card">
                        <h2>Telemetry Data</h2>
                        {/* Details Section */}
                        <div className="telemetry-details">
                            <p><strong>Track:</strong> {track}</p>
                            <p><strong>Year:</strong> {year}</p>
                            <p><strong>Session:</strong> {session}</p>
                        </div>

                        {/* Sector Times Comparison Table */}
                        {telemetry.driver1.sector_times && telemetry.driver2.sector_times && (
                            <>
                                <h3>Sector Times Comparison</h3>
                                <table className="comparison-table">
                                    <thead>
                                        <tr>
                                            <th>Sector</th>
                                            <th>{driver1}</th>
                                            <th>{driver2}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {telemetry.driver1.sector_times.map((time1, index) => (
                                            <tr key={index}>
                                                <td>Sector {index + 1}</td>
                                                <td>{time1} seconds</td>
                                                <td>{telemetry.driver2.sector_times[index]} seconds</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}

                        {/* Track and Fun Facts Section */}
                        <div className="track-facts-container">
                            <div className="track-container">
                                <h3>{track} Circuit</h3>
                                <img
                                    src={telemetry.circuitImage}
                                    alt={`${track} Circuit`}
                                    className="track-image"
                                />
                            </div>
                            <div className="fun-facts">
                                <h3>Fun Facts About The {track} Circuit</h3>
                                <ul>
                                    {telemetry.funFacts.map((fact, index) => (
                                        <li key={index}>{fact}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="graph-container">
                            <h3>{graphTypes[currentGraphIndex].title}</h3>
                            {renderGraph(graphTypes[currentGraphIndex])}
                            <div className="graph-selector">
                                <button
                                    onClick={() =>
                                        setCurrentGraphIndex((prevIndex) =>
                                            (prevIndex - 1 + graphTypes.length) % graphTypes.length
                                        )
                                    }
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() =>
                                        setCurrentGraphIndex((prevIndex) =>
                                            (prevIndex + 1) % graphTypes.length
                                        )
                                    }
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="ai-analysis-container">
                        <button className="analyze-button" onClick={analyzeData}>
                            Analyze Data
                        </button>
                        {loadingAnalysis && <p>Loading AI Analysis...</p>}
                        {analysis && (
                            <div className="analysis-output">
                                <h3 className="analysis-title">AI Analysis</h3>
                                {analysis.split("\n").map((line, index) => {
                                    if (
                                        line.startsWith("1.") ||
                                        line.startsWith("2.") ||
                                        line.startsWith("3.") ||
                                        line.startsWith("4.")
                                    ) {
                                        // Handle numbered sections as headers
                                        return (
                                            <h4 key={index} className="analysis-heading">
                                                {line.trim()}
                                            </h4>
                                        );
                                    } else if (line.trim().startsWith("-")) {
                                        // Handle bullet points
                                        return (
                                            <p key={index} className="analysis-bullet">
                                                {line.trim()}
                                            </p>
                                        );
                                    } else if (line.trim() !== "") {
                                        // Handle regular paragraphs
                                        return (
                                            <p key={index} className="analysis-paragraph">
                                                {line.trim()}
                                            </p>
                                        );
                                    }
                                    return null; // Ignore empty lines
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default App;

