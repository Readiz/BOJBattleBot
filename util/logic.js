module.exports = {
   calculateNewRating: function (currentRating, opponentRating, actualScore, kFactor = 256) {
    // 예상 승리 확률 계산
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
    
    // 새로운 레이팅 계산
    let newRating = currentRating + (actualScore > 0 ? kFactor * (actualScore - expectedScore) : kFactor * (actualScore - expectedScore) / 3);
    
    // 레이팅을 0과 3000 사이로 제한
    newRating = Math.max(0, Math.min(3000, newRating));
    
    return Math.floor(newRating);
  },
  getArtificialRating: function (difficulty) {
    const db = {
        'u': 100,
        'b': 500,
        's': 1000,
        'g': 1500,
        'p': 2000,
        'd': 2500,
        'r': 3000
    };
    return db[difficulty];
  },
};