// ==UserScript==
// @name         Krunker Fast Quick Sell
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Quick sell items on the Krunker market faster
// @author       David Angell
// @match        https://krunker.io/social.html?p=market
// @icon         https://www.google.com/s2/favicons?sz=64&domain=krunker.io
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /* ================== SET EXCLUDED ITEMS HERE ================== */

    const EXCLUDED_ITEM_RARITIES = [
        "Unobtainable",
        "Contraband",
        "Relic",
        "Legendary",
        // "Epic",
        // "Rare",
        // "Uncommon",
    ];

    const EXCLUDED_ITEM_TYPES = [
        // "Sniper Rifle",
        // "Assault Rifle",
        // "Pistol",
        // "Submachine Gun",
        // "Revolver",
        // "Shotgun",
        // "Machine Gun",
        // "Semi Auto",
        // "Rocket Launcher",
        // "Akimbo Uzi",
        // "Desert Eagle",
        // "Alien Blaster",
        // "Crossbow",
        // "Famas",
        // "Sawed Off",
        // "Auto Pistol",
        // "Blaster",
        // "Grappler",
        // "Tehchy-9",
        // "Noob Tube",
        // "Zapper",
        // "Akimbo Pistol",
        // "Charge Rifle",
        // "Hats Item",
        // "Body Item",
        // "Melee Item",
        // "Sprays Item",
        // "Dyes Item",
        // "Waist Item",
        // "Faces Item",
        // "Shoes Item",
        // "Pets Item",
        // "Collectibles Item",
        // "Wrist Item",
        // "Charms Item",
        // "Tickets Item",
        // "Back Item",
        // "Head Item",
        // "Playercards Item",
    ];

    const EXCLUDED_ITEM_IDS = [];

    const EXCLUDED_ITEM_NAMES = [
        "Sunrise",
    ];

    /* ============================================================= */

    const RARITY_MAP = {
        0: "Uncommon",
        1: "Rare",
        2: "Epic",
        3: "Legendary",
        4: "Relic",
        5: "Contraband",
        6: "Unobtainable",
    };

    // Format of a market item
    // const MarketItem = {
    //     name: string,
    //     type: ItemType,
    //     count: number,
    //     rarity: number,
    //     estimatedValue: number | "Unknown",
    //     quickSellParms: [3],
    //     style: { border: string, color: string },
    // }
    function getMarketItems() {
        const marketList = document.getElementById("marketList");

        const items = [...marketList.getElementsByClassName("marketCard")].map((item) => {
            const name = item.innerHTML.split("<")[0];
            const type = item.getElementsByClassName("itemOwn")[0].innerHTML;
            const count = item.getElementsByClassName("cardCnt")[0].querySelector("span").innerHTML;
            const quickSellParams = item.getElementsByClassName("cardActions")[0].getElementsByTagName("a")[1].onclick.toString().split("Sell(")[1].split(")")[0].split(",");
            const rarity = quickSellParams[1];
            const estimatedValue = item.getElementsByClassName("cardEst")[0].innerHTML.split(" ")[1];
            const style = { border: item.style.border, color: item.style.color };

            return {
                name,
                type,
                count,
                rarity,
                estimatedValue,
                quickSellParams,
                style,
            };
        });

        return items;
    }

    function filterMarketItems(items) {
        return items.filter((item) => {
            const rarity = RARITY_MAP[item.rarity];
            const type = item.type;

            return !EXCLUDED_ITEM_RARITIES.includes(rarity) && !EXCLUDED_ITEM_TYPES.includes(type) && !EXCLUDED_ITEM_IDS.includes(item.quickSellParams[2]) && !EXCLUDED_ITEM_NAMES.includes(item.name);
        });
    }

    function hideDefaultItemActions(items) {
        items.forEach((item) => {
            const item_html = document.getElementById(`itemCardinventory_${item.quickSellParams[2]}`);
            item_html.getElementsByClassName("cardActions")[0].style = "display: none;";
        });
    }

    function displayFilteredMarketItems(items) {
        const filteredItems = filterMarketItems(items);

        items.forEach((item) => {
            const item_html = document.getElementById(`itemCardinventory_${item.quickSellParams[2]}`);

            if (filteredItems.includes(item)) {
                item_html.style = "color: red; border: 5px solid red;"
                item_html.getElementsByClassName("cardEst")[0].innerHTML = "Quick Selling";
            } else {
                item_html.style.border = item.style.border;
                item_html.style.color = item.style.color;
                item_html.getElementsByClassName("cardEst")[0].innerHTML = `~ ${item.estimatedValue}`;
            }
        });
    }

    // Modifies the top bar to display a quick sell button
    function displayQuickSellButton(items) {
        const tabs = document.getElementsByClassName("bigMenTabs")[0];
        for (let i = 0; i < 7; i++) {
            tabs.getElementsByClassName("bigMenTab")[i].style = "display: none;";
        }

        tabs.getElementsByClassName("bigMenTab")[7].innerHTML = "Quick Sell";
        tabs.getElementsByClassName("bigMenTab")[7].onclick = () => {
            quickSellFilteredItems(items);
        };
    }

    function createItemExclusionToggles(items) {
        items.forEach((item) => {
            const item_html = document.getElementById(`itemCardinventory_${item.quickSellParams[2]}`);
            item_html.onclick = () => {
                if (EXCLUDED_ITEM_IDS.includes(item.quickSellParams[2])) {
                    EXCLUDED_ITEM_IDS.splice(EXCLUDED_ITEM_IDS.indexOf(item.quickSellParams[2]), 1);
                } else {
                    EXCLUDED_ITEM_IDS.push(item.quickSellParams[2]);
                }

                displayFilteredMarketItems(items);
            };
        });
    }

    function quickSellItem(item) {
        const quickSellParams = item.quickSellParams;
        const name = item.name;
        const count = item.count;
        const rarity = RARITY_MAP[item.rarity];
        const estimatedValue = item.estimatedValue;

        console.log(`Quick selling ${name} (${count}) - ${rarity} - ${estimatedValue} coins`);

        window.quickSell(...quickSellParams);
        window.sellConfirmed(quickSellParams[0], 0, quickSellParams[2]);
        document.querySelector("#popupBack").click()
    }

    function quickSellFilteredItems(items) {
        const filteredItems = filterMarketItems(items);

        filteredItems.forEach((item) => {
            for (let i = 0; i < item.count; i++) {
                quickSellItem(item);
            }
        });
    }

    // Press "@" to activate the script
    document.addEventListener("keypress", e => {
        if (e.key === "@") {
            const items = getMarketItems();
            hideDefaultItemActions(items);
            displayQuickSellButton(items);
            createItemExclusionToggles(items);
            displayFilteredMarketItems(items);
        }
    });
})();