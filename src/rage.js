const iconPath = "icons/svg/explosion.svg";
let effectOnMsg = " に激怒の修正を載せました。";
let effectOffMsg = " から激怒の修正を削除しました。";

let bludgeoning = "bludgeoning";
let slashing = "slashing";
let piercing = "piercing";
let effected = false;

const selectedTokens = getSelectedTokens();
if (selectedTokens === undefined || selectedTokens.length === 0) {
  ui.notifications.warn("激怒の対象とするトークンを選択してください。");
} else {
  selectedTokens.forEach((token) => {
    const actor = token.actor;
    effected = isEffected(actor);
    if (effected) {
      const message = effectOff(token, actor);
      chatMessage(message);
    } else {
      const message = effectOn(token, actor);
      chatMessage(message);
    }
  });
}

function getSelectedTokens() {
  return canvas.tokens.controlled;
}

function getBounses(actor) {
console.log(actor)  
  const retVal = {
    dr: actor.data.data.traits.dr.value, //抵抗
    mwak: actor.data.data.bonuses.mwak.damage, //近接攻撃のダメージボーナス
  };
  return retVal;
}

function isEffected(actor) {
  const bonuses = getBounses(actor);

  const damageBonus = getDamageBonus(actor)

  return (
    bonuses.dr.includes(piercing) &&
    bonuses.dr.includes(bludgeoning) &&
    bonuses.dr.includes(slashing) &&
    bonuses.mwak.includes(damageBonus)
  );
}

function effectOn(token, actor) {
  if (!token.data.effects.includes(iconPath)) {
    token.toggleEffect(iconPath);
  }
  const bonuses = getBounses(actor);

  // anounce to chat
  const chatMsg = `${actor.name} ${effectOnMsg}`;
  console.log("adding bless modifiers to global bonuses");

  //物理抵抗を追加
  bonuses.dr.push(bludgeoning);
  bonuses.dr.push(slashing);
  bonuses.dr.push(piercing);
  bonuses.mwak += getDamageBonus(actor)

  //ダメージボーナスを追加

  updateActor(actor, bonuses);

  return chatMsg;
}

function effectOff(token, actor) {
  if (token.data.effects.includes(iconPath)) {
    token.toggleEffect(iconPath);
  }
  // anounce to chat
  const chatMsg = `${actor.name} ${effectOffMsg}`;
  // remove bless bonus
  console.log("resetting global bonuses for bless");

  const bonuses = getBounses(actor);

  //物理抵抗を削除
  deleteDr(bonuses,bludgeoning);
  deleteDr(bonuses,piercing);
  deleteDr(bonuses,slashing);
  bonuses.mwak = removeBonus(bonuses.mwak,getDamageBonus(actor))
  updateActor(actor, bonuses);
  return chatMsg;
}

function deleteDr(bonuses,target){
  const index = bonuses.dr.indexOf(target);
  if (index >= 0) {
    bonuses.dr.splice(index, 1);
  }
}

function removeBonus(bonuses,deleteBonus){
    const length = bonuses.indexOf(deleteBonus);
    return bonuses.substring(0, length) + bonuses.substring(length + 4, bonuses.length);
}

function updateActor(actor, bonuses) {
  let obj = {};
  obj["actor.data.data.traits.dr.value"] = bonuses.dr;
  //damageの場合は、actor.dataを指定してはだめ。なんで？
  obj["data.bonuses.mwak.damage"] = bonuses.mwak;
  console.log(obj)  
  actor.update(obj);
}

function chatMessage(message) {
  let chatData = {
    user: game.user._id,
    speaker: ChatMessage.getSpeaker(),
    content: message,
  };
  ChatMessage.create(chatData, {});
}

/**
 * バーバリアンのダメージボーナスを計算する。
 * @param {*} actor
 * @returns
 */
function getDamageBonus(actor){
  const level = getLevel(actor)
  if(level < 9){
    return "+2"
  }else if(level < 16){
    return "+3"
  }else {
    return "+4"
  }
}

/**
 * バーバリアンのLVを取得する。
 * @param {*} actor
 * @returns
 */
function getLevel(actor) {
  let barbarian = actor.items.find(
    (i) => i.name === "バーバリアン" && i.type === "class"
  );
  return barbarian ? barbarian.data.data.levels : 1;
}
