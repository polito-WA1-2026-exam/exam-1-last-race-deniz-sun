import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import * as dao from './dao.js';

const app = express();
const port = 3001;

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
            return res.json(req.user);
        });
    })(req, res, next);
});

app.get('/api/sessions/current', (req, res) => {
    if (req.isAuthenticated()) res.status(200).json(req.user);
    else res.status(401).json({ error: 'Not authenticated' });
});

app.delete('/api/sessions/current', (req, res) => {
    req.logout(() => {
        res.status(200).json({});
    });
});

//  game logic

app.get('/api/network', isLoggedIn, async (req, res) => {
    try {
        const stations = await dao.getStations();
        const segments = await dao.getValidSegments();
        res.json({ stations, segments });
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.get('/api/rankings', isLoggedIn, async (req, res) => {
    try {
        const rankings = await dao.getRankings();
        res.json(rankings);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/games/init', isLoggedIn, async (req, res) => {
    try {
        const stations = await dao.getStations();
        const segments = await dao.getValidSegments();

        // adjacency list for bfs
        const adj = {};
        stations.forEach(s => adj[s.id] = []);
        segments.forEach(seg => {
            adj[seg.stationA_id].push(seg.stationB_id);
            adj[seg.stationB_id].push(seg.stationA_id);
        });

        // pick random station
        const startStation = stations[Math.floor(Math.random() * stations.length)];

        // run bfs to find all stations at least 3 segments away
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

        // filter valid destinations (distance >= 3)
        const validDestIds = Object.keys(distances).filter(id => distances[id] >= 3);
        const destId = validDestIds[Math.floor(Math.random() * validDestIds.length)];
        const destStation = stations.find(s => s.id === parseInt(destId));

        res.json({ startStation, destStation });
    } catch (err) {
        res.status(500).json({ error: 'Failed to initialize game' });
    }
});

app.post('/api/games/submit', isLoggedIn, async (req, res) => {
    try {
        const { route, gameData } = req.body; 
        
        // ensure gameData exists
        if (!gameData || !gameData.startStation || !gameData.destStation) {
            return res.status(400).json({ error: 'Missing game data.' });
        }

        let isValid = true;
        let finalScore = 0;
        let log = [];

        const segments = await dao.getValidSegments();
        const usedSegments = new Set();
        let currentStationId = gameData.startStation.id;

        // ensure route is a valid array with at least 1 segment
        if (!route || !Array.isArray(route) || route.length === 0) {
            isValid = false;
        } else {
            // loop through segments and validate
            for (const segment of route) {
                // ensure segment objects aren't missing data !
                if (!segment || !segment.stationA_id || !segment.stationB_id) {
                    isValid = false; break;
                }

                // check if segment actually exists in the network
                const exists = segments.find(seg => 
                    (seg.stationA_id === segment.stationA_id && seg.stationB_id === segment.stationB_id) || 
                    (seg.stationA_id === segment.stationB_id && seg.stationB_id === segment.stationA_id)
                );
                if (!exists) { isValid = false; break; }

                // check for duplicate segments (A-B is same as B-A) 
                
                const segId = segment.stationA_id < segment.stationB_id 
                    ? `${segment.stationA_id}-${segment.stationB_id}` 
                    : `${segment.stationB_id}-${segment.stationA_id}`;
                
                if (usedSegments.has(segId)) { isValid = false; break; }
                usedSegments.add(segId);

                // check path continuity, if they're actually connected to the current station
                if (segment.stationA_id === currentStationId) {
                    currentStationId = segment.stationB_id;
                } else if (segment.stationB_id === currentStationId) {
                    currentStationId = segment.stationA_id;
                } else {
                    isValid = false; break; // disconnected segment
                }
            }
        }

        // check if the final station reached is actually the destination that the game asks
        if (isValid && currentStationId !== gameData.destStation.id) {
            isValid = false;
        }

        //  invalid route handling
        if (!isValid) {
            await dao.saveGame(req.user.id, 0); // save this score as 0 -> game over
            return res.json({ 
                success: false, 
                message: 'Your route was incomplete, disconnected, or used invalid tracks. You got lost in the underground!',
                finalScore: 0,
                log: []
            });
        }

        // valid route execution
        let currentCoins = 20;
        let tracingStationId = gameData.startStation.id;

        for (const segment of route) {
            // determine which station is the arrival station
            let nextStationId = segment.stationA_id === tracingStationId ? segment.stationB_id : segment.stationA_id;
            let nextStationName = segment.stationA_id === tracingStationId ? segment.stationB_name : segment.stationA_name;
            
            const event = await dao.getRandomEvent();
            currentCoins += event.effect;
            
            log.push({
                stationName: nextStationName,
                event: event,
                currentCoins: currentCoins
            });

            tracingStationId = nextStationId; 
        }

        finalScore = Math.max(0, currentCoins);
        await dao.saveGame(req.user.id, finalScore);

        return res.json({ success: true, finalScore, log });

    } catch (err) {
        console.error("CRITICAL ERROR IN SUBMIT:", err); 
        res.status(500).json({ error: 'Failed to process game submission' });
    }
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});