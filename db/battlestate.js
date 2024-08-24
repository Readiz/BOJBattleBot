const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    startChannelBattle(channelId, difficulty) {
        const dbPath = path.join(__dirname, 'data/battlestate.json');
        let res = {};
        const battleObj = {
            state: "waiting_register",
            difficulty,
            handles: [],
            userids: [],
        }
        try {
            res = JSON.parse(fs.readFileSync(dbPath));
            res[channelId] = battleObj;
        } catch (e) {
            res = {};
            res[channelId] = battleObj;
        }
        fs.writeFileSync(dbPath, JSON.stringify(res, null, 2));
    },
    removeChannelBattle(channelId) {
        const dbPath = path.join(__dirname, 'data/battlestate.json');
        let res = {};
        try {
            res = JSON.parse(fs.readFileSync(dbPath));
            delete res[channelId];
        } catch (e) {
            res = {};
        }
        fs.writeFileSync(dbPath, JSON.stringify(res, null, 2));
    },
    getChannelBattleState(channelId) {
        const dbPath = path.join(__dirname, 'data/battlestate.json');
        try {
            const res = JSON.parse(fs.readFileSync(dbPath))[channelId].state;
            if (res) {
                return res;
            }
            return null;
        } catch (e) {
            // console.error("Parse error", e);
            return null;
        }
    },
    getChannelBattleHandles(channelId) {
        const dbPath = path.join(__dirname, 'data/battlestate.json');
        try {
            const res = JSON.parse(fs.readFileSync(dbPath))[channelId].handles;
            if (res) {
                return res;
            }
            return null;
        } catch (e) {
            console.error("Parse error", e);
            return null;
        }
    },
    getChannelBattleUserIds(channelId) {
        const dbPath = path.join(__dirname, 'data/battlestate.json');
        try {
            const res = JSON.parse(fs.readFileSync(dbPath))[channelId].userids;
            if (res) {
                return res;
            }
            return null;
        } catch (e) {
            console.error("Parse error", e);
            return null;
        }
    },
    addUserToChannelBattle(channelId, userid, handle) {
        const dbPath = path.join(__dirname, 'data/battlestate.json');
        try {
            let res = JSON.parse(fs.readFileSync(dbPath));
            if (res[channelId].handles.indexOf(handle) == -1) {
                res[channelId].handles.push(handle);
                res[channelId].userids.push(userid);
            } else {
                return false;
            }
            fs.writeFileSync(dbPath, JSON.stringify(res, null, 2));
            return true;
        } catch (e) {
            console.error('add user fail', e);
        }
        return false;
    },
    endRegisterChannelBattle(channelId) {
        const dbPath = path.join(__dirname, 'data/battlestate.json');
        try {
            let res = JSON.parse(fs.readFileSync(dbPath));
            if (res[channelId].state == 'waiting_register') {
                res[channelId].state = 'making_game'
            } else {
                return false;
            }
            fs.writeFileSync(dbPath, JSON.stringify(res, null, 2));
            return true;
        } catch (e) {
            console.error('end register fail', e);
        }
        return false;
    },
    problemSelected(channelId, problemId) {
        const dbPath = path.join(__dirname, 'data/battlestate.json');
        try {
            let res = JSON.parse(fs.readFileSync(dbPath));
            if (res[channelId].state == 'making_game') {
                res[channelId].state = 'problem_selected'
                res[channelId].problemId = problemId;
                res[channelId].startTime = Date.now();
            } else {
                return false;
            }
            fs.writeFileSync(dbPath, JSON.stringify(res, null, 2));
            return true;
        } catch (e) {
            console.error('end register fail', e);
        }
        return false;
    },
}
