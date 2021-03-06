
/**
 * PLキャラクター用のショートカットマクロ
 * Brother Sharpさん作成マクロの改造版。
 * 以下、Brother SharpさんのDiscordコメントを転記。
 * ----------------------------------------------------------------------------------------------------------------------------------------------
 * D&D5版用ですが、画面の左上に装備品、呪文、特徴、セーヴ、技能のためのアクセスしやすいボタンを配置します。
 * 使用するにはこのマクロを入れた状態でコマを選択してマクロを発動します。すると左上にボタンが表示されます。コマを切り替えるたびに再発動する必要があります。
 * あまりにも長いのでファイルで添付しました、テキストエディタで開いてコピペしてください。
 * -----------------------------------------------------------------------------------------------------------------------------------------------
 * 利用イメージ：https://twitter.com/minokuba/status/1330051754730328065/photo/1
 * -----------------------------------------------------------------------------------------------------------------------------------------------
 * minokubaによる修正履歴：
 * 2020/11/21 Cantripが表示されない不具合に対応。
 * 
 */

// Creates a drop down menu of active items, spells, and feats just below the nav and right of the control bar.
// ^ and stick#0520
(async () => {
    $(document.body).off("click.showTokenActionBar");

    let oldBar = document.getElementById("show-action-dropdown-bar");
    if (oldBar != null)
        oldBar.remove();
        
    const cancel = () => {
        $dispOptions.remove();
    };

    let navBounds = document.getElementById("navigation").getBoundingClientRect();
    let y = navBounds.bottom + 20;

    let controlBounds = document.getElementById("controls").getBoundingClientRect();
    let x = controlBounds.right + 50;
    
    let targetActor = getTargetActor();
    let data = getData(targetActor);

    const $dispOptions = $(`<div id="show-action-dropdown-bar" style="display: flex; z-index: 70; position: fixed; top: ${y}px; height: auto; left: ${x}px; background-color: #bbb">${data}</div>`).appendTo(document.body);
    
    $(document.body).on("click.showTokenActionBar", evt => {
        let close = clickDropdownContent(evt);
        if (close)
            cancel();
    });
})();

function getTargetActor() {
    const character = game.user.character;
    if (character != null)
        return character;

    const controlled = canvas.tokens.controlled;

    if (controlled.length === 0) return character || null;

    if (controlled.length > 0 && controlled[0] != null) {
        return controlled[0].actor;
    }
}

function getData(targetActor) {

    function buildActionsList(targetActor) {
        let equipped = targetActor.data.items.filter(i => i.type !="consumable" && i.data.equipped);
        let activeEquipped = getActiveEquipment(equipped);
        let weapons = activeEquipped.filter(i => i.type == "weapon");
        let equipment = activeEquipped.filter(i => i.type == "equipment");

        let other = activeEquipped.filter(i => i.type != "weapon" && i.type != "equipment");
        let consumables = targetActor.data.items.filter(i => i.type == "consumable");
        let items = { "weapons": weapons, "equipment": equipment, "other": other, "consumables": consumables };

        //modified by minokuba. 初級呪文は準備済みのフラグを持たないので、初級呪文の場合に限り準備済判定を除外。
        let preparedSpells = targetActor.data.items.filter(
		         i => (i.type == "spell" && i.data.preparation.prepared) ||
				      (i.type == "spell" && i.labels.level === '初級呪文'));
        let spells = categoriseSpells(preparedSpells);

        let allFeats = targetActor.data.items.filter(i => i.type == "feat");
        let activeFeats = getActiveFeats(allFeats);
        let passiveFeats =  getPassiveFeats(allFeats);
        let feats = {"active": activeFeats, "passive": passiveFeats};
        

        return { "items": items,"spells": spells, "feats": feats };
    }

    function buildChecksList() {
        let abilities = Object.entries(game.dnd5e.config.abilities);
        let skills = Object.entries(game.dnd5e.config.skills);

        return {"abilities": abilities, "skills": skills }
    }

    function getActiveEquipment(equipment) {
        const activationTypes = Object.entries(game.dnd5e.config.abilityActivationTypes);

        let activeEquipment = equipment.filter(e => {
            if (e.data.activation == undefined)
                return false;

            for (let [key, value] of activationTypes) {
                if (e.data.activation.type == key)
                    return true;
            }
            
            return false;
        });

        return activeEquipment;
    }

    function categoriseSpells(spells) {
        let powers = {};
        let book = {}

        book = spells.reduce(function (book, spell) {
            var level = spell.data.level;
            let prep = spell.data.preparation.mode;

            const prepTypes = game.dnd5e.config.spellPreparationModes;
            let prepType = prepTypes[prep];

            if (prep == "pact" || prep == "atwill" || prep == "innate") {
                if (!powers.hasOwnProperty(prepType)) {
                    powers[prepTypes[prep]] = [];
                }

                powers[prepType].push(spell);
            } else {
                if (!book.hasOwnProperty(level)) {
                    book[level] = [];
                }

                book[level].push(spell);
            }

            return book;
        }, {});
        
        return {"book": Object.entries(book), "powers": Object.entries(powers)};
    }

    function getActiveFeats(feats) {
        const activationTypes = Object.entries(game.dnd5e.config.abilityActivationTypes);
        let activeFeats = feats.filter(f => {
            if (f.data.activation == undefined)
                return false;

            for (let [key, value] of activationTypes) {
                if (f.data.activation.type == key)
                    return true;
            }
            
            return false;
        });

        return Object.entries(activeFeats);
    }

    function getPassiveFeats(feats) {
        const activationTypes = Object.entries(game.dnd5e.config.abilityActivationTypes);
        let passiveFeats = feats.filter(f => {
            if (f.data.activation == undefined)
                return false;

            for (let [key, value] of activationTypes) {
                if (f.data.activation.type == key)
                    return false;
            }
            
            return true;
        });

        return Object.entries(passiveFeats);
    }

    function getContentTemplate(actions, checks) {
        let template = `
        <div class="show-action-form">
            ${getCssStyle()}
            <div class="show-action-dropdowns">
                ${getItemsTemplate(actions.items)}
                ${getSpellsTemplate(actions.spells)}
                ${getFeatsTemplate(actions.feats)}
                ${getAbilityCheckTemplate(checks.abilities, checks.actorId)}
                ${getSkillCheckTemplate(checks.skills, checks.actorId)}
                <div class="show-action-dropdown">
                    <button value="showActionClose" class="show-action-dropdown-button">[x]</button>
                </div>
            </div>
        </div>`;
        
        return template;
    }
        
    function getItemsTemplate(items) {
        if (items.weapons.length + items.equipment.length + items.other.length + items.consumables.length === 0)
            return "";

        let template = `<div class="show-action-dropdown">
                            <button value="showActionItems" class="show-action-dropdown-button">装備品</button>
                            <div id="showActionItems" class="show-action-dropdown-content">
                                ${getItemsCategoryTemplate("武器", items.weapons)}
                                ${getItemsCategoryTemplate("防具・道具", items.equipment)}
                                ${getItemsCategoryTemplate("その他", items.other)}
                                ${getItemsCategoryTemplate("消耗品", items.consumables)}
                            </div>
                        </div>`;


        return template;
    }

    function getSpellsTemplate(spells) {     
        if (spells.powers.length + spells.book.length === 0)           
            return "";

        let template = `<div class="show-action-dropdown">
                            <button value="showActionSpells" class="show-action-dropdown-button">呪文</button>
                            <div id="showActionSpells" class="show-action-dropdown-content">
                                ${getSpellsCategoryTemplate(spells.powers)}
                                ${getSpellsCategoryTemplate(spells.book)}
                            </div>
                        </div>`;

        return template;
    }

    function getFeatsTemplate(feats) {
        if (feats.active.length + feats.passive.length === 0)
            return "";

        let template = `<div class="show-action-dropdown">
                            <button value="showActionFeats" class="show-action-dropdown-button">特徴</button>
                                <div id="showActionFeats" class="show-action-dropdown-content">
                                ${getFeatsCategoryTemplate("能動", feats.active)}
                                ${getFeatsCategoryTemplate("受動", feats.passive)}
                            </div>
                        </div>`;

        return template;
    }

    function getItemsCategoryTemplate(title, items) {
        if (items.length === 0)
            return "";

        let template = `<div class="show-action-dropdown-content-subtitle">${title}</div>
                        <div class="show-action-dropdown-content-actions">`;
        for (let i of items) {
            template += `<input id="weapon-${i.name}" type="button" value="${i.name}" onclick="${getRollItemMacro(i.name)}"/>`;    
        } 

        template += `</div>`;

        return template;
    }

    function getSpellsCategoryTemplate(spells) {
        if (spells.length === 0)
            return "";

        let template = "";

        for (let [level, entries] of spells) {
            let levelNo = level.toString().charAt(0);
            let subtitle = isNaN(levelNo) ? level : (levelNo === "0" ? `初級呪文` : `レベル ${levelNo}`);

            template += `<div class="show-action-dropdown-content-subtitle">${subtitle}</div>
                            <div class="show-action-dropdown-content-actions">`;

            for (let s of entries) {
                template += `<input id="spell-${s.name}" type="button" value="${s.name}" onclick="${getRollItemMacro(s.name)}"/>`;    
            }

            template += `</div>`;
        }
        
        return template;
    }

    function getFeatsCategoryTemplate(subtitle, feats) {
        if (feats.length === 0)
            return "";
        
        let template = `<div class="show-action-dropdown-content-subtitle">${subtitle}</div>
                        <div class="show-action-dropdown-content-actions">`
                        
        for (let [index, f] of feats) {
            template += `<input id="feat-${f.name}" type="button" value="${f.name}" onclick="${getRollItemMacro(f.name)}"/>`;    
        }

        template += `</div>`
        

        return template;
    }

    function getAbilityCheckTemplate(checks, actorId) {
        if (checks.length === 0)
            return "";

        let template = `<div class="show-action-dropdown">
                            <button value="showActionSaves" class="show-action-dropdown-button">セーヴ＆能力値判定</button>
                            <div id="showActionSaves" class="show-action-dropdown-content">
                                <div class="show-action-dropdown-content-actions">`

                for (let [checkId, check] of checks) {
                    template += `<input id="check-${check}" type="button" value="${check}" onclick="${getRollAbilityCheckMacro(actorId, checkId)}">`;    
                }            
        
        template += `           </div>
                            </div>
                        </div>`;

        return template;
    }

    function getSkillCheckTemplate(checks, actorId) {
        if (checks.length === 0)
            return "";

        let template = `<div class="show-action-dropdown">
                            <button value="showActionSkills" class="show-action-dropdown-button">技能</button>
                            <div id="showActionSkills" class="show-action-dropdown-content">
                                <div class="show-action-dropdown-content-actions">`

                for (let [checkId, check] of checks) {
                    template += `<input id="check-${check}" type="button" value="${check}" onclick="${getRollSkillCheckMacro(actorId, checkId)}">`;    
                }            
        
        template += `           </div>
                            </div>
                        </div>`;

        return template;
    }

    function getCssStyle() {
        return `
        <style type="text/css">
            .show-action-dropdowns {
                margin: 5px;
            }

            .show-action-dropdown-button {
                width: auto;
                height: auto;
                background-color: #eee;
                padding: 5px 8px;
                border: none;
                cursor: pointer;
            }
            
            /* The container <div> - needed to position the dropdown content */
            .show-action-dropdown {
                position: relative;
                display: inline-block;
            }
            
            /* Dropdown Content (Hidden by Default) */
            .show-action-dropdown-content {
                display: none;
                max-width: 700px;
                padding: 8px;
                background-color: #aaa;
                position: absolute;
                box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
                z-index: 99;
            }

            .show-action-dropdown-content-actions {
                min-width: 300px;
                max-width: 700px;
            }

            .show-action-drowndown-content-title {
                font-size: medium;
            }
            
            .show-action-dropdown-content-subtitle {
                font-size: small;
            }
            
            /* Links inside the dropdown */
            .show-action-dropdown-content-actions input {
                width: auto;
                height: auto;
                padding: 3px 5px;
                font-size: small;
                text-decoration: none;
                display: inline;
            }
            
            /* Change color of dropdown links on hover */
            .show-action-dropdown-content input:hover {
                background-color: #f1f1f1
            }
            
            /* Show the dropdown menu on hover */
            .show-action-dropdown:hover .show-action-dropdown-content {
                display: block;
            }

        </style>`
    }

    function getRollItemMacro(itemName) {
        return `game.dnd5e.rollItemMacro(&quot;${itemName}&quot;)`;
    }
	
	function getRollItemMacroQoL(itemName) {
        return `MinorQOL.doMacroRoll(event, &quot;${itemName}&quot;)`;
    }

    function getRollAbilityCheckMacro(actorId, abilityId) {
        return `game.actors.find(a => a._id == &quot;${actor.id}&quot;).rollAbility(&quot;${abilityId}&quot;)`;
    }

    function getRollSkillCheckMacro(actorId, skillId) {
        return `game.actors.find(a=> a._id == &quot;${actor.id}&quot;).rollSkill(&quot;${skillId}&quot;)`;
    }

    let innerContent = "";

    if (targetActor != null || targetActor) {
        let actionsList = buildActionsList(targetActor);
        let checksList = buildChecksList();
        checksList.actorId = targetActor._id;

        innerContent = getContentTemplate(actionsList, checksList);
    } else {
        ui.notifications.error("No token selected or user character found.");
        throw new Error("No token selected or character found");
    }
        
        var content =  `<div id="actionDialog">${innerContent}</div>`;
        
        return content;
}

    
function clickDropdownContent(event) {
    if (event.target.value == undefined || event.target.value == "")
        return false;

    if (event.target.value == "showActionClose")
        return true;       

    return false;
}