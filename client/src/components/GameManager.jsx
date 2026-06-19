import { useState, useEffect, useContext } from 'react';
import { Spinner, Container } from 'react-bootstrap';
import API from '../api/api.js';
import { FeedbackContext } from '../App';
import PlanningPhase from './PlanningPhase';
import { SetupPhase, ExecutionPhase, ResultPhase } from './GamePhases';

export default function GameManager() {
    const [network, setNetwork] = useState(null);
    const [phase, setPhase] = useState('setup'); // 'setup' | 'planning' | 'execution' | 'result'
    const [gameData, setGameData] = useState(null);
    const [executionResult, setExecutionResult] = useState(null);
    const { setFeedbackFromError } = useContext(FeedbackContext);

    // Fetch network data on load
    useEffect(() => {
        API.getNetwork()
            .then(data => setNetwork(data))
            .catch(err => setFeedbackFromError(err));
    }, [setFeedbackFromError]);

    const startPlanning = async () => {
        try {
            const data = await API.initGame();
            setGameData(data);
            setPhase('planning');
        } catch (err) {
            setFeedbackFromError(err);
        }
    };

    const submitRoute = async (builtRoute) => {
        // Temporarily set to execution to show a loading state if needed
        setPhase('execution'); 
        try {
            const result = await API.submitGame(gameData, builtRoute);
            setExecutionResult(result);
            
            if (!result.success) {
                // If invalid, SKIP execution phase and go straight to result
                setPhase('result'); 
            }
        } catch (err) {
            setFeedbackFromError(err);
            setPhase('setup'); // Fallback
        }
    };

    if (!network) return <div className="text-center mt-5"><Spinner animation="border" variant="primary" /></div>;

    return (
        <Container className="mt-3">
            {phase === 'setup' && <SetupPhase network={network} onStart={startPlanning} />}
            {phase === 'planning' && <PlanningPhase gameData={gameData} network={network} onSubmit={submitRoute} />}
            {phase === 'execution' && <ExecutionPhase result={executionResult} onComplete={() => setPhase('result')} />}
            {phase === 'result' && <ResultPhase result={executionResult} onPlayAgain={() => setPhase('setup')} />}
        </Container>
    );
}