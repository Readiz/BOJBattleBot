const { HeaderGenerator } = require('header-generator');
const TurndownService = require('turndown');
const { parse } = require('node-html-parser');

const turndownService = new TurndownService();

let headerGenerator = new HeaderGenerator({
    browsers: [
        {name: "firefox", minVersion: 90},
        {name: "chrome", minVersion: 110},
        "safari"
    ],
    devices: [
        "desktop"
    ],
    operatingSystems: [
        "windows"
    ]
});

const fetchHtmlWithCustomHeaders = async (url) => {
    try {
        const response = await fetch(url, {
            method: 'GET', // 요청의 종류를 설정합니다 (GET, POST 등)
            headers: headerGenerator.getHeaders()
        });

        if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const root = parse(html);
        const want_delete = [root.querySelectorAll('#problem-lang-base64'), root.querySelectorAll('script'), root.querySelectorAll('#problem-info thead'), root.querySelectorAll('ul.problem-menu'), root.querySelectorAll('span.problem-label'), root.querySelectorAll('button.copy-button')];
        for(const cur of want_delete) {
            for(const item of cur) {
                item.set_content('');
            }
        }
        const sample_inputs = [];
        const sample_outputs = [];

        for(let idx = 1; idx <= 100; ++idx) {
            const id_input = 'sample-input-' + idx;
            const id_output = 'sample-output-' + idx;
            const cur_input = root.querySelector('#' + id_input) && root.querySelector('#' + id_input).innerHTML;
            const cur_output = root.querySelector('#' + id_output) && root.querySelector('#' + id_output).innerHTML;
            if (cur_input && cur_output) {
                sample_inputs.push(cur_input.trimEnd());
                sample_outputs.push(cur_output.trimEnd());
            } else {
                break;
            }
        }
        
        const contentDivs = root.querySelectorAll('div .container.content');
        if (contentDivs.length == 0) return '';
        const markdown = '# ' + turndownService.turndown(contentDivs[0].innerHTML);     
        return {
            html: root,
            markdown,
            sample_inputs,
            sample_outputs,
            sample_cnt: sample_inputs.length,
        }
    } catch (error) {
        console.error('Error fetching the HTML:', error);
    }
    return null;
};

module.exports = {
    async getProblemDesc(problem_num) {
        return await fetchHtmlWithCustomHeaders('https://www.acmicpc.net/problem/' + problem_num);
    }
}