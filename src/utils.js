/** よく使う関数のSnipet. */

//指定したクラスのレベルを取得する。
function getLevel(actor) {
  let barbarian = actor.items.find(
    (i) => i.name === "バーバリアン" && i.type === "class"
  );
  return barbarian ? barbarian.data.data.levels : 1;
}

//呪文を取得
function getSpell(actor, name) {
  let spell = actor.items.find((i) => i.name === name && i.type === "spell");
  return spell;
}

//呪文スロットを取得
function getSpellSlot(actor, level) {
  let slot = actor.data.data.spells[`spell${level}`];
  return slot;
}

//指定した呪文をキャストできるかの判定。
function canCastSpell(actor) {
  const spell = getSpell(actor, "ブレス");
  const slot = getSpellSlot(actor, 1);
  if (spell && slot.value >= 1) {
    return true;
  } else {
    return false;
  }
}

//自分が捜査するキャラクターの取得。
const myCharacter = game.user.character;
