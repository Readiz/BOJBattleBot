const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { getUser, addChallengeCount, addSuccessCount, setPlaying, endPlaying, applyNewRating } = require('../../db/users.js');
const wait = require('node:timers/promises').setTimeout;
const solvedacQueryHelper = require('../../api/solvedac.js');
const { calculateNewRating, getArtificialRating } = require('../../util/logic.js');

const giveup = new ButtonBuilder()
	.setCustomId('giveup')
	.setLabel('포기')
	.setStyle(ButtonStyle.Danger);
	// .addComponents(success)
	// .addComponents(dummy)
const row = new ActionRowBuilder()
	.addComponents(giveup);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('연습')
		.setDescription('풀어보지 않았던 문제를 30분 타이머를 걸고 풉니다.')
    .addStringOption(option => 
      option.setName('problem_id')
        .setDescription('백준 문제 번호를 입력하세요.')
        .setRequired(true)),
	async execute(interaction) {

        await interaction.deferReply('문제를 확인하는 중...');
        const problem_id = interaction.options.getString('problem_id');
        const userData = getUser(interaction.user.id);
        const userDiscordId = interaction.user.id;
        if (!userData) {
            await interaction.editReply({ 
                content: 'solved.ac 계정이 연동되어 있지 않습니다. /연동 명령어로 연동 후 사용해주세요.'
            });
            return;
        }
        if (userData.is_playing) {
          await interaction.editReply({ 
              content: '이미 진행중인 랜디가 있습니다! 새로 문제를 받으시려면 포기한 이후에 다시 받아주세요.'
          });
          return;
        }

        if (await solvedacQueryHelper.checkUserSolvedReal(userData.handle, problem_id)) {
            await interaction.followUp({
                content: `이미 풀이하신 문제로는 연습하실 수 없습니다. 세팅을 종료합니다.`
            });
            return;
        }

        const result = await solvedacQueryHelper.getProblemById(problem_id);
        if (!result) {
          await interaction.followUp({
              content: `없는 문제 번호이거나, 현재 풀이할 수 없습니다. 나중에 다시 시도해주세요.`
          });
          return;
        }
        let difficultyKind = null;
        if (result.level <= 5) difficultyKind = 'b';
        else if (result.level <= 10) difficultyKind = 's';
        else if (result.level <= 15) difficultyKind = 'g';
        else if (result.level <= 20) difficultyKind = 'p';
        else if (result.level <= 25) difficultyKind = 'd';
        else if (result.level <= 30) difficultyKind = 'r';
        else difficultyKind = 'u';

        // const artificialRating = getArtificialRating(difficultyKind);
        const artificialRating = (result.level + 4) * 100; // 브론즈5: 500 / 실버5: 1000 / ...
        const newWinRating = calculateNewRating(userData.rating, artificialRating, 1);
        const newLoseRating = calculateNewRating(userData.rating, artificialRating, 0);
        setPlaying(userDiscordId); // 시작!
        applyNewRating(userDiscordId, newLoseRating);

        const originalMessage = `**<@${userDiscordId}>님의 연습이 시작되었습니다.**\n제한시간은 30분입니다. 문제를 풀지 않고 포기하시려면 아래 버튼을 사용해주세요. \n\n**도전 문제**\n` +
        `https://boj.ma/${problem_id}/t`;
        const response = await interaction.followUp({
            content: originalMessage,
            components: [row]
        });
        addChallengeCount(userDiscordId, difficultyKind);

        let userEndFlag = false;
        let timeEndFlag = false;

        const startTime = Math.floor(Date.now() / 1000);
        const timeMessage = await interaction.followUp({
            content: '남은 시간: 30분\n(약 1분 주기로 풀이 여부가 확인 됩니다.)'
        });
        const endTime = Math.floor(Date.now() / 1000) + 30 * 60;
        const myFunc = async function() {
            if (userEndFlag) {
                timeMessage.edit('풀이가 종료되었습니다.');
                return;
            }
            remainTime = endTime - Math.floor(Date.now() / 1000);
            timeMessage.edit(`남은 시간: ${Math.floor(remainTime / 60)}분 ${remainTime % 60}초\n(약 1분 주기로 풀이 여부가 확인 됩니다.)`);

            const ret = await solvedacQueryHelper.checkUserSolvedReal(userData.handle, problem_id);
            if (ret == true) {
                userEndFlag = true;
                endPlaying(userDiscordId);
                const successTime = Math.floor(Date.now() / 1000) - startTime;
                addSuccessCount(userDiscordId, difficultyKind);
                applyNewRating(userDiscordId, newWinRating);
                timeMessage.edit(`<@${userDiscordId}>님, ${Math.floor(successTime / 60)}분 ${successTime % 60}초 만에 문제풀이에 성공하셨습니다. 축하드립니다!\n프로필에 기록되었습니다.`);
            } else if (remainTime > 0) {
                setTimeout(myFunc, 60000);
            } else {
                timeEndFlag = true;
                timeMessage.edit(`<@${userDiscordId}>님, 제한 시간이 종료되었습니다. 아쉽네요..`);
                endPlaying(userDiscordId);
            }
        };
        myFunc();

        const collectorFilter = i => i.user.id === userDiscordId;

        try {
            const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 * 30 });
            if (timeEndFlag || userEndFlag) {
                await confirmation.update({ content: originalMessage + `\n\n이미 풀이가 종료되었습니다.`, components: [] });
                return;
            }
            if (confirmation.customId === 'giveup') {
                userEndFlag = true;
                endPlaying(userDiscordId);
                await confirmation.update({ content: originalMessage, components: [] });
                await confirmation.followUp({ content: `<@${userDiscordId}>님, 중도포기를 선택하셨습니다. 다음에는 좋은 문제를 만나실 거에요!`, components: [] });
            }
        } catch (e) {
            userEndFlag = true;
            endPlaying(userDiscordId);
            console.error(e);
            // await interaction.followUp({ content: originalMessage + `\n\n제한시간이 초과되어 실패하셨습니다.`, components: [] });
        }
    }
};
