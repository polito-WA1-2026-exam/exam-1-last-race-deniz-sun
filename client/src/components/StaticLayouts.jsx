import { useEffect, useState, useContext } from 'react';
import { Row, Col, Card, Table, Spinner, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import { FeedbackContext } from '../App';

export function HomeLayout({ loggedIn }) {
    const navigate = useNavigate();
    return (
        <Row className="justify-content-center mt-5">
            <Col md={8}>
                <Card className="pastel-card p-5 text-center">
                    <h1 style={{ color: 'var(--bs-primary)' }}>Race the Rails</h1>
                    <p className="lead mt-3">
                        Welcome to the underground! You will be assigned a starting station and a destination. 
                        You have exactly 90 seconds to construct a valid route. 
                    </p>
                    <p>
                        Beware: Along the way, random events will increase or decrease your coins. 
                        If you submit an invalid or incomplete route, you lose everything!
                    </p>
                    {loggedIn ? (
                        <Button variant="primary" size="lg" className="mt-4" onClick={() => navigate('/play')}>
                            Enter the Underground
                        </Button>
                    ) : (
                        <div className="mt-4 text-muted">
                            <i className="bi bi-lock-fill"></i> Please login to view the map and play.
                        </div>
                    )}
                </Card>
            </Col>
        </Row>
    );
}

export function RankingsLayout() {
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const { setFeedbackFromError } = useContext(FeedbackContext);

    useEffect(() => {
        API.getRankings()
            .then(data => setRankings(data))
            .catch(err => setFeedbackFromError(err))
            .finally(() => setLoading(false));
    }, [setFeedbackFromError]);

    if (loading) return <div className="text-center mt-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <Row className="justify-content-center mt-4">
            <Col md={8}>
                <Card className="pastel-card p-4">
                    <h2 className="text-center mb-4">Global Leaderboard <i className="bi bi-trophy"></i></h2>
                    <Table hover responsive className="text-center">
                        <thead style={{ backgroundColor: 'var(--bs-primary)', color: 'white' }}>
                            <tr>
                                <th>Rank</th>
                                <th>Player</th>
                                <th>Best Score (Coins)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rankings.map((r, idx) => (
                                <tr key={idx}>
                                    <td>{idx + 1}</td>
                                    <td><strong>{r.username}</strong></td>
                                    <td>{r.best_score} <i className="bi bi-coin text-warning"></i></td>
                                </tr>
                            ))}
                            {rankings.length === 0 && (
                                <tr><td colSpan="3">No games played yet!</td></tr>
                            )}
                        </tbody>
                    </Table>
                </Card>
            </Col>
        </Row>
    );
}