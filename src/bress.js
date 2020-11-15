const blessIconPath = "icons/svg/regen.svg";
let blessMsg = " にブレスの修正を載せました。";
let endblessMsg = " からブレスの修正を削除しました。";

//fixed declarations DO NOT MODIFY
let Blessd4 = "+1d4";
let bless = false;

const selectedTokens = getSelectedTokens();
if (selectedTokens === undefined || selectedTokens.length === 0) {
  ui.notifications.warn("Blessの対象とするトークンを選択してください。");
} else {
  selectedTokens.forEach((token) => {
    const actor = token.actor;
    bless = isBlessed(actor);
    // If not already bless
    if (bless == false) {
      // toggle bless icon
      const message = bressOn(token, actor);
      chatMessage(message);
      // if already bless
    } else {
      // toggle bless icon
      const message = bressOff(token, actor);
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

function isBlessed(actor) {
  const bonuses = getBounses(actor);
  return (
    bonuses.mwak.includes(Blessd4) &&
    bonuses.rwak.includes(Blessd4) &&
    bonuses.msak.includes(Blessd4) &&
    bonuses.rsak.includes(Blessd4) &&
    bonuses.save.includes(Blessd4)
  );
}

function bressOn(token, actor) {
  token.toggleEffect(blessIconPath);
  const bonuses = getBounses(actor);

  // anounce to chat
  const chatMsg = `${actor.name} ${blessMsg}`;
  // add bless bonus
  console.log("adding bless modifiers to global bonuses");

  bonuses.mwak += Blessd4;
  bonuses.rwak += Blessd4;
  bonuses.msak += Blessd4;
  bonuses.rsak += Blessd4;
  bonuses.save += Blessd4;
  updateActor(actor, bonuses);

  return chatMsg;
}

function bressOff(token, actor) {
  token.toggleEffect(blessIconPath);
  // anounce to chat
  const chatMsg = `${actor.name} ${endblessMsg}`;
  // remove bless bonus
  console.log("resetting global bonuses for bless");
  let bonuses = {};
  bonuses.mwak = removeBlessModifier(actor.data.data.bonuses.mwak.attack);
  bonuses.rwak = removeBlessModifier(actor.data.data.bonuses.rwak.attack);
  bonuses.msak = removeBlessModifier(actor.data.data.bonuses.msak.attack);
  bonuses.rsak = removeBlessModifier(actor.data.data.bonuses.rsak.attack);
  bonuses.save = removeBlessModifier(actor.data.data.bonuses.abilities.save);
  updateActor(actor, bonuses);

  return chatMsg;
}

function removeBlessModifier(bonus){
    // tmp = JSON.parse(JSON.stringify(actor.data.data.bonuses.abilities.save));
    const length = bonus.indexOf(Blessd4);
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
