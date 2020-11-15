const iconPath = "icons/svg/windmill.svg";
let effectOnMsg = " にガイダンスの修正を載せました。";
let effectOffMsg = " からガイダンスの修正を削除しました。";

//fixed declarations DO NOT MODIFY
let d4 = "+1d4";
let effected = false;

const selectedTokens = getSelectedTokens();
if (selectedTokens === undefined || selectedTokens.length === 0) {
  ui.notifications.warn("ガイダンスの対象とするトークンを選択してください。");
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
  const retVal = {
    skill: actor.data.data.bonuses.abilities.skill,
    check: actor.data.data.bonuses.abilities.check,
  };
  console.log(retVal);
  return retVal;
}

function isEffected(actor) {
  const bonuses = getBounses(actor);
  return (
    bonuses.skill.includes(d4) &&
    bonuses.check.includes(d4)
  );
}

function effectOn(token, actor) {
  if(!token.data.effects.includes(iconPath)){
    token.toggleEffect(iconPath);
  }
  const bonuses = getBounses(actor);

  // anounce to chat
  const chatMsg = `${actor.name} ${effectOnMsg}`;
  // add bless bonus
  console.log("adding bless modifiers to global bonuses");

  bonuses.skill += d4;
  bonuses.check += d4;
  updateActor(actor, bonuses);

  return chatMsg;
}

function effectOff(token, actor) {
  if(token.data.effects.includes(iconPath)){
    token.toggleEffect(iconPath);
  }
  // anounce to chat
  const chatMsg = `${actor.name} ${effectOffMsg}`;
  // remove bless bonus
  console.log("resetting global bonuses for bless");
  let bonuses = {};
  bonuses.skill = removeBonus(actor.data.data.bonuses.abilities.skill);
  bonuses.check = removeBonus(actor.data.data.bonuses.abilities.check);
  updateActor(actor, bonuses);
  return chatMsg;
}

function removeBonus(bonus){
    const length = bonus.indexOf(d4);
    return bonus.substring(0, length) + bonus.substring(length + 4, bonus.length);
}

function updateActor(actor, bonuses) {
  let obj = {};
  obj["data.bonuses.abilities.skill"] = bonuses.skill;
  obj["data.bonuses.abilities.check"] = bonuses.check;
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
