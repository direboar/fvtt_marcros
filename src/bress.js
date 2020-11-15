const iconPath = "icons/svg/regen.svg";
let effectOnMsg = " にブレスの修正を載せました。";
let effectOffMsg = " からブレスの修正を削除しました。";

let d4 = "+1d4";
let effected = false; //呪文の効果対象であるかどうか。

const selectedTokens = getSelectedTokens();
if (selectedTokens === undefined || selectedTokens.length === 0) {
  ui.notifications.warn("Blessの対象とするトークンを選択してください。");
} else {
  selectedTokens.forEach((token) => {
    const actor = token.actor;
    effected = isEffected(actor);
    // If not already bless
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
    mwak: actor.data.data.bonuses.mwak.attack,
    rwak: actor.data.data.bonuses.rwak.attack,
    msak: actor.data.data.bonuses.msak.attack,
    rsak: actor.data.data.bonuses.rsak.attack,
    save: actor.data.data.bonuses.abilities.save,
  };
  console.log(retVal);
  return retVal;
}

function isEffected(actor) {
  const bonuses = getBounses(actor);
  return (
    bonuses.mwak.includes(d4) &&
    bonuses.rwak.includes(d4) &&
    bonuses.msak.includes(d4) &&
    bonuses.rsak.includes(d4) &&
    bonuses.save.includes(d4)
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

  bonuses.mwak += d4;
  bonuses.rwak += d4;
  bonuses.msak += d4;
  bonuses.rsak += d4;
  bonuses.save += d4;
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
  bonuses.mwak = removeBonus(actor.data.data.bonuses.mwak.attack);
  bonuses.rwak = removeBonus(actor.data.data.bonuses.rwak.attack);
  bonuses.msak = removeBonus(actor.data.data.bonuses.msak.attack);
  bonuses.rsak = removeBonus(actor.data.data.bonuses.rsak.attack);
  bonuses.save = removeBonus(actor.data.data.bonuses.abilities.save);
  updateActor(actor, bonuses);

  return chatMsg;
}

function removeBonus(bonus){
    const length = bonus.indexOf(d4);
    return bonus.substring(0, length) + bonus.substring(length + 4, bonus.length);
}

function updateActor(actor, bonuses) {
  let obj = {};
  obj["data.bonuses.mwak.attack"] = bonuses.mwak;
  obj["data.bonuses.rwak.attack"] = bonuses.rwak;
  obj["data.bonuses.msak.attack"] = bonuses.msak;
  obj["data.bonuses.rsak.attack"] = bonuses.rsak;
  obj["data.bonuses.abilities.save"] = bonuses.save;
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
