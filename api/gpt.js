const { gpt_token } = require('../config.json');
module.exports = {
    async completions(query, system_prompt) {
        if (!system_prompt) system_prompt = 'You are a helpful assistant. 영어로 물어봐도 한국어로 대답해줘. 용어가 헷갈리는게 있으면 Computer Science 기준으로 답변해줘. markdown이 bold 정도만 적용되는 환경이니 복잡한 수식은 최대한 문자로 가독성 있게 표현해.';
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${gpt_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        model: 'gpt-4o-mini', // 사용할 모델 지정
                        messages: [
                            { role: 'system', content: system_prompt },
                            { role: 'user', content: query }
                        ],
                        max_tokens: 1000, // 반환될 응답의 최대 토큰 수
                        temperature: 0.7 // 응답의 창의성 조절 (0.0에서 1.0 사이)
                    }
                )   
            });
            const json = await response.json();
            console.log(json);
            return json.choices[0].message.content;
        } catch (e) {
            console.error('Request Error!', e);
            return null;
        }
    },
};