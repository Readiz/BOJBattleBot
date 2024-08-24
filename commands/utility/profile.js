const { AttachmentBuilder, SlashCommandBuilder } = require('discord.js');
const bs = require('../../db/battlestate.js');
const { getUser, checkDuplicate, registerUser } = require('../../db/users.js');
const solvedacQueryHelper = require('../../api/solvedac.js');
const { createCanvas, Image, GlobalFonts } = require('@napi-rs/canvas');
const { readFile } = require('fs/promises');
const { request } = require('undici');

const svgImg = new Image();
(async() => {
	svgImg.src = await readFile(`${process.cwd()}/resources/silver.svg`);
	// GlobalFonts.register(await readFile(`${process.cwd()}/resources/NanumGothic.ttf`), 'NanumGothic');
	// GlobalFonts.register(await readFile(`${process.cwd()}/resources/NotoSansKR.ttf`), 'currentFont');
	// console.log(GlobalFonts.families);
})();
const praiseWords = ['Coding Specialist,'];//[`어디서도 볼 수 없는 코딩의 귀재,`, '똑똑한 청년.', '코딩으로 세상을 정복한,', '문제 해결의 신,', 'PS의 지배자,'];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('프로필')
		.setDescription('PS BattleGround 프로필을 확인합니다.'),
	async execute(interaction) {
		const canvas = createCanvas(700, 960);
		const context = canvas.getContext('2d');

		// const background = await readFile('./resources/wallpaper.jpg');
		// const backgroundImage = new Image();
		// backgroundImage.src = background;
		// context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
        context.fillStyle = "#FFF";
        context.fillRect(0, 0, canvas.width, canvas.height);

		// context.strokeStyle = '#0099ff';
		// context.strokeRect(0, 0, canvas.width, canvas.height);

		// context.font = '28px sans-serif';
		// context.fillStyle = '#ffffff';
		// context.fillText('The King of PS', 10, 10);
		

		context.font = `${70}px Consolas`;
		context.fillStyle = '#000000';
		// context.fillText(`Readiz Test`, 250, 150);
		context.fillText(`${interaction.member.displayName}`, 150, 145);

		// context.font = applyText(canvas, `${interaction.member.displayName}!`);
		context.font = `${30}px NanumGothic`;
		context.fillStyle = '#000000';
		context.fillText(praiseWords[Math.floor((Math.random() * 1000)) % praiseWords.length], 35, 50);

        // context.font = '50px'
        // context.strokeText('😀😃😄😁😆😅😂🤣☺️😊😊😇', 50, 150)
		context.font = `${35}px bold NanumGothic`;
		context.fillStyle = '#000000';
		context.fillText(`PS BattleGround Rating: ${1000}`, 35, 225);

		context.font = `${25}px NanumGothic`;
		context.fillStyle = '#000000';
		// context.fillText(`풀이 기록이 없습니다.`, 35, 255);
		context.fillText(`Recent solving history (up to 100)`, 35, 275);


		let y = 290;
		let x = 35;
		for(let i = 0; i < 100; ++i) {
			context.drawImage(svgImg, x, y, 43, 58);
			x += 65;
			if (x > 650) {
				x = 35;
				y += 65;
			}
		}

		context.beginPath();
		context.arc(75, 125, 50, 0, Math.PI * 2, true);
		context.closePath();
		context.clip();

		const { body } = await request(interaction.user.displayAvatarURL({ format: 'jpg' }));
		const avatar = new Image();
		avatar.src = Buffer.from(await body.arrayBuffer());
		context.drawImage(avatar, 25, 75, 100, 100);

		const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'profile-image.png' });
		await interaction.reply({ files: [attachment] });
        // await interaction.reply({
        //     content: '현재 개발중인 기능입니다. 빠른 개발을 위해 @readiz를 압박해주세요!',
        //     // ephemeral: true
        // });
        // await interaction.deferReply({
        //     content: 'solved.ac 계정 연동을 시도합니다.',
        //     ephemeral: true
        // });
        // const userState = getUser(interaction.user.username);
        // if (userState) {
        //     await interaction.editReply('이미 연동이 되어 있는 discord 계정입니다. 연동 계정 변경을 원하시면 관리자에게 문의해주세요.');
        //     return;
        // }
		// const solvedid = interaction.options.getString('id');
		// if (solvedid) {
        //     const isDuplicated = checkDuplicate(solvedid);
        //     if (isDuplicated) {
        //         await interaction.editReply(`이미 등록된 solved.ac handle 입니다.`);
        //         return;
        //     }

        //     const isAvailable = await solvedacQueryHelper.checkUserCanRegister(solvedid);
        //     if (isAvailable) {
        //         registerUser(interaction.user.username, solvedid);
        //         await interaction.editReply(`${interaction.user.username}님, solved.ac 계정 ${solvedid}와 연동 되었습니다. 즐거운 PS BattleGround 하세요!`);
        //     } else {
        //         await interaction.editReply(`문제 풀이 기록이 확인되지 않는 solved.ac 계정입니다. 적어도 1문제 이상 풀이 후 연동을 시도해주세요.`);
        //     }
        // } else {
        //     await interaction.editReply({
        //         content: '연동할 solved.ac 계정 id를 입력해주세요.',
        //         // ephemeral: true
        //     });
        // }
	},
};