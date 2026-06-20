import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import * as dao from './dao.js';

const app = express();
const port = 3001;


let networkCache = { stations: [], segments: [] };
let validDestinationsCache = {}; // to store valid destinations that are >= 3 segments away for each station

async function initializeNetworkCache() {
    console.log("Pre-calculating network distances...");
    networkCache.stations = await dao.getStations();
    networkCache.segments = await dao.getValidSegments();

    // adjacency list for BFS
    const adj = {};
    networkCache.stations.forEach(s => adj[s.id] = []);
    networkCache.segments.forEach(seg => {
        adj[seg.stationA_id].push(seg.stationB_id);
        adj[seg.stationB_id].push(seg.stationA_id);
    });

    // pre calculate bfs once !
    networkCache.stations.forEach(startStation => {
        const distances = { [startStation.id]: 0 };
        const queue = [startStation.id];

        while (queue.length > 0) {
            const curr = queue.shift();
            for (const neighbor of adj[curr]) {
                if (distances[neighbor] === undefined) {
                    distances[neighbor] = distances[curr] + 1;
                    queue.push(neighbor);
                }
            }
        }

        // store only destinations that are >= 3 segments away
        validDestinationsCache[startStation.id] = Object.keys(distances)
            .filter(id => distances[id] >= 3)
            .map(Number); // Convert string keys back to numbers
    });
    console.log("Network cache initialized successfully.");
}

// middleware 
app.use(morgan('dev'));
app.use(express.json());
const corsOptions = {
    origin: 'http://localhost:5173', 
    credentials: true,
};
app.use(cors(corsOptions));

// passport setup
passport.use(new LocalStrategy(async function verify(username, password, cb) {
    try {
        const user = await dao.getUser(username, password);
        if (!user) return cb(null, false, { message: 'Incorrect username or password.' });
        return cb(null, user);
    } catch (err) {
        return cb(err);
    }
}));

passport.serializeUser((user, cb) => { cb(null, user.id); });
passport.deserializeUser(async (id, cb) => {
    try {
        const user = await dao.getUserById(id);
        cb(null, user);
    } catch (err) {
        cb(err, null);
    }
});

app.use(session({
    secret: 'web-applications-1-secret-string',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

// custom middleware to protect routes
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    return res.status(401).json({ error: 'Not authenticated' });
};

// authentication endpoints 

app.post('/api/sessions', function(req, res, next) {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ error: info.message });
        req.login(user, (err) => {
            if (err) return next(err);
            const safeUser = {
                id: req.user.id,
                username: req.user.username
            };
            return res.json(safeUser);
        });
    })(req, res, next);
});

app.get('/api/sessions/current', (req, res) => {
    if (req.isAuthenticated()) res.status(200).json(req.user);
    // instead of error, return a success with authentication: false
    else res.status(200).json({  isAuthenticated: false });
});

app.delete('/api/sessions/current', (req, res) => {
    req.logout(() => {
        res.status(200).json({});
    });
});

//  game logic

app.get('/api/network', isLoggedIn, async (req, res) => {
   res.json(networkCache);
});

app.get('/api/rankings', isLoggedIn, async (req, res) => {
    try {
        const rankings = await dao.getRankings();
        res.json(rankings);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/games/history', isLoggedIn, async (req, res) => {
    try {
        const history = await dao.getUserHistory(req.user.id);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});


app.post('/api/games/init', isLoggedIn, (req, res) => {
    // random start station
    const startStation = networkCache.stations[Math.floor(Math.random() * networkCache.stations.length)];
    
    // use the precalculated destinations that are >= 3 segments away
    const validDests = validDestinationsCache[startStation.id];
    const destId = validDests[Math.floor(Math.random() * validDests.length)];
    const destStation = networkCache.stations.find(s => s.id === destId);

    req.session.activeGame = {
        startId: startStation.id,
        destId: destStation.id
    };

    res.json({ startStation, destStation });
});

app.post('/api/games/submit', isLoggedIn, async (req, res) => {
    try {
        const { route } = req.body; 
        const activeGame = req.session.activeGame;
        // ensure gameData exists
        if (!activeGame) {
            return res.status(400).json({ error: 'No active game sesssion found.' });
        }

        req.session.activeGame = null;

        let isValid = true;
        let finalScore = 0;
        let log = [];

        const usedSegments = new Set();
        let currentStationId = activeGame.startId;

        // ensure route is a valid array with at least 1 segment
        if (!route || !Array.isArray(route) || route.length === 0) {
            isValid = false;
        } else {
            for (const segment of route) {
                if (!segment || !segment.stationA_id || !segment.stationB_id) {
                    isValid = false; break;
                }

                const exists = networkCache.segments.find(seg => 
                    (seg.stationA_id === segment.stationA_id && seg.stationB_id === segment.stationB_id) || 
                    (seg.stationA_id === segment.stationB_id && seg.stationB_id === segment.stationA_id)
                );
                if (!exists) { isValid = false; break; }

                const segId = segment.stationA_id < segment.stationB_id 
                    ? `${segment.stationA_id}-${segment.stationB_id}` 
                    : `${segment.stationB_id}-${segment.stationA_id}`;
                
                if (usedSegments.has(segId)) { isValid = false; break; }
                usedSegments.add(segId);

                if (segment.stationA_id === currentStationId) {
                    currentStationId = segment.stationB_id;
                } else if (segment.stationB_id === currentStationId) {
                    currentStationId = segment.stationA_id;
                } else {
                    isValid = false; break; 
                }
            }
        }

        // is final station reached  the destination ?
        if (isValid && currentStationId !== activeGame.destId) {
            isValid = false;
        }

        if (!isValid) {
            await dao.saveGame(req.user.id, 0); 
            return res.json({ 
                success: false, 
                message: 'Your route was incomplete, disconnected, or used invalid tracks. You got lost in the underground!',
                finalScore: 0,
                log: []
            });
        }

        let currentCoins = 20;
        let tracingStationId = activeGame.startId;

        for (const segment of route) {
            let nextStationId = segment.stationA_id === tracingStationId ? segment.stationB_id : segment.stationA_id;
            let nextStationName = segment.stationA_id === tracingStationId ? segment.stationB_name : segment.stationA_name;
            
            const event = await dao.getRandomEvent();
            currentCoins += event.effect;
            
            log.push({ stationName: nextStationName, event: event, currentCoins: currentCoins });
            tracingStationId = nextStationId; 
        }

        finalScore = Math.max(0, currentCoins);
        await dao.saveGame(req.user.id, finalScore);
        return res.json({ success: true, finalScore, log });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to process game submission' });
    }
});

// initialize cache before starting the server
initializeNetworkCache().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});