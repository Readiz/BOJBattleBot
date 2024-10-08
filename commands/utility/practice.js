const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { getUser, addChallengeCount, addSuccessCount, setPlaying, endPlaying, applyNewRating } = require('../../db/users.js');
const wait = require('node:timers/promises').setTimeout;
const solvedacQueryHelper = require('../../api/solvedac.js');
const { calculateNewRating, getArtificialRating } = require('../../util/logic.js');

const success = new ButtonBuilder()
	.setCustomId('success')
	.setLabel('성공')
	.setStyle(ButtonStyle.Primary);
const dummy = new ButtonBuilder()
	.setCustomId('dummy')
	.setLabel(' | ')
  .setDisabled(true)
	.setStyle(ButtonStyle.Secondary);
const giveup = new ButtonBuilder()
	.setCustomId('giveup')
	.setLabel('포기')
	.setStyle(ButtonStyle.Danger);
	// .addComponents(success)
	// .addComponents(dummy)
const row = new ActionRowBuilder()
	.addComponents(giveup);

const PROBLEM_NUM = 3;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('랜덤')
		.setDescription('랜덤 문제를 뽑습니다.')
    .addStringOption(option => 
      option.setName('difficulty')
        .setDescription('solved.ac 기준 난이도를 선택하세요.')
        .setRequired(true)
        .addChoices(
          {name: '브론즈 전체', value: 'bo'},
          {name: '실버 하위', value: 'sl'},
          {name: '실버 상위', value: 'sh'},
          {name: '실버 전체', value: 'so'},
          {name: '골드 하위', value: 'gl'},
          {name: '골드 상위', value: 'gh'},
          {name: '골드 전체', value: 'go'},
          {name: '플래티넘 하위', value: 'pl'},
          {name: '플래티넘 상위', value: 'ph'},
          {name: '플래티넘 전체', value: 'po'}
        )),
	async execute(interaction) {

        await interaction.deferReply('연습문제를 준비하는 중...');
        const difficulty = interaction.options.getString('difficulty');
        const difficultyKind = difficulty[0];
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

        const result = await solvedacQueryHelper.getRandomProblems([userData.handle], difficulty);
        if (!result) {
            await interaction.followUp({
                content: `선택한 난이도의 문제 뽑기에 실패했습니다. 연습을 종료합니다.`
            });
            return;
        }

        const problemDB = [
          
        ];
        let idx = 1;
        for(let item of result) {
          let strTags = item.tags.map(_ => _.displayNames[0].name).join(', ');
          if (strTags) {
            item.battleIdx = idx++;
            item.battleTagDescription = strTags;
            item.banCnt = 0;
            problemDB.push(item);
            console.log(item.problemId);
          }
          if (idx > PROBLEM_NUM) break;
        }
      
        if (problemDB.length < PROBLEM_NUM) {
          await interaction.followUp({
            content: `선택한 난이도의 문제 뽑기에 실패했습니다. 연습을 종료합니다.`
          });
          return;
        }
      
        let highDifficulty = 0;
        let lowDifficulty = 1;
        if (difficulty[1] == 'l') highDifficulty = 3;
        else if (difficulty[1] == 'h') lowDifficulty = 3;

        let tagStringResult = '';
        for(let item of problemDB) {
          tagStringResult += `${item.battleIdx}. `;
          if (item.level % 5 == lowDifficulty) {
            tagStringResult += '**[난이도: 순한맛]**';
          } else if (item.level % 5 == highDifficulty) {
            tagStringResult += '**[난이도: 매운맛]**';
          } else {
            tagStringResult += '**[난이도: 중간맛]**';
          }
          let padding = '';
          let paddingLen = Math.floor(Math.random() * 3);
          if (paddingLen == 1) {
            padding = '    '; 
          } else if (paddingLen == 2) {
            padding = '                 ';
          }
          tagStringResult += `  ||${item.battleTagDescription}${padding}||\n`;
          ++idx;
        }

        setPlaying(userDiscordId); // 시작!

        const message = await interaction.followUp({
            content: `10초 이내에 밴할 문제 번호를 이모지로 반응해주세요. 선택하지 않으면 ${PROBLEM_NUM}문제중 랜덤이 됩니다.\n\n` + tagStringResult,
            fetchReply: true
        });
        await message.react('1️⃣');
        await message.react('2️⃣');
        await message.react('3️⃣');
        // await message.react('4️⃣');
        // await message.react('5️⃣');
      
        const collectorFilter = (reaction, user) => {
          return ['1️⃣', '2️⃣', '3️⃣'].includes(reaction.emoji.name);// && user.id === interaction.user.id;
        };

        const userids = [userDiscordId];
        
        message.awaitReactions({ filter: collectorFilter, max: 100, time: 10_000 })
        .then(collected => {
            // const reaction = collected.first();
            // console.log(collected);
            // interaction.followUp(JSON.stringify(collected));
            // console.log([...collected]);
            // interaction.followUp(JSON.stringify([...collected]));
            // return;
            let S = new Set();
            for(let reaction of [...collected]) {
              // console.log(reaction[1].us);
              // interaction.followUp(JSON.stringify(reaction[1]));
              // continue;
              const cur = JSON.parse(JSON.stringify(reaction[1]));
              switch (reaction[0]) {
                case '1️⃣':
                  {
                    let cnt = 0;
                    for(let cid of cur['users']) {
                      if (userids.indexOf(cid) > -1 && S.has(cid) == false) {
                        S.add(cid);
                        ++cnt;
                      }
                    }
                    problemDB[0].banCnt += cnt;
                    break;
                  }
                case '2️⃣':
                  {
                    let cnt = 0;
                    for(let cid of cur['users']) {
                      if (userids.indexOf(cid) > -1 && S.has(cid) == false) {
                        S.add(cid);
                        ++cnt;
                      }
                    }
                    problemDB[1].banCnt += cnt;
                    break;
                  }
                case '3️⃣':
                  {
                    let cnt = 0;
                    for(let cid of cur['users']) {
                      if (userids.indexOf(cid) > -1 && S.has(cid) == false) {
                        S.add(cid);
                        ++cnt;
                      }
                    }
                    problemDB[2].banCnt += cnt;
                    break;
                  }
                case '4️⃣':
                  {
                    let cnt = 0;
                    for(let cid of cur['users']) {
                      if (userids.indexOf(cid) > -1 && S.has(cid) == false) {
                        S.add(cid);
                        ++cnt;
                      }
                    }
                    problemDB[3].banCnt += cnt;
                    break;
                  }
                case '5️⃣':
                  {
                    let cnt = 0;
                    for(let cid of cur['users']) {
                      if (userids.indexOf(cid) > -1 && S.has(cid) == false) {
                        S.add(cid);
                        ++cnt;
                      }
                    }
                    problemDB[4].banCnt += cnt;
                    break;
                  }
              }
            }
            problemDB.sort(() => Math.random() - 0.5);
            problemDB.sort(((a,b) => a.banCnt - b.banCnt ));

            // bs.problemSelected(interaction.channelId, problemDB[0].problemId);
            const artificialRating = (problemDB[0].level + 4) * 100; // 브론즈5: 500 / 실버5: 1000 / ...
            const newWinRating = calculateNewRating(userData.rating, artificialRating, 1);
            const newLoseRating = calculateNewRating(userData.rating, artificialRating, 0);
            applyNewRating(userDiscordId, newLoseRating);

            (async() => {
                const originalMessage = `**<@${userDiscordId}>님의 연습이 시작되었습니다.**\n제한시간은 30분입니다. 문제를 풀지 않고 포기하시려면 아래 버튼을 사용해주세요. \n\n**선정된 문제**\n` +
                `https://boj.ma/${problemDB[0].problemId}/t`;
                const response = await interaction.followUp({
                    content: originalMessage,
                    components: [row]
                });
                addChallengeCount(userDiscordId, difficultyKind);

                let userEndFlag = false;
                let timeEndFlag = false;

                const startTime = Math.floor(Date.now() / 1000);
                (async() => {
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

                        const ret = await solvedacQueryHelper.checkUserSolvedReal(userData.handle, problemDB[0].problemId);
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
                })();

                const collectorFilter = i => i.user.id === userDiscordId;

                try {
                    const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 * 30 });
                    if (timeEndFlag || userEndFlag) {
                        await confirmation.update({ content: originalMessage + `\n\n이미 풀이가 종료되었습니다.`, components: [] });
                        return;
                    }
                    if (confirmation.customId === 'success') {
                        userEndFlag = true;
                        endPlaying(userDiscordId);
                        await confirmation.update({ content: originalMessage + `\n\n정말로 풀었는지 확인을 진행 중입니다...`, components: [] });

                        for(let i = 0; i < 5; ++i) {
                            await wait(5000);
                            const ret = await solvedacQueryHelper.checkUserSolvedReal(userData.handle, problemDB[0].problemId);
                            if (ret == true) {
                                const successTime = Math.floor(Date.now() / 1000) - startTime;
                                addSuccessCount(userDiscordId, difficultyKind);
                                await confirmation.followUp({ content: `<@${userDiscordId}>님, ${Math.floor(successTime / 60)}분 ${successTime % 60}초 만에 문제풀이에 성공하셨습니다. 축하드립니다!\n프로필에 기록되었습니다.`, components: [] });
                                applyNewRating(userDiscordId, newWinRating);
                                return;
                            }
                        }
                        await confirmation.followUp({ content: `<@${userDiscordId}>님, 아무리 기다려도.. 문제 풀이가 확인되지 않습니다. 아쉽지만 성공기록은 추가되지 않습니다.\n@${userData.handle}님, 거짓말은 아니겠죠..?`, components: [] });
                    } else if (confirmation.customId === 'giveup') {
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
            })();
        });
    }
};
