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
            "minigame": {
                "win": 0,
                "lose": 0
            },
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
                },
                "r": {
                    "challenge": 0,
                    "success": 0
                },
                "u": {
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
            if (res[discordId].solved[difficulty]) res[discordId].solved[difficulty].challenge += 1;
            else res[discordId].solved[difficulty] = { challenge: 1, success: 0 };
            fs.writeFileSync(dbPath, JSON.stringify(res, null, 2));
        } catch (e) {
            console.error('addChallengeCount fail', e);
        }
    },
    addSuccessCount(discordId, difficulty) {
        const dbPath = path.join(__dirname, 'data/users.json');
        try {
            let res = JSON.parse(fs.readFileSync(dbPath));
            if (res[discordId].solved[difficulty]) res[discordId].solved[difficulty].success += 1;
            else res[discordId].solved[difficulty] = { challenge: 1, success: 1 };
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
    addMiniGameWin(discordId) {
        const dbPath = path.join(__dirname, 'data/users.json');
        try {
            let res = JSON.parse(fs.readFileSync(dbPath));
            if (!res[discordId].minigame) {
                res[discordId].minigame = { win: 0, lose: 0};
            }
            if (!res[discordId].minigame.win) res[discordId].minigame.win = 1;
            else res[discordId].minigame.win += 1;
            fs.writeFileSync(dbPath, JSON.stringify(res, null, 2));
        } catch (e) {
            console.error('addWinCnt fail', e);
        }
    },
    addMiniGameLose(discordId) {
        const dbPath = path.join(__dirname, 'data/users.json');
        try {
            let res = JSON.parse(fs.readFileSync(dbPath));
            if (!res[discordId].minigame) {
                res[discordId].minigame = { win: 0, lose: 0};
            }
            if (!res[discordId].minigame.lose) res[discordId].minigame.lose = 1;
            else res[discordId].minigame.lose += 1;
            fs.writeFileSync(dbPath, JSON.stringify(res, null, 2));
        } catch (e) {
            console.error('addLoseCnt fail', e);
        }
    },
    applyNewRating(discordId, rating) {
        const dbPath = path.join(__dirname, 'data/users.json');
        try {
            let res = JSON.parse(fs.readFileSync(dbPath));
            res[discordId].rating = rating;
            fs.writeFileSync(dbPath, JSON.stringify(res, null, 2));
        } catch (e) {
            console.error('addLoseCnt fail', e);
        }
    },
}
