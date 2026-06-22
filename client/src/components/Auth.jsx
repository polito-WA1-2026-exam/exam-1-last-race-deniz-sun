import { useState } from 'react';
import { Alert, Button, Col, Form, Row, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import PropTypes from "prop-types";

function LoginForm(props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    const credentials = { username, password };

    props.login(credentials)
      .then(() => navigate("/"))
      .catch((err) => {
        setErrorMessage(err.message === "Unauthorized" ? "Invalid username and/or password" : err.message);
        setShow(true);
      });
  };

  return (
    <Row className="mt-5 justify-content-md-center">
      <Col md={5}>
        <Card className="pastel-card p-4">
          <h2 className="pb-3 text-center" style={{ color: 'var(--bs-primary)' }}>Welcome Back</h2>
          <Form onSubmit={handleSubmit}>
            <Alert dismissible show={show} onClose={() => setShow(false)} variant="danger">
              {errorMessage}
            </Alert>
            <Form.Group className="mb-3" controlId="username">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text" value={username} placeholder="Enter your username"
                onChange={(ev) => setUsername(ev.target.value)} required={true}
              />
            </Form.Group>
            <Form.Group className="mb-4" controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password" value={password} placeholder="Enter your password"
                onChange={(ev) => setPassword(ev.target.value)} required={true}
              />
            </Form.Group>
            <div className="d-grid">
              <Button variant="primary" type="submit" size="lg">Login</Button>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  )
}

LoginForm.propTypes = { login: PropTypes.func }

function LogoutButton({ logout }) {
  return <Button variant="outline-danger" className="ms-2" onClick={logout}>Logout</Button>
}

function LoginButton() {
  const navigate = useNavigate();
  return <Button variant="primary" onClick={() => navigate('/login')}>Login</Button>
}

export { LoginForm, LogoutButton, LoginButton };