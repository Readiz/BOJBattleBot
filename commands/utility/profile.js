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
			let detailedStatus = '';
			const fetchCondition = [['b', '브론즈'], ['s', '실버'], ['g', '골드'], ['p', '플레티넘'], ['d', '다이아몬드']];
			for(const condi of fetchCondition) {
				detailedStatus += `${condi[1]} - 도전: ${userState.solved[condi[0]].challenge} / 성공: ${userState.solved[condi[0]].success}\n`;
			}
			const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
            await interaction.editReply(`***${userState.handle}님의 전적***\n레이팅: ${userState.rating}\n${detailedStatus}\n\n***${motivationalMessages[randomIndex].replace('USER', userState.handle)}***`);
        } else {
			await interaction.editReply({ 
                content: '연동되지 않은 solved.ac 계정입니다.'
            });
		}
	},
};
