import React from 'react';

const layout = {
    // Top
    1: { x: 50, y: 15, labelX: 50, labelY: 9, anchor: 'middle' },  // Centrale
    
    // Upper Middle
    5: { x: 20, y: 40, labelX: 18, labelY: 41, anchor: 'end' },    // Fontana Oscura
    2: { x: 80, y: 40, labelX: 82, labelY: 41, anchor: 'start' },  // Porta Velaria
    
    // Middle Interchanges
    6: { x: 20, y: 65, labelX: 18, labelY: 66, anchor: 'end' },    // Borgo Sereno
    8: { x: 50, y: 65, labelX: 50, labelY: 59, anchor: 'middle' }, // Torre Cinerea
    3: { x: 80, y: 65, labelX: 82, labelY: 66, anchor: 'start' },  // Crocevia del Falco
    
    // Lower Middle
    7: { x: 20, y: 90, labelX: 18, labelY: 91, anchor: 'end' },    // Viale dei Mosaici
    9: { x: 50, y: 90, labelX: 50, labelY: 97, anchor: 'middle' }, // Campo dell'Eco
    4: { x: 80, y: 90, labelX: 82, labelY: 91, anchor: 'start' },  // Piazza delle Lanterne
    
    // Bottom Tails
    10: { x: 50, y: 115, labelX: 50, labelY: 122, anchor: 'middle' }, // Stazione Nord
    11: { x: 80, y: 115, labelX: 80, labelY: 122, anchor: 'middle' }, // Parco Ovest
    12: { x: 105, y: 115, labelX: 105, labelY: 109, anchor: 'middle' }, // Scalo Est
};

const getPastelColor = (colorStr) => {
    switch(colorStr.toLowerCase()) {
        case 'red': return '#ffb7b2';    // Pastel Pink/Red
        case 'blue': return '#a0c4ff';   // Pastel Blue
        case 'green': return '#caffbf';  // Pastel Mint Green
        case 'yellow': return '#fdffb6'; // Pastel Yellow
        default: return colorStr;
    }
};

export default function NetworkMap({ network, showLines = true }) {
    if (!network) return null;

    return (
        <div style={{ width: '100%', position: 'relative', paddingBottom: '90%' }}>
            <svg 
                viewBox="0 0 120 130" 
                style={{ 
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                    backgroundColor: '#faf9ff', borderRadius: '15px' 
                }}
            >
                <defs>
                    <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#b19cd9" floodOpacity="0.4" />
                    </filter>
                </defs>

                {/* 1. Draw Lines FIRST so they sit behind the stations */}
                {showLines && network.segments.map((seg, idx) => {
                    const p1 = layout[seg.stationA_id];
                    const p2 = layout[seg.stationB_id];
                    if (!p1 || !p2) return null;
                    return (
                        <line 
                            key={`line-${idx}`} 
                            x1={p1.x} y1={p1.y} 
                            x2={p2.x} y2={p2.y} 
                            stroke={getPastelColor(seg.line_color)} 
                            strokeWidth="4" 
                            strokeLinecap="round"
                        />
                    );
                })}

                {/* 2. Draw Stations and Text */}
                {network.stations.map(station => {
                    const p = layout[station.id];
                    if (!p) return null;
                    return (
                        <g key={`station-${station.id}`}>
                            {/* Station Node (Shadow applied here safely) */}
                            <circle 
                                cx={p.x} cy={p.y} r="3.5" 
                                fill="white" 
                                stroke="var(--bs-primary)" 
                                strokeWidth="1.5"
                                filter="url(#soft-shadow)"
                            />
                            {/* Station Label */}
                            <text 
                                x={p.labelX} y={p.labelY} 
                                fontSize="3.5" 
                                textAnchor={p.anchor} 
                                fill="var(--bs-dark)" 
                                fontWeight="bold"
                                style={{ pointerEvents: 'none' }}
                            >
                                {station.name}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}