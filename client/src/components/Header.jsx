import { Container, Navbar, Nav } from "react-bootstrap";
import { Link, NavLink } from "react-router-dom";
import { LogoutButton, LoginButton } from './Auth';

export default function Header(props) {
    return (
        <Navbar expand="md" style={{ backgroundColor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <Container fluid>
                <Navbar.Brand as={Link} to="/" style={{ color: 'var(--bs-primary)', fontWeight: 'bold' }}>
                    <i className="bi bi-train-front"></i> Race the Rails
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={NavLink} to="/">Home</Nav.Link>
                        {props.loggedIn && (
                            <>
                                <Nav.Link as={NavLink} to="/play">Play Game</Nav.Link>
                                <Nav.Link as={NavLink} to="/rankings">Leaderboard</Nav.Link>
                            </>
                        )}
                    </Nav>
                    <Nav>
                        {props.loggedIn ? (
                            <span className="navbar-text d-flex align-items-center">
                                Logged in as: <strong className="ms-1 me-3">{props.user?.username}</strong>
                                <LogoutButton logout={props.logout} />
                            </span>
                        ) : <LoginButton />}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}