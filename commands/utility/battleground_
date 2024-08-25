const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const bs = require('../../db/battlestate.js');
const { getUser } = require('../../db/users.js');
const wait = require('node:timers/promises').setTimeout;
const solvedacQueryHelper = require('../../api/solvedac.js');

const success = new ButtonBuilder()
	.setCustomId('success')
	.setLabel('성공')
	.setStyle(ButtonStyle.Primary);
const row = new ActionRowBuilder()
	.addComponents(success);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('배틀그라운드')
		.setDescription('현재 채널/쓰레드에 PS 배틀그라운드를 엽니다.')
    .addStringOption(option => 
      option.setName('difficulty')
        .setDescription('solved.ac 기준 난이도를 선택하세요.')
        .setRequired(true)
        .addChoices(
          {name: '실버', value: 'so'},
          {name: '골드', value: 'go'},
          {name: '플래티넘', value: 'po'}
        )),
	async execute(interaction) {
    // await interaction.reply({
    //   content: '현재 개발중인 기능입니다. 빠른 개발을 위해 @readiz를 압박해주세요!',
    //   // ephemeral: true
    // });
    // return;
		// interaction.guild is the object representing the Guild in which the command was run
		// await interaction.reply(`This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`);
		// await interaction.reply(`${JSON.stringify(interaction.guild)}`);
		await interaction.deferReply('배틀그라운드를 준비하는 중...');
    const difficulty = interaction.options.getString('difficulty');
    const difficultyName = difficulty == 'so' ? '실버' : difficulty == 'go' ? '골드' : '플래티넘';
		console.log('created battle channel in', interaction.channelId);
		const dbres = bs.getChannelBattleState(interaction.channelId);
		if (dbres) {
			await interaction.editReply('현재 채널/쓰레드에 이미 진행중인 배틀이 있습니다. 배틀이 끝난 후에 사용해주세요.');
		} else {
			await interaction.editReply('진행 중인 배틀이 없습니다. 생성합니다.');
			bs.startChannelBattle(interaction.channelId, difficulty);
        const message = await interaction.editReply({
          content: `**${difficultyName} 난이도**의 게임이 생성되었습니다.\n게임을 원하시는 분은 120초 이내에 게임에 등록해주세요.\n등록하시려면 하트 이모지를 눌러주세요.\n\n**[주의]** 처음 참가하시는 분이시라면, /연동 명령어로 먼저 solved.ac 계정을 연동해주세요!`,
          fetchReply: true
        });
        await message.react('❤');
        setTimeout(async ()=> {
          const msg = await interaction.followUp({
            content: '등록 마감 60초 전입니다.',
            fetchReply: true
          });
          await wait(50_000);
          await msg.edit({
            content: '등록 마감 10초 전입니다.'
          })
        }, 60_000);
        const collectorFilter = (reaction, user) => {
          return ['❤'].includes(reaction.emoji.name);// && user.id === interaction.user.id;
        };
        const collected = await message.awaitReactions({ filter: collectorFilter, max: 100, time: 120_000 })
        // const reaction = collected.first();
        // console.log(collected);
        // interaction.followUp(JSON.stringify(collected));
        // console.log([...collected]);
        // interaction.followUp(JSON.stringify([...collected]));
        // return;
        const registeredHandles = [];
        for(let reaction of [...collected]) {
          // console.log(reaction[1].us);
          // interaction.followUp(JSON.stringify(reaction[1]));
          // continue;
          const cur = JSON.parse(JSON.stringify(reaction[1]));
          if (reaction[0] == '❤') {
            for(let cid of cur['users']) {
              // if (userids.indexOf(cid) > -1 && S.has(cid) == false) {
              //   S.add(cid);
              //   ++cnt;
              // }
              const userData = getUser(cid);
              if (userData) {
                const useraddres = bs.addUserToChannelBattle(interaction.channelId, cid, userData.handle);
                if (useraddres) {
                  console.log('registered user', userData.handle, cid);
                  registeredHandles.push(userData.handle);
                  // await res.followUp({ 
                  //   content: `solved.ac 계정 ${userData.handle}, 참가자로 등록 되었습니다.`, 
                  //  });
                } else {
                  // await res.followUp({ 
                  //   content: `solved.ac 계정 ${userData.handle}은 이미 참가자로 등록되어 있습니다.`, 
                  //   ephemeral: true
                  //  });
                }
              }
            }
            break;
          }
        }
        if (registeredHandles.length <= 1) {
          await interaction.followUp({
            content: `배틀그라운드는 최소 2명의 유저가 참가해야 합니다. 배틀을 종료합니다.\n만약 현재 채널에 사람이 없다면 /연습 커맨드를 사용해서 연습해보시는 것은 어떨까요?`
          });
          bs.removeChannelBattle(interaction.channelId);
          return;
        }
        await interaction.followUp('이번 **PS 배틀그라운드**에 함께 하실 분들은 다음과 같습니다.\n5초 뒤 문제 선정 페이즈로 넘어갑니다.\n - ' + registeredHandles.join('\n - '));
				await wait(5000);
        startGame(interaction, difficulty);
		}
	},
};

async function startGame(interaction, difficulty) {
	const handles = bs.getChannelBattleHandles(interaction.channelId);
	const userids = bs.getChannelBattleUserIds(interaction.channelId);
	bs.endRegisterChannelBattle(interaction.channelId);
  const startMessage = await interaction.followUp({
		content: `게임을 시작합니다. 배틀할 문제를 랜덤으로 뽑는 중...`,
    fetchReply: true
	});
  const result = await solvedacQueryHelper.getRandomProblems(handles, difficulty);
  
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
    if (idx > 5) break;
  }

  if (!result || problemDB.length < 5) {
    await interaction.followUp({
      content: `선택한 난이도의 문제 뽑기에 실패했습니다. 배틀을 종료합니다.`
    });
    bs.removeChannelBattle(interaction.channelId);
    return;
  }

  let tagStringResult = '';
  for(let item of problemDB) {
    tagStringResult += `${item.battleIdx}. `;
    if (item.level % 5 == 1) {
      tagStringResult += '**[난이도: 순한맛]**';
    } else if (item.level % 5 == 0) {
      tagStringResult += '**[난이도: 매운맛]**';
    } else {
      tagStringResult += '**[난이도: 중간맛]**';
    }
    tagStringResult += `  ${item.battleTagDescription}\n`;
    ++idx;
  }

	const message = await startMessage.edit({
		content: '10초 이내에 밴할 문제 번호를 이모지로 반응해주세요.\n\n' + tagStringResult,
		fetchReply: true
	});
  await message.react('1️⃣');
  await message.react('2️⃣');
  await message.react('3️⃣');
  await message.react('4️⃣');
  await message.react('5️⃣');

  const collectorFilter = (reaction, user) => {
    return ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'].includes(reaction.emoji.name);// && user.id === interaction.user.id;
  };
  
  const collected = await message.awaitReactions({ filter: collectorFilter, max: 100, time: 10_000 });
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
  
  const originalMessage = '**PS 배틀그라운드가 시작되었습니다.**\n30분동안 진행됩니다. 풀이에 성공하셨으면 아래의 성공 버튼을 눌러주세요.\n\n**선정된 문제**\n' + `https://boj.ma/${problemDB[0].problemId}/t`;
  const response = await interaction.followUp({
      content: originalMessage,
      components: [row]
  });
  bs.problemSelected(interaction.channelId, problemDB[0].problemId);
}

/*
ButtonInteraction {
  type: 3,
  id: '1206305175858577519',
  applicationId: '1205549809533063239',
  channelId: '1205549924616507452',
  guildId: '1096835708288774365',
  user: User {
    id: '312971839481708548',
    bot: false,
    system: false,
    flags: UserFlagsBitField { bitfield: 0 },
    username: 'readiz',
    globalName: 'Readiz',
    discriminator: '0',
    avatar: 'ebfa03b1f1959b1f67b04901a620baa1',
    banner: null,
    accentColor: null,
    avatarDecoration: null
  },
  member: GuildMember {
    guild: Guild {
      id: '1096835708288774365',
      name: 'Readiz',
      icon: '90b9437fcf91e0220d8f0f98374522b8',
      features: [Array],
      commands: [GuildApplicationCommandManager],
      members: [GuildMemberManager],
      channels: [GuildChannelManager],
      bans: [GuildBanManager],
      roles: [RoleManager],
      presences: PresenceManager {},
      voiceStates: [VoiceStateManager],
      stageInstances: [StageInstanceManager],
      invites: [GuildInviteManager],
      scheduledEvents: [GuildScheduledEventManager],
      autoModerationRules: [AutoModerationRuleManager],
      available: true,
      shardId: 0,
      splash: null,
      banner: null,
      description: null,
      verificationLevel: 0,
      vanityURLCode: null,
      nsfwLevel: 0,
      premiumSubscriptionCount: 0,
      discoverySplash: null,
      memberCount: 2,
      large: false,
      premiumProgressBarEnabled: false,
      applicationId: null,
      afkTimeout: 300,
      afkChannelId: null,
      systemChannelId: '1096835708888547343',
      premiumTier: 0,
      widgetEnabled: null,
      widgetChannelId: null,
      explicitContentFilter: 0,
      mfaLevel: 0,
      joinedTimestamp: 1707671174688,
      defaultMessageNotifications: 0,
      systemChannelFlags: [SystemChannelFlagsBitField],
      maximumMembers: 500000,
      maximumPresences: null,
      maxVideoChannelUsers: 25,
      maxStageVideoChannelUsers: 50,
      approximateMemberCount: null,
      approximatePresenceCount: null,
      vanityURLUses: null,
      rulesChannelId: null,
      publicUpdatesChannelId: null,
      preferredLocale: 'en-US',
      safetyAlertsChannelId: null,
      ownerId: '312971839481708548',
      emojis: [GuildEmojiManager],
      stickers: [GuildStickerManager]
    },
    joinedTimestamp: 1681576411151,
    premiumSinceTimestamp: null,
    nickname: null,
    pending: false,
    communicationDisabledUntilTimestamp: null,
    user: User {
      id: '312971839481708548',
      bot: false,
      system: false,
      flags: [UserFlagsBitField],
      username: 'readiz',
      globalName: 'Readiz',
      discriminator: '0',
      avatar: 'ebfa03b1f1959b1f67b04901a620baa1',
      banner: null,
      accentColor: null,
      avatarDecoration: null
    },
    avatar: null,
    flags: GuildMemberFlagsBitField { bitfield: 0 }
  },
  version: 1,
  appPermissions: PermissionsBitField { bitfield: 559623605570113n },
  memberPermissions: PermissionsBitField { bitfield: 562949953421311n },
  locale: 'ko',
  guildLocale: 'en-US',
  message: <ref *1> Message {
    channelId: '1205549924616507452',
    guildId: '1096835708288774365',
    id: '1206305170678358026',
    createdTimestamp: 1707675964756,
    type: 19,
    system: false,
    content: '등록은 아래 버튼을 사용해주세요.',
    author: ClientUser {
      id: '1205549809533063239',
      bot: true,
      system: false,
      flags: [UserFlagsBitField],
      username: 'PS BattleGround',
      globalName: null,
      discriminator: '6804',
      avatar: 'e379f1509a3d48887f90af41aaf65f3f',
      banner: undefined,
      accentColor: undefined,
      avatarDecoration: null,
      verified: true,
      mfaEnabled: false
    },
    pinned: false,
    tts: false,
    nonce: null,
    embeds: [],
    components: [ [ActionRow] ],
    attachments: Collection(0) [Map] {},
    stickers: Collection(0) [Map] {},
    position: null,
    roleSubscriptionData: null,
    resolved: null,
    editedTimestamp: null,
    reactions: ReactionManager { message: [Circular *1] },
    mentions: MessageMentions {
      everyone: false,
      users: Collection(0) [Map] {},
      roles: Collection(0) [Map] {},
      _members: null,
      _channels: null,
      _parsedUsers: null,
      crosspostedChannels: Collection(0) [Map] {},
      repliedUser: null
    },
    webhookId: '1205549809533063239',
    groupActivityApplication: null,
    applicationId: '1205549809533063239',
    activity: null,
    flags: MessageFlagsBitField { bitfield: 0 },
    reference: {
      channelId: '1205549924616507452',
      guildId: '1096835708288774365',
      messageId: '1206305167205470328'
    },
    interaction: null
  },
  customId: 'register',
  componentType: 2,
  deferred: false,
  ephemeral: null,
  replied: false,
  webhook: InteractionWebhook { id: '1205549809533063239' }
}
*/



// async function handleRegister(interaction, response) {
// 	const collectorFilter = i => i.channelId === interaction.channelId;
// 	response.awaitMessageComponent({ filter: collectorFilter, time: 100_000 }).then(async function (res) {
// 		// console.log(res);
// 		if (res.customId === 'register') {
// 			if (bs.getChannelBattleState(interaction.channelId) != 'waiting_register') {
// 				await res.update({
// 					content: `아쉽지만 현재 채널의 배틀은 이미 등록이 끝났습니다. 다음에 참여해주세요!`,
// 					components: []
// 				});
// 				return;
// 			}

// 			const userData = getUser(res.user.id);
// 			let battleresponse = await res.update({
// 				content: `등록은 아래 버튼을 사용해주세요.`,
// 				components: [row]
// 			});
// 			handleRegister(interaction, battleresponse);
// 			if (userData) {
// 				const useraddres = bs.addUserToChannelBattle(interaction.channelId, res.user.id, userData.handle);
// 				if (useraddres) {
// 					console.log('registered user', userData.handle, res.user.id);
// 					await res.followUp({ 
// 						content: `solved.ac 계정 ${userData.handle}, 참가자로 등록 되었습니다.`, 
// 					 });
// 				} else {
// 					await res.followUp({ 
// 						content: `solved.ac 계정 ${userData.handle}은 이미 참가자로 등록되어 있습니다.`, 
// 						ephemeral: true
// 					 });
// 				}
// 			} else {
// 				await res.followUp({ 
// 					content: 'solved.ac 계정이 연동되어 있지 않습니다. /연동 명령어로 연동 후 사용해주세요.', 
// 					ephemeral: true
// 				});
// 			}
// 		}
// 	}).catch(async function (res) {
// 		// interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
// 		// console.log('not received..');
// 		// console.error(res);
// 		// await res.followUp({ content: '이미 만료된 배틀 등록입니다.', components: [] });
// 	});
// }