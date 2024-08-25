const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    getUser(userId) {
        const dbPath = path.join(__dirname, 'data/users.json');
        try {
            const res = JSON.parse(fs.readFileSync(dbPath))[userId];
            if (res) {
                return res;
            }
            return null;
        } catch (e) {
            console.error('Parse error', e);
            return null;
        }
    },
    getUserByHandle(solvedId) {
        const dbPath = path.join(__dirname, 'data/users.json');
        try {
            const db = JSON.parse(fs.readFileSync(dbPath));
            const keys = Object.keys(db);
    
            for (let key of keys) {
                if (db[key].handle === solvedId) {
                    return db[key];
                }
            }
            return null;
        } catch (e) {
            console.error('Parse error', e);
            return null;
        }
    },
    checkDuplicate(solvedId) {
        const dbPath = path.join(__dirname, 'data/users.json');
        try {
            const res = JSON.parse(fs.readFileSync(dbPath))['_registered_handles'];
            if (Array.isArray(res) && res.indexOf(solvedId) > -1) return true;
        } catch (e) {
            
        }
        return false;
    },
    registerUser(discordId, solvedId) {
        const dbPath = path.join(__dirname, 'data/users.json');
        let res = {
            '_registered_handles': []
        };
        const userObj = {
            handle: solvedId,
            rating: 1000,
            "solved": {
                "b": {
                    "challenge": 0,
                    "success": 0
                },
                "s": {
                    "challenge": 0,
                    "success": 0
                },
                "g": {
                    "challenge": 0,
                    "success": 0
                },
                "p": {
                    "challenge": 0,
                    "success": 0
                },
                "d": {
                    "challenge": 0,
                    "success": 0
                }
            }
        };
        try {
            res = JSON.parse(fs.readFileSync(dbPath));
        } catch (e) {
            console.error('Parse error', e);
        }
        if (!res['_registered_handles']) {
            res['_registered_handles'] = [];
        }
        res['_registered_handles'].push(solvedId);
        res[discordId] = userObj;
        fs.writeFileSync(dbPath, JSON.stringify(res, null, 2));
    },
    addChallengeCount(discordId, difficulty) {
        const dbPath = path.join(__dirname, 'data/users.json');
        try {
            let res = JSON.parse(fs.readFileSync(dbPath));
            res[discordId].solved[difficulty].challenge += 1;
            fs.writeFileSync(dbPath, JSON.stringify(res, null, 2));
        } catch (e) {
            console.error('addChallengeCount fail', e);
        }
    },
    addSuccessCount(discordId, difficulty) {
        const dbPath = path.join(__dirname, 'data/users.json');
        try {
            let res = JSON.parse(fs.readFileSync(dbPath));
            res[discordId].solved[difficulty].success += 1;
            fs.writeFileSync(dbPath, JSON.stringify(res, null, 2));
        } catch (e) {
            console.error('addSuccessCount fail', e);
        }
    },
    setPlaying(discordId) {
        const dbPath = path.join(__dirname, 'data/users.json');
        try {
            let res = JSON.parse(fs.readFileSync(dbPath));
            res[discordId].is_playing = true;
            fs.writeFileSync(dbPath, JSON.stringify(res, null, 2));
        } catch (e) {
            console.error('addSuccessCount fail', e);
        }
    },
    endPlaying(discordId) {
        const dbPath = path.join(__dirname, 'data/users.json');
        try {
            let res = JSON.parse(fs.readFileSync(dbPath));
            res[discordId].is_playing = false;
            fs.writeFileSync(dbPath, JSON.stringify(res, null, 2));
        } catch (e) {
            console.error('addSuccessCount fail', e);
        }
    },
}
