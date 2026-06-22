import { useState, useEffect } from 'react';
import { Row, Col, Badge, Button, Card, ListGroup } from 'react-bootstrap';
import NetworkMap from './NetworkMap';

export default function PlanningPhase({ gameData, network, onSubmit }) {
    const [timeLeft, setTimeLeft] = useState(90);
    const [selectedSegments, setSelectedSegments] = useState([]);
    const [availableSegments, setAvailableSegments] = useState([]);

    // Initialize available segments
    useEffect(() => {
        if (network && network.segments) {
            const sorted = [...network.segments].map(seg => {
                if (seg.stationA_name > seg.stationB_name) {
                    return { ...seg, stationA_name: seg.stationB_name, stationB_name: seg.stationA_name, stationA_id: seg.stationB_id, stationB_id: seg.stationA_id };
                }
                return seg;
            }).sort((a, b) => a.stationA_name.localeCompare(b.stationA_name));
            setAvailableSegments(sorted);
        }
    }, [network]);

    // Timer Effect
    useEffect(() => {
        if (timeLeft <= 0) {
            onSubmit(selectedSegments);
            return;
        }
        const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timerId);
    }, [timeLeft, selectedSegments, onSubmit]);

    const addSegment = (segment) => {
        setSelectedSegments([...selectedSegments, segment]);
        setAvailableSegments(availableSegments.filter(s => s !== segment));
    };

    const removeSegment = (indexToRemove) => {
        const segment = selectedSegments[indexToRemove];
        const newSelected = selectedSegments.filter((_, idx) => idx !== indexToRemove);
        setSelectedSegments(newSelected);
        
        // Return to available pool and sort
        const newAvailable = [...availableSegments, segment].sort((a, b) => a.stationA_name.localeCompare(b.stationA_name));
        setAvailableSegments(newAvailable);
    };

    const flipSegment = (indexToFlip) => {
        const newSelected = [...selectedSegments];
        const seg = newSelected[indexToFlip];
        newSelected[indexToFlip] = {
            ...seg,
            stationA_id: seg.stationB_id,
            stationA_name: seg.stationB_name,
            stationB_id: seg.stationA_id,
            stationB_name: seg.stationA_name
        };
        setSelectedSegments(newSelected);
    };

    return (
        <Card className="pastel-card p-4">
            <Row className="align-items-center mb-3">
                <Col md={8}>
                    <h4 className="text-primary m-0">Mission: {gameData.startStation.name} <i className="bi bi-arrow-right"></i> {gameData.destStation.name}</h4>
                </Col>
                <Col md={4} className="text-md-end">
                    <h3 style={{ color: timeLeft <= 15 ? '#e8a29d' : 'var(--bs-primary)', margin: 0 }}>
                        <i className="bi bi-stopwatch"></i> {timeLeft}s
                    </h3>
                </Col>
            </Row>
            
            <Row>
                <Col md={7}>
                    {/* The Map */}
                    <div className="mb-3 border rounded p-2 bg-light shadow-sm">
                        <NetworkMap network={network} showLines={false} />
                    </div>

                    {/* The User's Built Route */}
                    <h5 className="text-secondary mt-4">Your Route</h5>
                    <div className="route-container p-3 border rounded bg-white shadow-sm" style={{ minHeight: '150px' }}>
                        {selectedSegments.length === 0 && <p className="text-muted text-center mt-4">Select segments from the right to build your path.</p>}
                        
                        {selectedSegments.map((seg, idx) => (
                            <div key={idx} className="d-flex align-items-center justify-content-between mb-2 p-2 border rounded" style={{ backgroundColor: '#fdfbff' }}>
                                <div className="d-flex align-items-center">
                                    <Badge bg="secondary" className="me-3">{idx + 1}</Badge> 
                                    <span className="fw-bold">{seg.stationA_name}</span> 
                                    
                                    {/* The FLIP button */}
                                    <Button variant="link" className="p-0 mx-2 text-primary" onClick={() => flipSegment(idx)} title="Flip direction">
                                        <i className="bi bi-arrow-right-circle-fill fs-5"></i>
                                    </Button>
                                    
                                    <span className="fw-bold">{seg.stationB_name}</span>
                                </div>
                                <Button variant="outline-danger" size="sm" onClick={() => removeSegment(idx)}><i className="bi bi-x-lg"></i></Button>
                            </div>
                        ))}
                    </div>
                    
                    <Button variant="success" className="w-100 mt-4 shadow-sm" size="lg" onClick={() => onSubmit(selectedSegments)}>
                        <i className="bi bi-check2-circle"></i> Submit Route
                    </Button>
                </Col>

                <Col md={5}>
                    {/* The Segment Pool */}
                    <h5 className="text-secondary">Available Connections</h5>
                    <ListGroup className="scrollable-segments shadow-sm" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        {availableSegments.map((seg, idx) => (
                            <ListGroup.Item action key={idx} onClick={() => addSegment(seg)} className="d-flex justify-content-between align-items-center border-bottom">
                                <div>
                                    <div className="fw-bold">{seg.stationA_name}</div>
                                    <div className="text-center"><i className="bi bi-arrow-down-up text-muted" style={{ fontSize: '0.8rem' }}></i></div>
                                    <div className="fw-bold">{seg.stationB_name}</div>
                                </div>
                                <i className="bi bi-plus-circle-fill text-primary fs-4"></i>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </Col>
            </Row>
        </Card>
    );
}