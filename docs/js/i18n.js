/**
 * Site internationalization runtime.
 * Chinese remains the canonical source copy; English is applied in place.
 */
(function() {
    'use strict';

    const STORAGE_KEY = 'pokemon-roms-language';
    const SUPPORTED_LANGUAGES = ['zh-CN', 'en'];

    const COPY = {
        'zh-CN': {
            'header.title': '口袋妖怪 ROM 中文版下载合集',
            'header.free': '永久免费',
            'header.explanation': '本站所有 rom 均是中文\n所谓的日版、美版等均是指在此之上做的汉化',
            'language.switch': 'Switch to English',
            'language.current': '当前语言：中文',
            'navigation.label': '游戏导航',
            'navigation.open': '打开游戏导航',
            'navigation.close': '关闭游戏导航',
            'backToTop': '回到顶部',
            'download.count': '下载 {count} 次',
            'download.countLabel': '下载 {count} 次',
            'download.unavailable': '计数暂不可用',
            'download.unavailableLabel': '下载计数暂不可用',
            'link.checking': '检测中',
            'link.checkingLabel': '正在自动检测下载链接',
            'link.valid': '有效',
            'link.validLabel': '链接有效',
            'link.invalid': '无效',
            'link.invalidLabel': '链接无效或检测失败',
            'link.pending': '待检测',
            'link.pendingLabel': '等待自动检测下载链接',
            'visit.label': '网站访问量',
            'visit.live': '实时访问量',
            'visit.today': '今日',
            'visit.total': '累计',
            'visit.calendar': '每日访问量日历',
            'visit.daily': '每日访问量',
            'visit.previousMonth': '上个月',
            'visit.nextMonth': '下个月',
            'visit.dayTitle': '{date} 访问量 {count}',
            'visit.calendarUnavailable': '日历暂不可用',
            'visit.summaryTitle': '今日访问量 {today}，累计访问量 {total}',
            'common.unavailable': '暂不可用',
            'pagination.previous': '← 上一个系列',
            'pagination.next': '下一个系列 →',
            'pagination.loading': '加载中...'
        },
        en: {
            'header.title': 'Pokémon ROM Downloads',
            'header.free': 'FREE FOREVER',
            'header.explanation': 'All ROMs hosted here include Chinese language support.\nLabels such as JP or US identify the original release used for the translation.',
            'language.switch': 'Switch to Chinese',
            'language.current': 'Current language: English',
            'navigation.label': 'Game navigation',
            'navigation.open': 'Open game navigation',
            'navigation.close': 'Close game navigation',
            'backToTop': 'Back to top',
            'download.count': 'DL {count}',
            'download.countLabel': '{count} downloads',
            'download.unavailable': 'Count unavailable',
            'download.unavailableLabel': 'Download count unavailable',
            'link.checking': 'Checking',
            'link.checkingLabel': 'Automatically checking download link',
            'link.valid': 'Online',
            'link.validLabel': 'Download link is online',
            'link.invalid': 'Offline',
            'link.invalidLabel': 'Download link is offline or could not be checked',
            'link.pending': 'Pending',
            'link.pendingLabel': 'Waiting to check download link',
            'visit.label': 'Site visits',
            'visit.live': 'Live visits',
            'visit.today': 'Today',
            'visit.total': 'All time',
            'visit.calendar': 'Daily visit calendar',
            'visit.daily': 'Daily visits',
            'visit.previousMonth': 'Previous month',
            'visit.nextMonth': 'Next month',
            'visit.dayTitle': '{date}: {count} visits',
            'visit.calendarUnavailable': 'Calendar unavailable',
            'visit.summaryTitle': '{today} visits today, {total} visits all time',
            'common.unavailable': 'Unavailable',
            'pagination.previous': '← Previous generation',
            'pagination.next': 'Next generation →',
            'pagination.loading': 'Loading...'
        }
    };

    const PAGE_METADATA = {
        'zh-CN': {
            title: '口袋妖怪ROM下载（免费） - Pokémon ROMs 中文版合集 | GBA/NDS/3DS/NS游戏免费下载',
            description: '完全免费！提供最全的口袋妖怪ROM中文版下载，包含第一至第九世代官方正版和热门改版，支持GBA、GBC、NDS、3DS、NS平台。漆黑的魅影、火红叶绿、绿宝石、剑盾等经典版本免费下载，无需付费。',
            keywords: '口袋妖怪,宝可梦,Pokemon,ROM下载,GBA游戏,NDS游戏,3DS游戏,NS游戏,中文版,漆黑的魅影,火红叶绿,绿宝石,改版,模拟器',
            ogTitle: '口袋妖怪ROM下载（免费） - Pokémon ROMs 中文版合集',
            ogDescription: '完全免费！提供最全的口袋妖怪ROM中文版下载，包含第一至第九世代官方正版和热门改版'
        },
        en: {
            title: 'Free Pokémon ROM Downloads | GBA, GBC, NDS, 3DS & Switch Collection',
            description: 'Browse a free collection of official Pokémon games and popular ROM hacks from Generations I through IX for GBA, GBC, NDS, 3DS and Nintendo Switch.',
            keywords: 'Pokemon ROM downloads,GBA games,GBC games,NDS games,3DS games,Nintendo Switch games,Pokemon ROM hacks,free Pokemon games',
            ogTitle: 'Free Pokémon ROM Downloads | Complete Game Collection',
            ogDescription: 'A free collection of official Pokémon games and popular ROM hacks from Generations I through IX.'
        }
    };

    const SECTION_TITLES = {
        'zh-CN': ['第一世代', '第二世代', '第三世代', '第四世代', '第五世代', '第六世代', '第七世代', '第八世代', '第九世代', '非官方改版'],
        en: ['Generation I', 'Generation II', 'Generation III', 'Generation IV', 'Generation V', 'Generation VI', 'Generation VII', 'Generation VIII', 'Generation IX', 'ROM Hacks']
    };

    const CARD_TITLES_EN = [
        'Pokémon Red', 'Pokémon Green', 'Pokémon Blue', 'Pokémon Yellow', 'Generation I Pokédex',
        'Pokémon Gold', 'Pokémon Silver', 'Pokémon Crystal', 'Generation II Pokédex',
        'Pokémon Ruby', 'Pokémon Sapphire', 'Pokémon Emerald', 'Pokémon FireRed', 'Pokémon LeafGreen', 'Generation III Pokédex',
        'Pokémon Diamond', 'Pokémon Pearl', 'Pokémon Platinum', 'Pokémon HeartGold', 'Pokémon SoulSilver', 'Generation IV Pokédex',
        'Pokémon Black', 'Pokémon White', 'Pokémon Black 2', 'Pokémon White 2', 'Generation V Pokédex',
        'Pokémon X', 'Pokémon Y', 'Pokémon Omega Ruby', 'Pokémon Alpha Sapphire', 'Generation VI Pokédex',
        'Pokémon Sun', 'Pokémon Moon', 'Pokémon Ultra Sun', 'Pokémon Ultra Moon', "Pokémon: Let's Go, Pikachu!", "Pokémon: Let's Go, Eevee!", 'Generation VII Pokédex',
        'Pokémon Sword', 'Pokémon Shield', 'Pokémon Legends: Arceus', 'Pokémon Brilliant Diamond', 'Pokémon Shining Pearl', 'Generation VIII Pokédex',
        'Pokémon Scarlet', 'Pokémon Violet', 'Pokémon Legends: Z-A', 'Generation IX Pokédex',
        'Pokémon Dark Phantom DP', 'Pokémon Dark Phantom BW', 'Pokémon Moemon: Dark Phantom', 'Pokémon Destiny Ruby', 'Pokémon Enhanced Emerald',
        'Pokémon Infinite Sapphire', 'Pokémon Rainbow Eraser', 'Pokémon Radiant Sky', 'Pokémon Moonlit Galaxy', 'Pokémon Dreams',
        'Pokémon Flora Sky', 'Pokémon Blue Stars 4', 'Pokémon Isle of Armor', 'Pokémon Sky Sovereign', 'Pokémon The Last Fire Red',
        'Pokémon HarvestCraft', 'Pokémon Trading Card Game', 'Pokémon Yu-Gi-Oh!', 'Pokémon Yellow Remake', 'Pokémon Yellow Chapter',
        'Pokémon Green Chapter', 'Pokémon FireGold', 'Pokémon Destiny Concerto', "Ash's Johto: The Final Beginning", 'Pokémon Blazing Emerald',
        'Pokémon DarkFire', 'Pokémon Gaia', "Pokémon Wally's Revenge", 'Pokémon Vega', 'Pokémon Sinnoh Chronicles',
        'Pokémon Mercury', 'Pokémon Mercury Battle Tower', 'Pokémon FireRed: Blast Burn', 'Pokémon Moss', 'Pokémon Life',
        'Pokémon Unbound', 'Touhoumon', 'Pokémon Dragon Ball Z', 'Pokémon Unbound', 'Pokémon Betelgeuse',
        'Pokémon Gold 97 Reforged', 'Pokémon Gold Experience', 'Pokémon Trash Emerald', 'Pokémon Meme Emerald', 'Pokémon Meme FireRed',
        'Pokémon No Emerald', 'Pokémon Crossroads of Fate', 'Pokémon Ultra Shiny Gold Sigma', 'Pokémon FireRed Scarlet & Violet', 'Pokémon Multiverse',
        'Pokémon Dark Rising', 'Pokémon Team Rocket Edition', 'Pokémon Pokédex Evolution', 'Pokémon Crystal Advance Redux', 'Pokémon FireRed 1200',
        'Pokémon Infinite Road', 'Pokémon Emerald 1600', 'Pokémon Quetzal', "Pokémon Let's Go Pikachu", "Pokémon Let's Go Eevee", 'Pokémon Exceeded'
    ];

    const CARD_DESCRIPTIONS_EN = [
        'The first Pokémon game, establishing the foundation of the series\' core gameplay.',
        'The first Pokémon game, establishing the foundation of the series\' core gameplay.',
        'Similar to Red and Green. Originally planned as a limited release, it later received a standard retail launch.',
        'Based on Red and Green, with Pikachu as your starting partner and additional animated story scenes.',
        'Kanto Region',
        'The first full-color Pokémon game, with expanded systems and gameplay that earned strong player acclaim.',
        'The first full-color Pokémon game, with expanded systems and gameplay that earned strong player acclaim.',
        'Adds a new story, the series\' first playable female protagonist, and an expanded Suicune storyline with special encounter requirements.',
        'Johto Region',
        'Expands the Pokédex to 386, adds Double Battles, Abilities and Natures, and ushers in a new era of breeding.',
        'Expands the Pokédex to 386, adds Double Battles, Abilities and Natures, and ushers in a new era of breeding.',
        'Adds a new story, fully animated Pokémon sprites, Gym Leader rematches, and expands the Battle Tower into the Battle Frontier.',
        'A remake of Red with a new story, the Sevii Islands, and a choice of male or female protagonist.',
        'A remake of Green with a new story, the Sevii Islands, and a choice of male or female protagonist.',
        'Hoenn Region',
        'The first mainline games with 3D models, the return of the day-night cycle, and extensive use of both DS screens.',
        'The first mainline games with 3D models, the return of the day-night cycle, and extensive use of both DS screens.',
        'Adds the Distortion World storyline and the Battle Frontier.',
        'A remake of Gold with new story content and the debut of the following Pokémon system.',
        'A remake of Silver with new story content and the debut of the following Pokémon system.',
        'Sinnoh Region',
        'A notably deep story, near-total 3D presentation, rich visual detail, and reusable HMs.',
        'A notably deep story, near-total 3D presentation, rich visual detail, and reusable HMs.',
        'The series\' only numbered sequel, continuing the story of Black with new locations and characters.',
        'The series\' only numbered sequel, continuing the story of White with new locations and characters.',
        'Unova Region',
        'The first fully 3D generation, introducing Fairy types and Mega Evolution with extensive trainer customization.',
        'The first fully 3D generation, introducing Fairy types and Mega Evolution with extensive trainer customization.',
        'A Ruby and Sapphire remake featuring the Rayquaza-focused Delta Episode, new characters and more.',
        'A Ruby and Sapphire remake featuring the Rayquaza-focused Delta Episode, new characters and more.',
        'Kalos Region',
        'The first official Chinese-localized release, introducing Z-Moves while replacing Gyms and Badges with island trials.',
        'The first official Chinese-localized release, introducing Z-Moves while replacing Gyms and Badges with island trials.',
        'Adds Ultra Space as a new area and brings Team Rocket back once again.',
        'Adds Ultra Space as a new area and brings Team Rocket back once again.',
        'A beginner-friendly entry with streamlined battles and gameplay inspired by Pokémon GO.',
        'A beginner-friendly entry with streamlined battles and gameplay inspired by Pokémon GO.',
        'Alola Region',
        'A mainline open-area adventure with free exploration of the Wild Area and the Dynamax system.',
        'A mainline open-area adventure with free exploration of the Wild Area and the Dynamax system.',
        'A highly open adventure set in ancient Sinnoh, where the player can move freely during battles.',
        'An externally developed mainline Diamond remake with upgraded visuals and additional story content.',
        'An externally developed mainline Pearl remake with upgraded visuals and additional story content.',
        'Galar & Hisui Regions',
        'The series\' first school-themed generation, with broader open-world exploration and the Terastal phenomenon.',
        'The series\' first school-themed generation, with broader open-world exploration and the Terastal phenomenon.',
        'A Nintendo Switch 2 launch title and sequel to X/Y, featuring an open map and a semi-real-time battle system where Trainers and Pokémon move together.',
        'Paldea Region',
        'An imaginative parallel-world story with many new maps. The DP edition offers Turtwig, Chimchar or Piplup as starters.',
        'An imaginative parallel-world story with many new maps. The BW edition offers Snivy, Tepig or Oshawott as starters.',
        'A Moemon reinterpretation of Dark Phantom with redesigned characters, more interactive companions, higher wild encounter rates and truly randomized items and berries.',
        'Celebi sends the hero into a future devastated by Shadow Lugia. Back in the present, the hero pursues the regional championship while trying to prevent that nightmare.',
        'Build relationships with NPCs, recruit them for battle, mine and produce resources, buy property, and unlock character skills with achievement points.',
        'A Chinese-made Sapphire hack with original Mega Evolutions, original Pokémon, new characters and 721 registered species.',
        'Arceus reveals a terrifying future as protagonists from across generations collide through unstable parallel timelines and the world nears its end.',
        'Visible overworld encounters and travel to Alola. The story is short, the campaign is brief, and shiny odds are greatly increased.',
        'Visible overworld encounters and travel to Alola. The story is short, the campaign is brief, and shiny odds are greatly increased.',
        'Original maps and story, some original Pokémon, Generation VII battle mechanics, forced Double Battles, type reversal and adjustable wild levels.',
        'Adds many Pokémon from Diamond, Pearl, Black and White, revised maps and numerous secrets in a story about rival teams trying to remake the world.',
        'A new region and story with Pokémon from Generations I-VIII, including Hisuian forms, plus Dynamax, Gigantamax, Mega Evolution and Z-Moves.',
        'Original maps and story, some original Pokémon, Generation VII battle mechanics, forced Double Battles, type reversal and adjustable wild levels.',
        'A top-tier fan project using extensive original assets, with maps, characters and animations more polished than the official base game.',
        'Adds all moves, Abilities, items, effects and Pokémon through Generation VII, along with new Evolution Stones and more.',
        'Replaces Gyms and the Pokémon League with farming traditions: tame and raise Pokémon in the countryside, grow crops and enjoy the harvest.',
        'Original maps and story, some original Pokémon, Generation VII battle mechanics, forced Double Battles, type reversal and adjustable wild levels.',
        'A FireRed hack inspired by the Yu-Gi-Oh! anime and games, replacing 163 Pokémon models with famous monster cards.',
        'A heartfelt Yellow remake built with Ruby and Sapphire assets, though it contains many bugs, including issues with Pikachu following in Celadon City.',
        'The prologue is not translated. Closely follows the Pokémon Adventures manga with almost every event tied to the comic.',
        'Closely follows the Pokémon Adventures manga, with nearly every event tied to the comic and adjustments to the power and PP of some moves.',
        'A FireRed-based hack spanning Kanto, Johto and Mt. Silver, with Fairy types, new moves and Abilities, plus Galarian and Hisuian forms.',
        'Original regions, Pokémon and items, modern mechanics such as the physical-special split and Fairy type, and enough freedom to begin without a starter Pokémon.',
        'The full title is Ash\'s Johto Adventure: The Final Beginning, adding cheats, an invisibility cloak, healing chamber, laptop, item lottery and distinctive monster-raising features.',
        'An entertaining hack with many original moves and Abilities plus hidden maps. Names and moves are fully translated, though the story translation ends at Mossdeep City.',
        'A dark and challenging story with Generation VII mechanics, battle tournaments replacing Gyms, an advanced battle engine, infinite TMs and a new region to explore.',
        'A successful fan-made adventure with an original story, all 721 Pokémon, Mega Evolution and optional conveniences such as purchasable Master Balls and Rare Candies.',
        'Play as Wally, Brendan\'s rival, facing Team Aqua and Team Magma before climbing to the top of the League for a final championship battle.',
        'A story-driven hack filled with original Pokémon, Evolutions, moves, maps and plotlines, plus well-paced progression and creative puzzles.',
        'Recreates Sinnoh and the Diamond, Pearl and Platinum story with Generation VII battles, 809 Pokémon, Fairy types and later-generation moves, Abilities and quality-of-life systems.',
        'Built on HeartGold and SoulSilver with a redesigned story, modern battles and following mechanics, Pokémon through Legends: Arceus and improved enemy AI.',
        'After defeating Team Rocket and the League, the hero sets out to conquer four Battle Frontier facilities with Generation VIII Pokémon and Mega, Z-Move and Dynamax systems.',
        'A FireRed remake-style hack with Pokémon from Generations I-VII, experience from catching, BW-style overworld sprites and new evolution methods.',
        'A massive new map with more than 800 Pokémon, dramatically strengthened species and a police-officer protagonist setting out on an adventure.',
        'A new region with animated Pokémon, a new Pokédex, day-night events and updated moves, Abilities and physical-special split. Blue crystals are save points and fainting ends the run.',
        'Uses Pokémon Light Platinum map assets, grants an Exp. Share at the start, applies level caps before each Gym and raises shiny odds to 1 in 20.',
        'A Touhou Project crossover where Pokémon become cute girls and battles, moves and music are redesigned in Touhou style.',
        'Combines Pokémon systems with the world of Dragon Ball Z, replacing Pokémon models in battle and the Pokédex with Dragon Ball warriors.',
        'An acclaimed FireRed hack with a rich original story, Pokémon through Generation VIII, character customization, daily missions, puzzles and an extreme Insane mode.',
        'A new original story in the explorable region of Koren, with parts of Hoenn available after completion, Generation V art and modern mechanics.',
        'A remake of the 1997 GS demo containing every demo Pokémon, with a GSC-like journey to earn Badges, complete the Pokédex and defeat Team Rocket.',
        'Pokémon from every generation, more than 100 later-generation moves and Abilities, a BW repel system, field moves replacing HMs, reusable TMs and the physical-special split.',
        'The first comedy entry in the Meme Emerald series, following May as her family moves overnight from Johto to Hoenn after she makes too many enemies.',
        'The second comedy entry in the Meme Emerald series, featuring built-in cheats, the physical-special split, a hidden route and seven endings.',
        'The third comedy entry in the series spans Kanto and Three Island, with high battle difficulty and optional built-in cheats.',
        'The fourth comedy entry turns the formula upside down with explosive Trainer-versus-Trainer combat.',
        'An original comedy story starring a fiery May and a chaotic Kanto day trip with multiple endings and deliberately wild battle balance.',
        'More than 807 Pokémon from Generations I-VIII, including Alolan and Galarian forms, Wonder Trade and rematches at every Gym.',
        'Pokémon from Generations I-IX with more than 800 included species, revised stats, types and moves, and several new moves in the original FireRed story.',
        'A new story featuring Trainers from every region, protagonists from Generations I-VII, legendary characters from later generations and many legendary Pokémon.',
        'Completely redesigned maps and a new story, introducing many Black 2 and White 2 Pokémon, full-background battles and a quest for 16 Badges.',
        'Steal Pokémon from Trainers, uncover Kanto\'s secrets while Red is away, battle major original-game characters and enjoy modernized systems and UI.',
        'Starters are guaranteed shiny, and every level evolves a Pokémon into the next Pokédex number. The cap is 251, with four new rivals and a short third campaign.',
        'A faithful Crystal remake with Generation IV Pokémon, a choice of Ethan or Red, updated movesets, new type and Pokémon icons, reusable TMs and Goldenrod daily trades.',
        'Ports 1,025 Pokémon from Scarlet and Violet into FireRed, organized by generation across the map and Pokédex while keeping the original map and story.',
        'From the creator of FireRed 1600, this upgraded edition fills the world with legendary Pokémon, level-99 helpers and treasure items.',
        'Ports 1,025 Pokémon from Scarlet and Violet into Emerald, organized by generation across the map and Pokédex while keeping the original map and story.',
        'An Emerald-based adventure with epic cooperative multiplayer and Pokémon from nine generations, including Alolan, Galarian, Terapagos and Ogerpon DLC forms.',
        'Visible encounters, party-wide experience, an early Mew, Mega Evolution in battle, Alolan and Galarian forms, and Pokémon from Sword and Shield.',
        'Visible encounters, party-wide experience, an early Mew, Mega Evolution in battle, Alolan and Galarian forms, and Pokémon from Sword and Shield.',
        'A new Emerald-based hack with original mechanics, Pokémon through Generation VIII, Nuzlocke mode and Mega Evolution.'
    ];

    const DOWNLOAD_LABELS = {
        '[简中]': 'ZH-CN',
        '[中文]': 'CN',
        '[简体中文]': 'ZH-CN',
        '[繁中 GBA]': 'ZH-TW',
        '[简中 2022]': 'ZH-CN · 2022',
        '[简中 2024 官译]': 'Official · 2024',
        '[简中 GBA+CIA 2019]': 'ZH-CN · 2019',
        '[简中 GBA+CIA 2023 官译]': 'Official · 2023',
        '[简中 GBC+GBA+CIA]': 'ZH-CN',
        '[493官译版-2023]': '493 · 2023',
        '[日版]': 'JP',
        '[美版]': 'US',
        '[韩版]': 'KR',
        '[西班牙文]': 'ES',
        '[只有西班牙文]': 'ES only',
        '[只有英文版]': 'EN only',
        '[官方全语言]': 'All languages',
        '[高清版]': 'HD',
        '[复古版]': 'Retro',
        '[第一部]': 'Part I',
        '[第二部]': 'Part II',
        '[简单]': 'Easy',
        '[困难]': 'Hard',
        '[正常版]': 'Standard',
        '[魔法]': 'Magic',
        '[魔法版]': 'Magic Edition'
    };

    const DOWNLOAD_LABEL_DESCRIPTIONS = {
        '[简中]': 'Simplified Chinese',
        '[中文]': 'Chinese',
        '[简体中文]': 'Simplified Chinese',
        '[繁中 GBA]': 'Traditional Chinese for GBA',
        '[简中 2022]': 'Simplified Chinese, 2022 release',
        '[简中 2024 官译]': 'Official Chinese, 2024 release',
        '[简中 GBA+CIA 2019]': 'Simplified Chinese for GBA and CIA, 2019 release',
        '[简中 GBA+CIA 2023 官译]': 'Official Chinese for GBA and CIA, 2023 release',
        '[简中 GBC+GBA+CIA]': 'Simplified Chinese for GBC, GBA and CIA',
        '[493官译版-2023]': 'Official 493 edition, 2023 release',
        '[日版]': 'Japanese edition',
        '[美版]': 'English US edition',
        '[韩版]': 'Korean edition',
        '[西班牙文]': 'Spanish edition',
        '[只有西班牙文]': 'Spanish only',
        '[只有英文版]': 'English only',
        '[官方全语言]': 'Official release with all languages'
    };

    const ATTRIBUTE_SOURCE = new WeakMap();
    let currentLanguage = resolveInitialLanguage();

    function normalizeLanguage(value) {
        return String(value || '').toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
    }

    function resolveInitialLanguage() {
        const urlLanguage = new URLSearchParams(window.location.search).get('lang');
        if (urlLanguage) return normalizeLanguage(urlLanguage);

        try {
            const savedLanguage = localStorage.getItem(STORAGE_KEY);
            if (SUPPORTED_LANGUAGES.includes(savedLanguage)) return savedLanguage;
        } catch (error) {
            // Storage may be unavailable in privacy modes.
        }

        return normalizeLanguage(navigator.languages?.[0] || navigator.language || 'zh-CN');
    }

    function t(key, replacements) {
        let value = COPY[currentLanguage]?.[key] || COPY['zh-CN'][key] || key;
        Object.entries(replacements || {}).forEach(([name, replacement]) => {
            value = value.replaceAll(`{${name}}`, replacement);
        });
        return value;
    }

    function getLocale() {
        return currentLanguage === 'zh-CN' ? 'zh-CN' : 'en-US';
    }

    function translateDownloadLabel(sourceLabel, language = currentLanguage) {
        const normalized = String(sourceLabel || '').trim();
        if (language === 'zh-CN') return normalized;
        return DOWNLOAD_LABELS[normalized] || normalized.replace(/^\[(.*)\]$/, '$1');
    }

    function describeDownloadLabel(sourceLabel, language = currentLanguage) {
        const normalized = String(sourceLabel || '').trim();
        if (language === 'zh-CN') return normalized.replace(/^\[(.*)\]$/, '$1');
        return DOWNLOAD_LABEL_DESCRIPTIONS[normalized]
            || translateDownloadLabel(normalized, language).replace(/^\[(.*)\]$/, '$1');
    }

    function translateCommonText(source, language) {
        if (language === 'zh-CN') return source;

        const replacements = new Map([
            ['下载：', 'Downloads:'],
            ['格式：', 'Formats:'],
            ['资料来源', 'Source'],
            ['资料来源 1', 'Source 1'],
            ['资料来源 2', 'Source 2'],
            ['存档异常解决', 'Save-file troubleshooting'],
            ['游戏导航', 'Game navigation'],
            ['导航', 'Menu']
        ]);
        if (replacements.has(source)) return replacements.get(source);
        if (DOWNLOAD_LABELS[source]) return DOWNLOAD_LABELS[source];
        if (/^发售日期：/.test(source)) return source.replace('发售日期：', 'Release date:');
        if (/^公开日期：/.test(source)) return source.replace('公开日期：', 'Published:');
        if (/^图鉴：\s*/.test(source)) return source.replace(/^图鉴：\s*/, 'Pokédex: ');

        const generation = source.match(/^(GBC|GBA|NDS|3DS|NS|NS\/NS2)：\s*第([一二三四五六七八九])世代$/);
        if (generation) {
            const roman = { 一: 'I', 二: 'II', 三: 'III', 四: 'IV', 五: 'V', 六: 'VI', 七: 'VII', 八: 'VIII', 九: 'IX' }[generation[2]];
            return `${generation[1]}: Generation ${roman}`;
        }
        return source;
    }

    function applyMetadata(language) {
        const metadata = PAGE_METADATA[language];
        document.title = metadata.title;
        const setMeta = (selector, value) => {
            const element = document.querySelector(selector);
            if (element) element.setAttribute('content', value);
        };
        setMeta('meta[name="description"]', metadata.description);
        setMeta('meta[name="keywords"]', metadata.keywords);
        setMeta('meta[property="og:title"]', metadata.ogTitle);
        setMeta('meta[property="og:description"]', metadata.ogDescription);
        setMeta('meta[name="twitter:title"]', metadata.ogTitle);
        setMeta('meta[name="twitter:description"]', metadata.ogDescription);
        setMeta('meta[property="og:locale"]', language === 'zh-CN' ? 'zh_CN' : 'en_US');
        setMeta('meta[property="og:url"]', language === 'zh-CN'
            ? 'https://pokemon-roms.top/'
            : 'https://pokemon-roms.top/?lang=en');

        const structuredData = document.querySelector('script[type="application/ld+json"]');
        if (structuredData) {
            try {
                const data = JSON.parse(structuredData.textContent);
                data.description = metadata.description;
                data.inLanguage = language;
                structuredData.textContent = JSON.stringify(data);
            } catch (error) {
                console.warn('Unable to localize structured data:', error);
            }
        }
    }

    function applyHeader(language) {
        const setText = (selector, key) => {
            const element = document.querySelector(selector);
            if (element) element.textContent = COPY[language][key];
        };
        setText('.site-title', 'header.title');
        setText('.header-free', 'header.free');

        const explanation = document.querySelector('.header-explanation');
        if (explanation) {
            explanation.innerHTML = COPY[language]['header.explanation'].replace('\n', '<br>');
        }
    }

    function applySections(language) {
        document.querySelectorAll('h4[id^="section-"]').forEach((section, index) => {
            section.textContent = SECTION_TITLES[language][index] || section.textContent;
        });
    }

    function applyCards(language) {
        document.querySelectorAll('.card').forEach((card, index) => {
            const titleElement = card.querySelector('.card-title');
            const descriptionElement = card.querySelector('.list-group-item-primary');
            const title = language === 'en'
                ? CARD_TITLES_EN[index]
                : titleElement?.dataset.i18nZh;
            const description = language === 'en'
                ? CARD_DESCRIPTIONS_EN[index]
                : descriptionElement?.dataset.i18nZh;

            if (titleElement && !titleElement.dataset.i18nZh) {
                titleElement.dataset.i18nZh = titleElement.textContent.trim();
            }
            if (descriptionElement && !descriptionElement.dataset.i18nZh) {
                descriptionElement.dataset.i18nZh = descriptionElement.innerHTML;
            }

            const resolvedTitle = language === 'en' ? title : titleElement?.dataset.i18nZh;
            const resolvedDescription = language === 'en' ? description : descriptionElement?.dataset.i18nZh;
            if (titleElement && resolvedTitle) titleElement.textContent = resolvedTitle;
            if (descriptionElement && resolvedDescription) {
                if (language === 'zh-CN') descriptionElement.innerHTML = resolvedDescription;
                else descriptionElement.textContent = resolvedDescription;
            }

            const cover = card.querySelector('.card-img');
            if (cover && resolvedTitle) cover.alt = resolvedTitle;
            const coverLink = card.querySelector('.row.g-0 > div:first-child a');
            if (coverLink && resolvedTitle) {
                coverLink.setAttribute('aria-label', language === 'en'
                    ? `View the ${resolvedTitle} cover at full size`
                    : `查看${resolvedTitle}封面大图`);
            }
        });
    }

    function rememberAttribute(element, name) {
        let values = ATTRIBUTE_SOURCE.get(element);
        if (!values) {
            values = {};
            ATTRIBUTE_SOURCE.set(element, values);
        }
        if (!(name in values)) values[name] = element.getAttribute(name) || '';
        return values[name];
    }

    function applyDownloadButtons(language) {
        document.querySelectorAll('.list-group-item-danger .button-link').forEach(button => {
            if (!button.dataset.i18nDownloadLabel) {
                const text = button.dataset.downloadLabel || button.textContent.trim();
                button.dataset.i18nDownloadLabel = text;
            }
            const translatedLabel = translateDownloadLabel(button.dataset.i18nDownloadLabel, language);
            const labelElement = button.querySelector('.download-label');
            if (labelElement) {
                labelElement.textContent = translatedLabel.replace(/^\[(.*)\]$/, '$1');
                labelElement.title = labelElement.textContent;
            } else {
                button.textContent = translatedLabel;
            }

            const cardTitle = button.closest('.card')?.querySelector('.card-title')?.textContent.trim() || '';
            const accessibleLabel = describeDownloadLabel(button.dataset.i18nDownloadLabel, language);
            button.setAttribute('aria-label', language === 'en'
                ? `Download ${cardTitle}: ${accessibleLabel}`
                : `下载${cardTitle} ${accessibleLabel}`);
        });
    }

    function applyCommonText(language) {
        const selectors = [
            '.list-group-item-success',
            '.list-group-item-danger',
            '.list-group-item-warning',
            '.card-footer small',
            '.card-footer a'
        ];

        document.querySelectorAll(selectors.join(',')).forEach(element => {
            Array.from(element.childNodes).forEach(node => {
                if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) return;
                if (!node.__i18nSource) node.__i18nSource = node.textContent;
                const source = node.__i18nSource;
                const leading = source.match(/^\s*/)?.[0] || '';
                const trailing = source.match(/\s*$/)?.[0] || '';
                node.textContent = leading + translateCommonText(source.trim(), language) + trailing;
            });
        });

        document.querySelectorAll('[title]').forEach(element => {
            const source = rememberAttribute(element, 'title');
            if (language === 'zh-CN') {
                element.setAttribute('title', source);
                return;
            }
            if (source === '回到顶部') element.setAttribute('title', 'Back to top');
            if (source === '游戏导航') element.setAttribute('title', 'Game navigation');
            if (source.includes('Game Boy 游戏的 ROM 文件')) element.setAttribute('title', 'Game Boy ROM file');
            if (source.includes('Game Boy Color 游戏的 ROM 文件')) element.setAttribute('title', 'Game Boy Color ROM file');
            if (source.includes('Game Boy Advance 游戏的 ROM 文件')) element.setAttribute('title', 'Game Boy Advance ROM file');
            if (source.includes('Nintendo DS 游戏的 ROM 文件')) element.setAttribute('title', 'Nintendo DS ROM file');
            if (source.includes('无需安装 CIA') && source.includes('R4 卡')) element.setAttribute('title', 'Nintendo DS game playable from an R4 card without installing a CIA package');
            if (source.includes('3DS 游戏的 ROM 文件')) element.setAttribute('title', 'Nintendo 3DS ROM file');
            if (source.includes('3DS 的安装包')) element.setAttribute('title', 'Installable Nintendo 3DS package');
            if (source.includes('NS 游戏的 ROM 文件')) element.setAttribute('title', 'Nintendo Switch ROM file');
            if (source.includes('NS 的安装包')) element.setAttribute('title', 'Nintendo Switch installable package');
        });
    }

    function updateLanguageControl(language) {
        const control = document.getElementById('languageToggle');
        if (!control) return;
        control.setAttribute('aria-label', COPY[language]['language.switch']);
        control.setAttribute('title', COPY[language]['language.switch']);
        control.setAttribute('aria-pressed', String(language === 'en'));
        control.querySelectorAll('[data-language-option]').forEach(option => {
            option.classList.toggle('is-active', option.dataset.languageOption === language);
        });
        const status = document.getElementById('languageStatus');
        if (status) status.textContent = COPY[language]['language.current'];
    }

    function applyLanguage(language) {
        currentLanguage = normalizeLanguage(language);
        document.documentElement.lang = currentLanguage;
        document.documentElement.dataset.language = currentLanguage;
        applyMetadata(currentLanguage);
        applyHeader(currentLanguage);
        applySections(currentLanguage);
        applyCards(currentLanguage);
        applyCommonText(currentLanguage);
        applyDownloadButtons(currentLanguage);
        updateLanguageControl(currentLanguage);
        document.documentElement.classList.add('i18n-ready');
    }

    function setLanguage(language, options = {}) {
        const nextLanguage = normalizeLanguage(language);
        const changed = nextLanguage !== currentLanguage;
        applyLanguage(nextLanguage);

        if (options.persist !== false) {
            try {
                localStorage.setItem(STORAGE_KEY, nextLanguage);
            } catch (error) {
                // Storage may be unavailable in privacy modes.
            }
        }

        if (options.updateUrl !== false) {
            const url = new URL(window.location.href);
            if (nextLanguage === 'zh-CN') url.searchParams.delete('lang');
            else url.searchParams.set('lang', 'en');
            history.replaceState(history.state, '', `${url.pathname}${url.search}${url.hash}`);
        }

        if (changed || options.forceEvent) {
            window.dispatchEvent(new CustomEvent('siteLanguageChanged', {
                detail: { language: nextLanguage, locale: getLocale() }
            }));
        }
    }

    function init() {
        applyLanguage(currentLanguage);
        const toggle = document.getElementById('languageToggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                setLanguage(currentLanguage === 'zh-CN' ? 'en' : 'zh-CN', { forceEvent: true });
            });
        }
    }

    document.documentElement.lang = currentLanguage;
    document.documentElement.dataset.language = currentLanguage;
    window.siteI18n = {
        t,
        getLanguage: () => currentLanguage,
        getLocale,
        setLanguage,
        translateDownloadLabel,
        describeDownloadLabel
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
