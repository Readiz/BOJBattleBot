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
            solved: [],
            run: 0
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
    addRunCount(discordId) {
        const dbPath = path.join(__dirname, 'data/users.json');
        try {
            let res = JSON.parse(fs.readFileSync(dbPath));
            if (!res[discordId].run) {
                res[discordId].run = 0;
            }
            res[discordId].run += 1;
            fs.writeFileSync(dbPath, JSON.stringify(res, null, 2));
        } catch (e) {
            console.error('add run cnt fail', e);
        }
    },
    addSolved(discordId, tier) {
        const dbPath = path.join(__dirname, 'data/users.json');
        try {
            let res = JSON.parse(fs.readFileSync(dbPath));
            if (!Array.isArray(res[discordId].solved)) {
                res[discordId].solved = [];
            }
            res[discordId].solved.push(tier);
            fs.writeFileSync(dbPath, JSON.stringify(res, null, 2));
        } catch (e) {
            console.error('add solved fail', e);
        }
    }
}
