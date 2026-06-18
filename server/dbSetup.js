import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import crypto from 'crypto';

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 31000, 32, 'sha256').toString('hex');
    return { salt, hash };
}

async function setupDatabase() {
    console.log("Opening database connection...");
    const db = await open({
        filename: 'last_race.sqlite',
        driver: sqlite3.Database
    });

    console.log("Dropping existing tables...");
    await db.exec(`
        DROP TABLE IF EXISTS games;
        DROP TABLE IF EXISTS events;
        DROP TABLE IF EXISTS line_stations;
        DROP TABLE IF EXISTS stations;
        DROP TABLE IF EXISTS lines;
        DROP TABLE IF EXISTS users;
    `);

    console.log("Creating tables...");
    await db.exec(`
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            salt TEXT NOT NULL
        );

        CREATE TABLE lines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            color TEXT NOT NULL
        );

        CREATE TABLE stations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        );

        CREATE TABLE line_stations (
            line_id INTEGER,
            station_id INTEGER,
            stop_number INTEGER NOT NULL,
            PRIMARY KEY (line_id, station_id),
            FOREIGN KEY (line_id) REFERENCES lines(id),
            FOREIGN KEY (station_id) REFERENCES stations(id)
        );

        CREATE TABLE events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            description TEXT NOT NULL,
            effect INTEGER NOT NULL CHECK (effect >= -4 AND effect <= 4)
        );

        CREATE TABLE games (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    `);

    console.log("Seeding data...");

    const users = ['blossom', 'buttercup', 'bubbles'];
    for (const u of users) {
        const { salt, hash } = hashPassword('password');
        await db.run('INSERT INTO users (username, password, salt) VALUES (?, ?, ?)', [u, hash, salt]);
    }

    await db.exec(`
        INSERT INTO lines (id, name, color) VALUES 
        (1, 'Red Line', 'red'),
        (2, 'Blue Line', 'blue'),
        (3, 'Green Line', 'green'),
        (4, 'Yellow Line', 'yellow');
    `);


    const stations = [
        "Centrale", "Porta Velaria", "Crocevia del Falco", "Piazza delle Lanterne",
        "Fontana Oscura", "Borgo Sereno", "Viale dei Mosaici", "Torre Cinerea",
        "Campo dell'Eco", "Stazione Nord", "Parco Ovest", "Scalo Est"
    ];
    for (let i = 0; i < stations.length; i++) {
        await db.run('INSERT INTO stations (id, name) VALUES (?, ?)', [i + 1, stations[i]]);
    }

    await db.exec(`
        -- Red Line (1)
        INSERT INTO line_stations (line_id, station_id, stop_number) VALUES
        (1, 1, 1),  -- Centrale
        (1, 2, 2),  -- Porta Velaria
        (1, 3, 3),  -- Crocevia del Falco
        (1, 4, 4);  -- Piazza delle Lanterne

        -- Blue Line (2)
        INSERT INTO line_stations (line_id, station_id, stop_number) VALUES
        (2, 1, 1),  -- Centrale (Interchange!)
        (2, 5, 2),  -- Fontana Oscura
        (2, 6, 3),  -- Borgo Sereno
        (2, 7, 4);  -- Viale dei Mosaici

        -- Green Line (3)
        INSERT INTO line_stations (line_id, station_id, stop_number) VALUES
        (3, 2, 1),  -- Porta Velaria (Interchange!)
        (3, 5, 2),  -- Fontana Oscura (Interchange!)
        (3, 8, 3),  -- Torre Cinerea
        (3, 9, 4),  -- Campo dell'Eco
        (3, 10, 5); -- Stazione Nord

        -- Yellow Line (4)
        INSERT INTO line_stations (line_id, station_id, stop_number) VALUES
        (4, 4, 1),  -- Piazza delle Lanterne (Interchange!)
        (4, 8, 2),  -- Torre Cinerea (Interchange!)
        (4, 7, 3),  -- Viale dei Mosaici (Interchange!)
        (4, 9, 4),  -- Campo dell'Eco (Interchange!)
        (4, 11, 5), -- Parco Ovest
        (4, 12, 6); -- Scalo Est
    `);

    await db.exec(`
        INSERT INTO events (description, effect) VALUES
        ('Quiet journey', 0),
        ('Wrong platform', -2),
        ('Kind passenger', 1),
        ('Pickpocket', -4),
        ('Found a dropped coin', 2),
        ('Train delayed', -1),
        ('Express train', 3),
        ('Turnstile malfunction', -3);
    `);

    await db.exec(`
        INSERT INTO games (user_id, score) VALUES
        (1, 15),
        (1, 22),
        (2, 0),
        (2, 5);
    `);

    console.log("Database setup complete! File 'last_race.sqlite' created.");
    await db.close();
}

setupDatabase().catch(err => {
    console.error("Error setting up database:", err);
});