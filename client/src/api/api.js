const SERVER_URL = 'http://localhost:3001/api';

const logIn = async (credentials) => {
    return await fetch(SERVER_URL + '/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
        body: JSON.stringify(credentials),
    }).then(handleInvalidResponse).then(response => response.json());
};
  
const getUserInfo = async () => {
    return await fetch(SERVER_URL + '/sessions/current', {
        credentials: 'include'
    }).then(handleInvalidResponse).then(response => response.json());
};
  
const logOut = async() => {
    return await fetch(SERVER_URL + '/sessions/current', {
        method: 'DELETE',
        credentials: 'include'
    }).then(handleInvalidResponse);
};

const getNetwork = async () => {
    return await fetch(SERVER_URL + '/network', { credentials: 'include' })
        .then(handleInvalidResponse).then(response => response.json());
};

const getRankings = async () => {
    return await fetch(SERVER_URL + '/rankings', { credentials: 'include' })
        .then(handleInvalidResponse).then(response => response.json());
};

const initGame = async () => {
    return await fetch(SERVER_URL + '/games/init', { 
        method: 'POST', 
        credentials: 'include' 
    }).then(handleInvalidResponse).then(response => response.json());
};

const submitGame = async (gameData, route) => {
    return await fetch(SERVER_URL + '/games/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gameData, route })
    }).then(handleInvalidResponse).then(response => response.json());
};

function handleInvalidResponse(response) {
    if (!response.ok) { throw Error(response.statusText) }
    let type = response.headers.get('Content-Type');
    if (type !== null && type.indexOf('application/json') === -1){
        throw new TypeError(`Expected JSON, got ${type}`)
    }
    return response;
}

const API = { logIn, getUserInfo, logOut, getNetwork, getRankings, initGame, submitGame };
export default API;