const { AttachmentBuilder, SlashCommandBuilder } = require('discord.js');
const gptQueryHelper = require('../../api/gpt.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('gpt')
		.setDescription('ChatGPT를 사용하여 질문합니다.')
		.addStringOption(option =>
			option.setName('query')
				.setDescription('질문할 문장')
				.setRequired(true)),
	async execute(interaction) {
		await interaction.deferReply({
            content: 'gpt 호출 중...',
            // ephemeral: true
        });
		const answer = await gptQueryHelper.completions(interaction.options.getString('query'));
		if (answer) {
			await interaction.editReply({ 
				content: answer
			});
		} else {
			await interaction.editReply({ 
				content: 'GPT 호출에 실패했습니다.'
			});
		}

	},
};