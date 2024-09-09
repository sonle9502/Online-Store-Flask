// roundToNearestThousand関数をエクスポート
export const roundToNearestThousand = (price, weight) => {
    let factor;
    
    // 重量に基づいて係数を設定
    if (weight === 250) {
      factor = 0.38;
    } else if (weight === 500) {
      factor = 0.61;
    } else {
      factor = 1; // デフォルトは1Kg
    }

    // 価格を計算し
    const priceToRound = Math.round(price * factor / 100);
    const roundedPrice = priceToRound * 100;
    
    return roundedPrice;
};
