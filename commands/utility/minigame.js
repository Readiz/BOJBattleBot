const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { getUser, addChallengeCount, addSuccessCount, setPlaying, endPlaying } = require('../../db/users.js');
const wait = require('node:timers/promises').setTimeout;
const solvedacQueryHelper = require('../../api/solvedac.js');
const bojQueryHelper = require('../../api/boj.js');

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

        const originalMessage = `**미니게임이 시작되었습니다.**\n정답은 3분 뒤에 공개합니다. 아래 설명을 보고 적절한 태그를 고르세요. \n\n**문제 설명**\n` +
        `${simpleDesc}`;
        const response = await interaction.followUp({
            content: originalMessage,
            components: [row]
        });
        let ansList = [];
        let notAnsList = [];
        let answeredList = [];
      //   (async() => {
      //     const userName = interaction.user.username;
      //     try {
      //         const confirmation = await response.awaitMessageComponent({ time: 60_000 * 3 });
      //         if (answeredList.includes(userName)) {
      //           await confirmation.reply({ content: '이미 응답하셨습니다.', ephemeral: true });  
      //           return;
      //         }
      //         if (confirmation.customId === ans_case) {
      //           ansList.push(userName);
      //         } else {
      //           notAnsList.push(userName);
      //         }
      //         await confirmation.reply({ content: '응답 되었습니다! 잠시 뒤 정답이 공개됩니다.', ephemeral: true });
      //     } catch (e) {
      //       console.error(e);
      //     }
      //     answeredList.push(userName);
      // })();
      // 이벤트 리스너를 통해 여러 사용자의 응답 처리
      const collector = response.createMessageComponentCollector({ time: 60_000 * 3 });

      collector.on('collect', async (confirmation) => {
          const userName = confirmation.user.username;

          if (answeredList.includes(userName)) {
              await confirmation.reply({ content: '이미 응답하셨습니다.', ephemeral: true });
              return;
          }

          if (confirmation.customId === ans_case) {
              ansList.push(userName);
          } else {
              notAnsList.push(userName);
          }

          answeredList.push(userName);
          await confirmation.reply({ content: '응답 되었습니다! 잠시 뒤 정답이 공개됩니다.', ephemeral: true });
      });

      collector.on('end', (collected) => {
          console.log('응답 수집 종료:', collected.size);
          // 여기에 응답 수집 종료 후 처리 로직을 추가하세요.
      });
      await delay(1000 * 60 * 3);

      const resultString = `**정답: ${convertToNL[ans_case]}**\n\n실제 백준 문제 번호: ${problemId}\nhttps://boj.ma/${problemId}/t\n\n정답자: ${[...new Set(ansList)].join(', ')}\n오답자: ${[...new Set(notAnsList)].join(', ')}\n`
      await interaction.followUp({
        content: resultString
      });
    }
};
