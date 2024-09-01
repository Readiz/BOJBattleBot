/*

for (const [key, value] of mySearchParams) {
}
for (const [key, value] of mySearchParams.entries()) {
}


let paramsObj = { foo: "bar", baz: "bar" };
let searchParams = new URLSearchParams(paramsObj);

searchParams.toString(); // "foo=bar&baz=bar"
searchParams.has("foo"); // true
searchParams.get("foo"); // bar



const paramsString = "q=URLUtils.searchParams&topic=api";
let searchParams = new URLSearchParams(paramsString);

// 검색 매개변수 순회
for (let p of searchParams) {
  console.log(p);
}

searchParams.has("topic") === true; // true
searchParams.get("topic") === "api"; // true
searchParams.getAll("topic"); // ["api"]
searchParams.get("foo") === null; // true
searchParams.append("topic", "webdev");
searchParams.toString(); // "q=URLUtils.searchParams&topic=api&topic=webdev"
searchParams.set("topic", "More webdev");
searchParams.toString(); // "q=URLUtils.searchParams&topic=More+webdev"
searchParams.delete("topic");
searchParams.toString(); // "q=URLUtils.searchParams"

*/
module.exports = {
    async getRandomProblems(handles, difficulty) {
        try {
            let diffstart = difficulty[0];
            let diffend = difficulty[0];
            if (difficulty[1] == 'l') {
                diffstart += '5';
                diffend += '3';
            } else if (difficulty[1] == 'h') {
                diffstart += '3';
                diffend += '1';
            } else {
                diffstart += '5';
                diffend += '1';
            }

            let solved_filter = `lang:ko solvable:true solved:100.. tier:${diffstart}..${diffend}`;
            for(let handle of handles) {
                solved_filter += ` -solved_by:${handle}`;
            }
            console.log(solved_filter);
            let paramsObj = { 
                query: `${solved_filter}`,
                sort: 'random'
            };
            let searchParams = new URLSearchParams(paramsObj);
            // query=tier:g5...g1&sort=random
            console.log('url', `https://solved.ac/api/v3/search/problem?${searchParams.toString()}`);
            const queryResult = await fetch(`https://solved.ac/api/v3/search/problem?${searchParams.toString()}`);
            const { count, items } = await queryResult.json();
            // console.log(items.map(_ => _.problemId));
            // if (items.length < 5) return null;
            return items;
        } catch (e) {
            console.error('Request Error!', e);
            return null;
        }
    },
    async checkUserCanRegister(user_id) {
        let paramsObj = { query: `solved_by:${user_id}` };
        let searchParams = new URLSearchParams(paramsObj);
        try {
            const queryResult = await fetch(`https://solved.ac/api/v3/search/problem?${searchParams.toString()}`);
            const { count, items } = await queryResult.json();
            return count > 0;
        } catch (e) {
            console.error('Request Error!', e);
            return false;
        }
    },
    async checkUserSolvedReal(user_id, problemId) {
        let paramsObj = { query: `solved_by:${user_id} id:${problemId}` };
        console.log(paramsObj.query);
        let searchParams = new URLSearchParams(paramsObj);
        try {
            const queryResult = await fetch(`https://solved.ac/api/v3/search/problem?${searchParams.toString()}`);
            const { count, items } = await queryResult.json();
            console.log({count, items});
            return count > 0;
        } catch (e) {
            console.error('Request Error!', e);
            return false;
        }
    },
    async getProblemById(problemId) {
        let paramsObj = { query: `id:${problemId}` };
        console.log(paramsObj.query);
        let searchParams = new URLSearchParams(paramsObj);
        try {
            const queryResult = await fetch(`https://solved.ac/api/v3/search/problem?${searchParams.toString()}`);
            const { count, items } = await queryResult.json();
            console.log({count, items});
            if (count > 0) return items[0];
            else return null;
        } catch (e) {
            console.error('Request Error!', e);
            return null;
        }
    },
    async getRandomProblemsWithQuery(query) {
        try {
            let solved_filter = `solvable:true solved:100.. ${query}`;
            console.log(solved_filter);
            let paramsObj = { 
                query: `${solved_filter}`,
                sort: 'random'
            };
            let searchParams = new URLSearchParams(paramsObj);
            console.log('url', `https://solved.ac/api/v3/search/problem?${searchParams.toString()}`);
            const queryResult = await fetch(`https://solved.ac/api/v3/search/problem?${searchParams.toString()}`);
            const { count, items } = await queryResult.json();
            return items;
        } catch (e) {
            console.error('Request Error!', e);
            return null;
        }
    },
}