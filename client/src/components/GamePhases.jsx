import { useState, useEffect } from 'react';
import { Card, Button, Row, Col, ListGroup, Spinner } from 'react-bootstrap';
import NetworkMap from './NetworkMap';
import { useNavigate } from 'react-router-dom';



export function SetupPhase({ network, onStart }) {
    return (
        <Card className="pastel-card p-4 shadow-lg">
            <Row className="align-items-stretch">
                
                {/* LEFT SIDE: Rules & Start Button  */}
                <Col md={5} lg={4} className="d-flex flex-column justify-content-between pe-md-4 mb-4 mb-md-0">
                    <div>
                        <h2 className="mb-4" style={{ color: 'var(--bs-primary)', fontWeight: 'bold' }}>
                            <i className="bi bi-train-front"></i> Race the Rails
                        </h2>
                        
                        <h5 className="text-secondary mb-3">
                            <i className="bi bi-book"></i> Mission Briefing
                        </h5>
                        
                        <ul className="text-muted fs-6" style={{ lineHeight: '1.8', paddingLeft: '1.2rem' }}>
                            <li>You start the journey with <strong>20 coins</strong>.</li>
                            <li>You will be randomly assigned a <strong>Start</strong> and <strong>Destination</strong> station.</li>
                            <li>You have exactly <strong>90 seconds</strong> to reconstruct the network and plan a continuous route.</li>
                            <li>Every segment triggers a <strong>random event</strong> which may grant or steal coins.</li>
                            <li><span className="text-danger fw-bold">Beware:</span> Submitting a disconnected or invalid route results in <strong>0 coins</strong>!</li>
                        </ul>
                    </div>

                    <Button 
                        variant="primary" 
                        size="lg" 
                        className="w-100 shadow-sm mt-4 py-3" 
                        onClick={onStart}
                        style={{ borderRadius: '12px' }}
                    >
                        <i className="bi bi-play-circle-fill fs-4 me-2"></i> <span className="fs-5">Start Race</span>
                    </Button>
                </Col>

                {/* RIGHT SIDE: The Map  */}
                <Col md={7} lg={8}>
                    <div className="h-100 border rounded p-3 shadow-sm" style={{ backgroundColor: '#ffffff' }}>
                        <h5 className="text-center text-muted mb-3">Network Map</h5>
                        <NetworkMap network={network} showLines={true} />
                    </div>
                </Col>

            </Row>
        </Card>
    );
}


export function ExecutionPhase({ result, onComplete }) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (!result) return; //  waiting for API to return the log

        // If the route was invalid, skip animation
        if (!result.success || result.log.length === 0) {
            const t = setTimeout(onComplete, 3000);
            return () => clearTimeout(t);
        }

        // Animate the game execution step by step
        if (step < result.log.length) {
            const t = setTimeout(() => setStep(s => s + 1), 1500); 
            return () => clearTimeout(t);
        } else {
            const t = setTimeout(onComplete, 2000);
            return () => clearTimeout(t);
        }
    }, [step, result, onComplete]);

    if (!result) return <div className="text-center mt-5"><Spinner animation="border" variant="secondary" /></div>;

    if (!result.success) {
        return (
            <Card className="pastel-card p-5 text-center">
                <h2 className="text-danger"><i className="bi bi-exclamation-triangle"></i> Invalid Route!</h2>
                <p className="lead">{result.message}</p>
                <p>Moving to results...</p>
            </Card>
        );
    }

    const visibleLogs = result.log.slice(0, step);

    return (
        <Card className="pastel-card p-4">
            <h3 className="text-center mb-4">Executing Route...</h3>
            <ListGroup variant="flush">
                {visibleLogs.map((entry, idx) => (
                    <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-center">
                        <span>
                            <strong>Arrived at {entry.stationName}:</strong> {entry.event.description}
                        </span>
                        <span className={entry.event.effect >= 0 ? 'text-success' : 'text-danger'}>
                            {entry.event.effect > 0 ? '+' : ''}{entry.event.effect} <i className="bi bi-coin"></i>
                        </span>
                    </ListGroup.Item>
                ))}
            </ListGroup>
            {step < result.log.length && (
                <div className="text-center mt-4">
                    <Spinner animation="grow" variant="primary" size="sm" /> Traveling to next station...
                </div>
            )}
        </Card>
    );
}

export function ResultPhase({ result, onPlayAgain }) {
    const navigate = useNavigate();

    // If the route was invalid (Game Over)
    if (!result.success) {
        return (
            <Card className="pastel-card p-5 text-center shadow-lg" style={{ borderTop: '8px solid #ffb7b2' }}>
                <div className="mb-4">
                    <i className="bi bi-sign-dead-end-fill text-danger" style={{ fontSize: '5rem', opacity: 0.8 }}></i>
                </div>
                <h1 style={{ color: 'var(--bs-dark)', fontWeight: 'bold' }}>Route Failed!</h1>
                <p className="lead mt-3 text-muted" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    {result.message}
                </p>
                
                <div className="my-5 p-4 rounded" style={{ backgroundColor: '#fff5f5' }}>
                    <h4 className="text-danger m-0">Final Score: 0 <i className="bi bi-coin"></i></h4>
                    <small className="text-muted">You lost all your starting coins.</small>
                </div>

                <div className="d-flex justify-content-center gap-3">
                    <Button variant="outline-primary" size="lg" onClick={() => navigate('/rankings')}>
                        <i className="bi bi-trophy"></i> Leaderboard
                    </Button>
                    <Button variant="primary" size="lg" onClick={onPlayAgain}>
                        <i className="bi bi-arrow-clockwise"></i> Try Again
                    </Button>
                </div>
            </Card>
        );
    }

    // If the route was valid (Victory / Completed)
    return (
        <Card className="pastel-card p-5 text-center shadow-lg" style={{ borderTop: '8px solid var(--bs-primary)' }}>
            <div className="mb-3">
                <i className="bi bi-train-front-fill text-primary" style={{ fontSize: '4rem' }}></i>
            </div>
            <h1 style={{ color: 'var(--bs-primary)', fontWeight: 'bold' }}>Destination Reached!</h1>
            <p className="text-muted lead mt-2">You successfully navigated the underground.</p>

            <div className="my-5 p-4 rounded" style={{ backgroundColor: '#fdfbff', border: '1px solid #eef' }}>
                <h3 className="mb-3 text-secondary">Final Score:</h3>
                <div className="display-1 fw-bold text-warning">
                    {result.finalScore} <i className="bi bi-coin"></i>
                </div>
            </div>
            
            <div className="d-flex justify-content-center gap-3">
                <Button variant="outline-primary" size="lg" onClick={() => navigate('/rankings')}>
                    <i className="bi bi-trophy"></i> Leaderboard
                </Button>
                <Button variant="primary" size="lg" onClick={onPlayAgain}>
                    <i className="bi bi-arrow-clockwise"></i> Play Again
                </Button>
            </div>
        </Card>
    );
}