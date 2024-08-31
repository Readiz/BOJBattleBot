const { AttachmentBuilder, SlashCommandBuilder } = require('discord.js');
const { getUser, getUserByHandle } = require('../../db/users.js');
// const { createCanvas, Image, GlobalFonts } = require('@napi-rs/canvas');
// const { readFile } = require('fs/promises');
// const { request } = require('undici');

// const svgImg = new Image();
// (async() => {
// 	svgImg.src = await readFile(`${process.cwd()}/resources/silver.svg`);
// 	// GlobalFonts.register(await readFile(`${process.cwd()}/resources/NanumGothic.ttf`), 'NanumGothic');
// 	// GlobalFonts.register(await readFile(`${process.cwd()}/resources/NotoSansKR.ttf`), 'currentFont');
// 	// console.log(GlobalFonts.families);
// })();
// const praiseWords = ['Coding Specialist,'];//[`어디서도 볼 수 없는 코딩의 귀재,`, '똑똑한 청년.', '코딩으로 세상을 정복한,', '문제 해결의 신,', 'PS의 지배자,'];

const motivationalMessages = [
    "USER, 당신의 코드가 백준의 정복자가 될 날이 머지않았습니다. 계속 나아가세요!",
    "USER, 작은 성공도 위대한 성취의 시작입니다. 오늘도 한 문제를 해결해봅시다!",
    "지금 해결하는 한 문제, USER의 미래를 위한 큰 발걸음입니다. 포기하지 마세요!",
    "USER, 알고리즘의 왕좌를 향해 한 걸음씩 나아가고 있습니다. 꾸준함이 곧 승리입니다!",
    "백준의 모든 문제가 당신 앞에 무릎 꿇게 될 날이 올 것입니다, USER님!",
    "힘들 때일수록 USER님의 진가는 더 빛납니다. 계속 도전하세요!",
    "USER, 문제 하나를 풀 때마다 당신의 실력이 한층 더 성장하고 있습니다. 앞으로도 전진하세요!",
    "코드 한 줄, 한 줄이 USER님의 실력을 쌓아갑니다. 꾸준함이 답입니다!",
    "USER님의 도전 정신이 이미 절반의 성공을 만들어냈습니다. 나머지 절반을 향해 가봅시다!",
    "백준의 모든 문제를 정복하기 위해, USER님과 함께라면 어떤 도전도 두렵지 않습니다!",
    "USER, 백준의 난관은 당신의 코드 실력을 더욱 단단하게 만들어줄 것입니다!",
    "USER님의 끈기와 열정이 결국 모든 문제를 해결할 것입니다. 포기하지 마세요!",
    "한 문제씩 정복해 나가는 USER님의 모습을 보면 백준도 감탄할 겁니다!",
    "USER, 당신의 도전이 곧 성취로 이어질 것입니다. 계속해서 나아가세요!",
    "백준에서 쌓아올린 USER님의 실력이 곧 보상받을 날이 올 것입니다!",
    "USER, 당신의 코드는 점점 더 최적화되고 있습니다. 매일 성장하는 자신을 믿으세요!",
    "USER님의 열정이 곧 백준에서 큰 성과로 나타날 것입니다. 힘내세요!",
    "백준의 문제들은 USER님에게 도전과 성장의 기회를 제공합니다. 계속 도전하세요!",
    "USER, 오늘의 노력은 내일의 결과로 나타날 것입니다. 끝까지 가봅시다!",
    "USER님의 끊임없는 도전이 백준의 모든 난제를 해결할 것입니다. 힘을 내세요!"
];

function getLevelImg(level) {
    const tier = level.split(" ")[0];
    if (tier == "Unrated") {
        return `https://cdn.jsdelivr.net/gh/5tarlight/vlog-image@main/bjcord/solved-tier/unrated.png`;
    }

    const step = level.split(" ")[1];

    let stepNum = 0;
    switch (step) {
        case "I":
        stepNum = 1;
        break;
        case "II":
        stepNum = 2;
        break;
        case "III":
        stepNum = 3;
        break;
        case "IV":
        stepNum = 4;
        break;
        case "V":
        stepNum = 5;
        break;
        default:
        stepNum = 0;
    }

    return `https://cdn.jsdelivr.net/gh/5tarlight/vlog-image@main/bjcord/solved-tier/${
        tier.toLowerCase() + stepNum
    }.png`;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('프로필')
		.setDescription('PS BattleGround 프로필을 확인합니다.')
		.addStringOption(option =>
			option.setName('id')
				.setDescription('solved.ac 계정 id (생략하면 본인 id 대체)')),
	async execute(interaction) {
		await interaction.deferReply({
            content: '프로필을 가져오는 중...',
            // ephemeral: true
        });
		let userState = interaction.options.getString('id')? getUserByHandle(interaction.options.getString('id')) : getUser(interaction.user.id);
        if (userState && userState.solved) {
			const fetchCondition = [['b', '브론즈'], ['s', '실버'], ['g', '골드'], ['p', '플레티넘'], ['d', '다이아몬드'], ['r', '루비'], ['u', 'Unrated']];
            const fetchedData = {};
			for(const condi of fetchCondition) {
                if (!userState.solved[condi[0]] || userState.solved[condi[0]].challenge == 0) continue;
				fetchedData[condi[1]] = `도전: ${userState.solved[condi[0]].challenge} / 성공: ${userState.solved[condi[0]].success}`;
			}
			const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
            let percent = 0;
            let winCnt = userState.minigame && userState.minigame.win;
            if (!winCnt) winCnt = 0;
            let loseCnt = userState.minigame && userState.minigame.lose;
            if (!loseCnt) loseCnt = 0;
            if (winCnt + loseCnt != 0) percent = Number((winCnt / (winCnt + loseCnt))*100).toFixed(2);

            const userHandle = userState.handle;
            const ratingValue = userState.rating;
            let userTier = 'Unrated';
            if (ratingValue >= 500 && ratingValue < 600) userTier = 'Bronze V';
            else if (ratingValue >= 600 && ratingValue < 700) userTier = 'Bronze IV';
            else if (ratingValue >= 700 && ratingValue < 800) userTier = 'Bronze III';
            else if (ratingValue >= 800 && ratingValue < 900) userTier = 'Bronze II';
            else if (ratingValue >= 900 && ratingValue < 1000) userTier = 'Bronze I';
            else if (ratingValue >= 1000 && ratingValue < 1100) userTier = 'Silver V';
            else if (ratingValue >= 1100 && ratingValue < 1200) userTier = 'Silver IV';
            else if (ratingValue >= 1200 && ratingValue < 1300) userTier = 'Silver III';
            else if (ratingValue >= 1300 && ratingValue < 1400) userTier = 'Silver II';
            else if (ratingValue >= 1400 && ratingValue < 1500) userTier = 'Silver I';
            else if (ratingValue >= 1500 && ratingValue < 1600) userTier = 'Gold V';
            else if (ratingValue >= 1600 && ratingValue < 1700) userTier = 'Gold IV';
            else if (ratingValue >= 1700 && ratingValue < 1800) userTier = 'Gold III';
            else if (ratingValue >= 1800 && ratingValue < 1900) userTier = 'Gold II';
            else if (ratingValue >= 1900 && ratingValue < 2000) userTier = 'Gold I';
            else if (ratingValue >= 2000 && ratingValue < 2100) userTier = 'Platinum V';
            else if (ratingValue >= 2100 && ratingValue < 2200) userTier = 'Platinum IV';
            else if (ratingValue >= 2200 && ratingValue < 2300) userTier = 'Platinum III';
            else if (ratingValue >= 2300 && ratingValue < 2400) userTier = 'Platinum II';
            else if (ratingValue >= 2400 && ratingValue < 2500) userTier = 'Platinum I';
            else if (ratingValue >= 2500 && ratingValue < 2600) userTier = 'Diamond V';
            else if (ratingValue >= 2600 && ratingValue < 2700) userTier = 'Diamond IV';
            else if (ratingValue >= 2700 && ratingValue < 2800) userTier = 'Diamond III';
            else if (ratingValue >= 2800 && ratingValue < 2900) userTier = 'Diamond II';
            else if (ratingValue >= 2900 && ratingValue < 3000) userTier = 'Diamond I';
            else if (ratingValue >= 3000 && ratingValue < 3100) userTier = 'Ruby V';
            else if (ratingValue >= 3100 && ratingValue < 3100) userTier = 'Ruby IV';
            else if (ratingValue >= 3200 && ratingValue < 3100) userTier = 'Ruby III';
            else if (ratingValue >= 3300 && ratingValue < 3100) userTier = 'Ruby II';
            else if (ratingValue >= 3400 && ratingValue < 3100) userTier = 'Ruby I';
            else if (ratingValue >= 3500) userTier = 'Master';
                
            const embededContent = {
                color: 0x0099ff,
                title: userHandle,
                url: `https://solved.ac/profile/${userHandle}`,
                // author: {
                //     name: 'PS 배틀그라운드 프로필',
                //     // icon_url: 'https://i.imgur.com/AfFp7pu.png',
                //     // url: 'https://discord.js.org',
                // },
                description: `${userTier} (${ratingValue}점)`,
                thumbnail: {
                    url: getLevelImg(userTier),
                },
                fields: [
                    {
                        name: '\u200b',
                        value: ''
                    },
                    {
                        name: '***주요 전적***',
                        value: '',
                    },
                    {
                        name: '업다운 랜디 전적',
                        value: '도전: 0 / 성공: 0',
                        inline: false,
                    },
                    {
                        name: '미니게임 전적',
                        value: `${winCnt}승 ${loseCnt}패 (${percent}%)`,
                        inline: true,
                    },
                    {
                        name: '\u200b',
                        value: '',
                        inline: false,
                    },
                    {
                        name: '***티어별 문제 풀이 전적***',
                        value: '',
                    }
                ],
                // image: {
                //     url: 'https://i.imgur.com/AfFp7pu.png',
                // },
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'PS 배틀그라운드',
                    // icon_url: 'https://i.imgur.com/AfFp7pu.png',
                },
            };
            for(let key in fetchedData) {
                embededContent.fields.push({
                    name: key,
                    value: fetchedData[key],
                    inline: true,
                });
            }
            embededContent.fields.push({
                name: '\u200b',
                value: '',
                inline: false,
            });
            embededContent.fields.push({
                    name: `${motivationalMessages[randomIndex].replace('USER', userHandle)}`,
                    value: ''
            });
            
            await interaction.editReply({ embeds: [embededContent] });
        } else {
			await interaction.editReply({ 
                content: '연동되지 않은 solved.ac 계정입니다.'
            });
		}
	},
};
