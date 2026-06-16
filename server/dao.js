import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import crypto from 'crypto';


let db;
open({
    filename: 'last_race.sqlite',
    driver: sqlite3.Database
}).then(database => {
    db = database;
});

//  AUTHENTICATION 

export async function getUser(username, password) {
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return null;

    // Verify password
    const hashedPassword = crypto.scryptSync(password, user.salt, 31000, 32, 'sha256').toString('hex');
    if (crypto.timingSafeEqual(Buffer.from(user.password, 'hex'), Buffer.from(hashedPassword, 'hex'))) {
        return { id: user.id, username: user.username };
    }
    return null;
}

export async function getUserById(id) {
    const user = await db.get('SELECT id, username FROM users WHERE id = ?', [id]);
    return user || null;
}

//  NETWORK DATA 

export async function getStations() {
    return await db.all('SELECT * FROM stations');
}

export async function getValidSegments() {
    const query = `
        SELECT 
            ls1.station_id as stationA_id, 
            s1.name as stationA_name,
            ls2.station_id as stationB_id, 
            s2.name as stationB_name,
            l.name as line_name,
            l.color as line_color
        FROM line_stations ls1
        JOIN line_stations ls2 ON ls1.line_id = ls2.line_id 
        JOIN stations s1 ON ls1.station_id = s1.id
        JOIN stations s2 ON ls2.station_id = s2.id
        JOIN lines l ON ls1.line_id = l.id
        WHERE ls2.stop_number = ls1.stop_number + 1;
    `;
    return await db.all(query);
}

//  GAME LOGIC 

export async function getRandomEvent() {
    return await db.get('SELECT * FROM events ORDER BY RANDOM() LIMIT 1');
}

export async function saveGame(userId, score) {
    const finalScore = Math.max(0, score); // Prevent negative scores in DB
    const result = await db.run('INSERT INTO games (user_id, score) VALUES (?, ?)', [userId, finalScore]);
    return result.lastID;
}

// RANKINGS 

export async function getRankings() {
    const query = `
        SELECT users.username, MAX(games.score) as best_score
        FROM games
        JOIN users ON games.user_id = users.id
        GROUP BY users.id
        ORDER BY best_score DESC
    `;
    return await db.all(query);
}