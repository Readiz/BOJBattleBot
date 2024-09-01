const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { getUser, addMiniGameWin, addMiniGameLose, applyNewRating } = require('../../db/users.js');
const wait = require('node:timers/promises').setTimeout;
const { calculateNewRating } = require('../../util/logic.js');
const solvedacQueryHelper = require('../../api/solvedac.js');
const bojQueryHelper = require('../../api/boj.js');
const gptQueryHelper = require('../../api/gpt.js');

const convertToNL = {
  greedy: '그리디',
  dp: 'DP',
  dp_greedy: 'DP + 그리디',
  none: '둘 다 아님'
};

const success = new ButtonBuilder()
	.setCustomId('greedy')
	.setLabel('그리디다!')
	.setStyle(ButtonStyle.Primary);
const dp = new ButtonBuilder()
  .setCustomId('dp')
  .setLabel('DP다!')
  .setStyle(ButtonStyle.Danger);
const dp_greedy = new ButtonBuilder()
  .setCustomId('dp_greedy')
  .setLabel('DP이면서 그리디다!')
  .setStyle(ButtonStyle.Success);
const none_of_the_ans = new ButtonBuilder()
  .setCustomId('none')
  .setLabel('둘 다 아니다.')
  .setStyle(ButtonStyle.Secondary);

const row = new ActionRowBuilder()
	.addComponents(success)
	.addComponents(dp)
	.addComponents(dp_greedy)
	.addComponents(none_of_the_ans);

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('미니게임')
		.setDescription('현재 채널에서 미니게임을 시작합니다.'),
	async execute(interaction) {

        await interaction.deferReply('미니게임을 준비하는 중...');
        // if (global_playing) {
        //     await interaction.editReply({ 
        //         content: '이미 게임이 진행 중입니다!'
        //     });
        //     return;
        // }

        const tag_case = Math.floor(Math.random() * 4);
        let result;
        let ans_case = '';
        if (tag_case == 0) {
          result = await solvedacQueryHelper.getRandomProblemsWithQuery('-tag:dp -tag:greedy');
          ans_case = 'none';
        } else if (tag_case == 1) {
          result = await solvedacQueryHelper.getRandomProblemsWithQuery('tag:dp -tag:greedy');
          ans_case = 'dp';
        } else if (tag_case == 2) {
          result = await solvedacQueryHelper.getRandomProblemsWithQuery('-tag:dp tag:greedy');
          ans_case = 'greedy';
        } else {
          result = await solvedacQueryHelper.getRandomProblemsWithQuery('tag:dp tag:greedy');
          ans_case = 'dp_greedy';
        }
        if (!result || result.length == 0) {
            await interaction.followUp({
                content: `문제 뽑기에 실패했습니다. 미니게임을 종료합니다.`
            });
            return;
        }
        
        const problemId = result[0].problemId;
        console.log('id', problemId);

        const bojRet = await bojQueryHelper.getProblemDesc(problemId);
        const markdown = String(bojRet.markdown);
        // console.log(markdown);
        const desc = markdown.match(/문제\s*--\s*([\s\S]*?)\s*입력\s*--/);
        if (!desc) {
          await interaction.followUp({
            content: `문제 뽑기에 실패했습니다. 미니게임을 종료합니다.`
          });
          return;
        }
        const simpleDesc = desc[1].trim().replace(/\n\n/g, '\n');
        console.log(simpleDesc);

        const refinedSimpleDesc = await gptQueryHelper.completions(simpleDesc, 'You are a helpful assistant. 너는 주어지는 문제 설명을 한국어로 최대한 가독성 있게 바꿔주는 역할을 할거야. 응답은 **문제설명**으로 시작하도록 해. 주어진 입력에 없는 추가적인 설명이나 힌트, 해결법을 덧붙이지마. Mathjax는 사용할 수 없는 환경이야. ($로 시작하고 $로 끝나는 형식을 사용할 수 없는 환경이란 뜻) 그러므로 수식을 최대한 간단하게 표현하고 markdown 문법과 충돌되지 않게 해. 용어가 헷갈리는게 있으면 Computer Science 기준으로 답변해줘. 혹시 설명에 ![](https://upload.acmicpc.net/~~)와 같은 괄호로 둘러싼 url 링크가 있으면, 마지막에 몰아서 url 링크를 심플하게 리스트로 제공해. 없으면 추가하지마.');

        const originalMessage = `**미니게임이 시작되었습니다.**\n정답은 3분 뒤에 공개합니다. 아래 설명을 보고 적절한 태그를 고르세요. \n\n` +
        `${refinedSimpleDesc}`;
        const response = await interaction.followUp({
            content: originalMessage,
            components: [row]
        });
        let ansList = [];
        let ansListDiscordId = [];
        let notAnsList = [];
        let notAnsListDiscordId = [];
        let answeredListDiscordId = [];
        const collector = response.createMessageComponentCollector({ time: 60_000 * 3 });

        collector.on('collect', async (confirmation) => {
            const userName = confirmation.user.username;
            const userId = confirmation.user.id;

            if (answeredListDiscordId.includes(userId)) {
                await confirmation.reply({ content: '이미 응답하셨습니다.', ephemeral: true });
                return;
            }

            if (confirmation.customId === ans_case) {
                ansList.push(userName);
                ansListDiscordId.push(userId);
            } else {
                notAnsList.push(userName);
                notAnsListDiscordId.push(userId);
            }

            answeredListDiscordId.push(userId);
            await confirmation.reply({ content: '응답 되었습니다! 잠시 뒤 정답이 공개됩니다.', ephemeral: true });
        });

        collector.on('end', (collected) => {
            console.log('응답 수집 종료:', collected.size);
            // 여기에 응답 수집 종료 후 처리 로직을 추가하세요.
        });
        await delay(1000 * 60 * 3);

        let regiUsers = [];
        for (const id of ansListDiscordId) {
          const userData = getUser(id);
          if (!userData) {
              continue;
          }
          addMiniGameWin(id);
          const newRating = calculateNewRating(userData.rating, 1500, 1);
          applyNewRating(id, newRating);
          regiUsers.push(userData.handle);
        }
        for (const id of notAnsListDiscordId) {
          const userData = getUser(id);
          if (!userData) {
              continue;
          }
          addMiniGameLose(id);
          const newRating = calculateNewRating(userData.rating, 1500, 0);
          applyNewRating(id, newRating);
          regiUsers.push(userData.handle);
        }

        const resultString = `**정답: ${convertToNL[ans_case]}**\n\n실제 백준 문제 번호: ${problemId}\nhttps://boj.ma/${problemId}/t\n\n정답자: ${ansListDiscordId.map(_=>`<@${_}>`).join(', ')}\n오답자: ${notAnsListDiscordId.map(_=>`<@${_}>`).join(', ')}\n\n미니게임 전적 반영된 핸들: ${[...new Set(regiUsers)].join(', ')}\n**Help: 미니게임의 전적을 반영하시려면, 먼저 /연동 커맨드로 solved.ac 계정을 연동해주세요.**`
        await interaction.followUp({
          content: resultString
        });
    }
};
