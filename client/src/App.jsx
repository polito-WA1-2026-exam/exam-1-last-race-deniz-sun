import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

import { useEffect, useState } from 'react';
import { Container, Toast, ToastBody, Spinner } from 'react-bootstrap';
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';

import Header from "./components/Header.jsx";
import { LoginForm } from './components/Auth.jsx';
import API from "./api/api.js";


import GameManager from './components/GameManager.jsx'; 
import { HomeLayout, RankingsLayout, HistoryLayout } from './components/StaticLayouts.jsx';

// Context
import React from 'react';
export const FeedbackContext = React.createContext();

function App() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true); // Prevents flickering on refresh
    const [feedback, setFeedback] = useState('');

    const setFeedbackFromError = (err) => {
        setFeedback(err.message || "Unknown Error");
    };

    useEffect(() => {
        // Check session on load
        API.getUserInfo()
            .then(user => {
                if (user.isAuthenticated === false) {
                    setLoggedIn(false);
                    setUser(null);
                } else {
                    setLoggedIn(true);
                    setUser(user);
                }
            })
            .catch(e => {
                setLoggedIn(false);
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleLogin = async (credentials) => {
        const user = await API.logIn(credentials);
        setUser(user); 
        setLoggedIn(true);
        setFeedback(`Welcome back, ${user.username}!`);
    };

    const handleLogout = async () => {
        await API.logOut();
        setLoggedIn(false); 
        setUser(null);
        setFeedback("Logged out successfully.");
        navigate('/'); 
    };

    if (loading) return <div className="vh-100 d-flex justify-content-center align-items-center"><Spinner animation="border" variant="primary" /></div>;

    return (
        <FeedbackContext.Provider value={{ setFeedback, setFeedbackFromError }}>
            <div className="min-vh-100 d-flex flex-column">
                <Header logout={handleLogout} user={user} loggedIn={loggedIn} />
                
                <Container fluid className="flex-grow-1 d-flex flex-column mt-3">
                    <Routes>
                        <Route path="/" element={<HomeLayout loggedIn={loggedIn} />} />
                        
                        <Route path="/play" element={
                            !loggedIn ? <Navigate replace to='/login' /> : <GameManager />
                        } />
                        
                        <Route path="/rankings" element={
                            !loggedIn ? <Navigate replace to='/login' /> : <RankingsLayout />
                        } />

                        <Route path="/history" element={
                            !loggedIn ? <Navigate replace to='login' /> : <HistoryLayout />
                        } />

                        <Route path="/login" element={ 
                            loggedIn ? <Navigate replace to='/' /> : <LoginForm login={handleLogin} />
                        } />

                        <Route path="*" element={<h2 className="text-center mt-5">404 - Page not found!</h2>} />
                    </Routes>
                </Container>

                <Toast 
                    show={feedback !== ''} 
                    autohide onClose={() => setFeedback('')} 
                    delay={4000} position="bottom-end" 
                    className="position-fixed bottom-0 end-0 m-3"
                >
                    <ToastBody>{feedback}</ToastBody>
                </Toast>
            </div>
        </FeedbackContext.Provider>
    );
}

export default App;