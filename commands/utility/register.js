const { SlashCommandBuilder } = require('discord.js');
const { request } = require('undici');
const { getUser, checkDuplicate, registerUser } = require('../../db/users.js');
const solvedacQueryHelper = require('../../api/solvedac.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('연동')
		.setDescription('solved.ac 계정을 연동합니다.')
		.addStringOption(option =>
			option.setName('id')
				.setDescription('solved.ac 계정 id')
                .setRequired(true)),
	async execute(interaction) {
        await interaction.deferReply({
            content: 'solved.ac 계정 연동을 시도합니다.',
            ephemeral: true
        });
        const userState = getUser(interaction.user.id);
        if (userState) {
            await interaction.editReply('이미 연동이 되어 있는 discord 계정입니다. 연동 계정 변경을 원하시면 관리자에게 문의해주세요.');
            return;
        }
		const solvedid = interaction.options.getString('id');
		if (solvedid) {
            const isDuplicated = checkDuplicate(solvedid);
            if (isDuplicated) {
                await interaction.editReply(`이미 등록된 solved.ac handle 입니다.`);
                return;
            }

            const isAvailable = await solvedacQueryHelper.checkUserCanRegister(solvedid);
            if (isAvailable) {
                registerUser(interaction.user.id, solvedid);
                await interaction.editReply(`${interaction.user.username}님, solved.ac 계정 ${solvedid}와 연동 되었습니다. 즐거운 PS BattleGround 하세요!`);
            } else {
                await interaction.editReply(`문제 풀이 기록이 확인되지 않는 solved.ac 계정입니다. 적어도 1문제 이상 풀이 후 연동을 시도해주세요.`);
            }
        } else {
            await interaction.editReply({
                content: '연동할 solved.ac 계정 id를 입력해주세요.',
                // ephemeral: true
            });
        }
	},
};
