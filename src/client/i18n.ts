// Bilingual UI (English / Türkçe). DOM screens carry data-i18n / data-i18n-html
// attributes; the canvas renderer calls t() directly. Choice persists in settings.

import { setFontLocale } from './render/font';
import { loadSettings, saveSettings } from './settings';

export type Lang = 'en' | 'tr';
let lang: Lang = loadSettings().lang ?? 'en';

export const TR: Record<string, string> = {
  // ---- shell / menus
  'LOADING': 'YÜKLENİYOR',
  'Warming up the çay…': 'Çay demleniyor…',
  'PRESS Z / ENTER / TAP TO START': 'Z / ENTER / DOKUN VE BAŞLA',
  '© XiØN / XiONDiGiTaL — original game, original art & music': '© XiØN / XiONDiGiTaL — özgün oyun, özgün görsel ve müzik',
  'MAIN MENU': 'ANA MENÜ',
  'SOLO PLAY': 'TEK KİŞİLİK',
  'ONLINE CO-OP': 'İNTERNETLE ORTAK',
  'HOW TO PLAY': 'NASIL OYNANIR',
  'SETTINGS': 'AYARLAR',
  'CREDITS': 'KÜNYE',
  'BACK': 'GERİ',
  'CHOOSE YOUR FIGHTER': 'DÖVÜŞÇÜNÜ SEÇ',
  'ONLINE CO-OP LOBBY': 'İNTERNET ODASI',
  'NAME': 'İSİM',
  'Your name, shown on the HUD.': 'İsmin, oyun içi göstergede görünür.',
  'Your name, shown in the room and on the HUD. Everyone types their own.': 'İsmin odada ve oyun içi göstergede görünür. Her oyuncu kendi ismini yazar.',
  'CHAPTER': 'BÖLÜM',
  'SECTION': 'KISIM',
  'FIGHT!': 'DÖVÜŞ!',
  'CREATE ROOM': 'ODA AÇ',
  'CODE': 'KOD',
  'JOIN': 'KATIL',
  'Online: host-authoritative rooms over a secure relay. The room creator runs the game.': 'İnternet: güvenli aktarım üzerinden oda sahibinin yönettiği oyun.',
  'Online: dedicated server (server-authoritative).': 'İnternet: sunucu tarafından yönetilen oyun.',
  'ROOM': 'ODA',
  'COPY INVITE LINK': 'DAVET LİNKİNİ KOPYALA',
  'FIGHTER': 'DÖVÜŞÇÜ',
  'LEAVE': 'ÇIK',
  'READY': 'HAZIR',
  'START': 'BAŞLA',
  'Waiting for everyone to ready up. Share the code or link.': 'Herkesin hazır olması bekleniyor. Kodu veya linki paylaş.',
  'Ready up! The host starts the game.': 'Hazır ol! Oyunu oda sahibi başlatır.',
  'Everyone is ready — press START!': 'Herkes hazır — BAŞLA’ya bas!',
  'PAUSED': 'DURAKLATILDI',
  'RESUME': 'DEVAM',
  'QUIT TO TITLE': 'BAŞLIĞA DÖN',
  'TITLE SCREEN': 'BAŞLIK EKRANI',
  'BACK TO LOBBY': 'ODAYA DÖN',
  'PLAY AGAIN': 'TEKRAR OYNA',
  'CONTROLS': 'KONTROLLER',
  'CLOSE': 'KAPAT',
  '(click a key to remap)': '(tuşu değiştirmek için tıkla)',
  'RESET KEYS': 'TUŞLARI SIFIRLA',
  'FIGHTING': 'DÖVÜŞ',
  'FOOD & MONEY': 'YEMEK VE PARA',
  'Gamepad: D-pad/stick move · A jump / confirm · B grab / cancel · X light · Y heavy · LB dodge · RB block · LT eat · RT run · Back next item · Start pause.': 'Kol: yön tuşları hareket · A zıpla / onayla · B tut / geri · X hafif · Y ağır · LB atıl · RB blok · LT ye · RT koş · Back sonraki yiyecek · Start duraklat.',
  // ---- settings
  'SOUND': 'SES', 'SOUND: ON': 'SES: AÇIK', 'SOUND: OFF': 'SES: KAPALI',
  'MUSIC': 'MÜZİK',
  'EFFECTS': 'SES EFEKTLERİ',
  'MUTE ALL': 'TÜMÜNÜ SUSTUR',
  'SCREEN SHAKE': 'EKRAN SARSINTISI',
  'CRT FILTER': 'CRT FİLTRESİ',
  'CONTROLLER RUMBLE': 'KOL TİTREŞİMİ',
  'TOUCH PAD': 'DOKUNMATİK',
  'LANGUAGE': 'DİL',
  'AUTO': 'OTOMATİK',
  'ON': 'AÇIK',
  'OFF': 'KAPALI',
  'ENGLISH': 'İNGİLİZCE',
  'TÜRKÇE': 'TÜRKÇE',
  // ---- howto
  'Tap LIGHT for combos. B.T. chains 4 hits, S.C. ends with a launching uppercut.': 'Hafif vuruşla kombo yap. B.T. 4 vuruş zincirler, S.C. havaya kaldıran bir aparkatla bitirir.',
  'HEAVY after a light chain is a combo finisher.': 'Hafif zincirden sonra AĞIR vuruş kombo bitiricisidir.',
  'GRAB an enemy in front of you — a GRAB tag marks the ones in reach. While holding: LIGHT = slap/knee (the last one knocks down; Aynur\'s fifth), HEAVY = throw. Hold a direction to throw that way. Thrown enemies bowl over others.': 'Önündeki düşmanı TUT — TUT etiketi erimindeki düşmanları işaretler. Tutarken: HAFİF = tokat/diz (sonuncusu yere serer; AYNUR\'da beşinci), AĞIR = fırlat. Yön basılı tutarak o yöne fırlat. Fırlatılan düşmanlar diğerlerini devirir.',
  'Hit enemies enough and they get dizzy — even bosses can be grabbed while dizzy or TIRED after a big special.': 'Düşmanları yeterince vurursan sersemler — patronlar bile sersemken veya büyük özel hareketten sonra YORGUNKEN tutulabilir.',
  'A flashing ! means a big attack is coming: dodge, jump or get out of the way.': 'Yanıp sönen ! büyük bir saldırı geliyor demek: atıl, zıpla ya da kaç.',
  'Watch for the yellow lane warning: trams, taxis, bikes and golf carts hit everyone.': 'Sarı şerit uyarısına dikkat: tramvay, taksi, bisiklet ve golf arabası herkese çarpar.',
  'Enemies drop coins: whoever touches them first keeps them. Food is picked up with GRAB: eaten at once if it helps, otherwise stored in your bag. One wallet across the whole campaign: lira in Türkiye, dollars in the USA. Shops sell into your bag.': 'Düşmanlar para düşürür: ilk dokunan alır. Yemek TUT ile alınır: işe yarıyorsa hemen yenir, yoksa çantana girer. Tüm oyun tek cüzdan: Türkiye’de lira, ABD’de dolar. Marketler çantana satar.',
  // ---- credits
  'Design, code, pixel art & chiptunes generated for XiØN / XiONDiGiTaL. All characters, sprites, music and sound are original to this game. Fonts built from the game’s own lettering sheet. Nutella is a trademark of Ferrero; it appears here only as a food item. No affiliation.': 'Tasarım, kod, piksel sanat ve chiptune’lar XiØN / XiONDiGiTaL için üretildi. Tüm karakterler, sprite’lar, müzik ve sesler bu oyuna özgüdür. Yazı tipleri oyunun kendi harf sayfasından üretildi. Nutella, Ferrero’nun ticari markasıdır; burada yalnızca yiyecek olarak geçer. Bağlantı yoktur.',
  // ---- item names / descriptions
  'Ayran': 'Ayran', 'Bananas': 'Muz', 'Lahmacun': 'Lahmacun', 'Baklava': 'Baklava', 'Sucuk': 'Sucuk', 'Nutella': 'Nutella',
  // shop meals: what each city's shops actually sell
  'Tortillas': 'Tortilla', 'Taco': 'Tako', 'Quesadilla': 'Quesadilla', 'Elote': 'Elote',
  'Burrito': 'Burrito', 'Pastor Plate': 'Pastor Tabağı',
  'Bagel': 'Bagel', 'Plantain Chips': 'Muz Cipsi', 'Beef Patty': 'Kıymalı Çörek', 'Knish': 'Knish',
  'Chopped Cheese': 'Kıymalı Sandviç', 'Bronx Hero': 'Bronx Sandviç',
  'Çay': 'Çay', 'Simit': 'Simit', 'Börek': 'Börek', 'Lokum': 'Lokum', 'Dondurma': 'Dondurma',
  'Karışık Pide': 'Karışık Pide',
  'Turşu Suyu': 'Turşu Suyu', 'Kestane': 'Kestane', 'Mısır': 'Mısır', 'Midye Dolma': 'Midye Dolma',
  'Nar Suyu': 'Nar Suyu', 'Balık Ekmek': 'Balık Ekmek',
  'Small heal.': 'Küçük iyileşme.', 'Medium heal.': 'Orta iyileşme.', 'Large heal.': 'Büyük iyileşme.',
  'Full restore.': 'Tam iyileşme.', 'Full restore. Rare.': 'Tam iyileşme. Nadir.',
  'SHOP MEALS (SOLD BY CITY VENDORS)': 'DÜKKÂN YEMEKLERİ (ŞEHİR SATICILARI)',
  'FULL HP': 'TAM CAN', 'BAG': 'ÇANTA', 'WALLET': 'CÜZDAN',
  // ---- stage names
  'Chapter 1: Concrete Jungle': 'Bölüm 1: Beton Ormanı',
  'Chapter 2: Aegean Sunset': 'Bölüm 2: Ege Gün Batımı',
  'Chapter 3: Bosphorus Morning': 'Bölüm 3: Boğaz Sabahı',
  'Chapter 4: Sunshine State': 'Bölüm 4: Güneş Eyaleti',
  'Flatbush Avenue': 'Flatbush Caddesi', 'Bedford Row': 'Bedford Sokağı', 'The Boiler Room': 'Kazan Dairesi',
  'Kordon Boyu': 'Kordon Boyu', 'Kemeraltı Bazaar': 'Kemeraltı Çarşısı', 'Saat Kulesi Square': 'Saat Kulesi Meydanı',
  'Kadıköy Çarşı': 'Kadıköy Çarşısı', 'Galata Morning': 'Galata Sabahı', 'Galata Rooftop': 'Galata Çatısı',
  'Bayshore Boardwalk': 'Bayshore Sahil Yolu', 'Ybor Strip': 'Ybor Sokağı', 'The Last Pier': 'Son İskele',
  'CONCRETE JUNGLE': 'BETON ORMANI', 'AEGEAN SUNSET': 'EGE GÜN BATIMI', 'BOSPHORUS MORNING': 'BOĞAZ SABAHI', 'SUNSHINE STATE': 'GÜNEŞ EYALETİ',
  // ---- story / bosses
  'The last jar of Nutella in Brooklyn went missing at midnight. The trail starts on Flatbush.': 'Brooklyn’deki son Nutella kavanozu gece yarısı kayboldu. İz Flatbush’ta başlıyor.',
  'The ferry lands at sunset. Fehmi is holding court at the tea house on the Kordon.': 'Vapur gün batımında yanaşıyor. Fehmi Kordon’daki çay bahçesinde saltanat sürüyor.',
  'Morning in Kadıköy. The Dondurma Man is already twirling his stick by the ferry dock.': 'Kadıköy’de sabah. Dondurmacı vapur iskelesinde sopasını çeviriyor bile.',
  'The last jar is on a Tampa pier, guarded by a man who has never lost a cane fight.': 'Son kavanoz Tampa iskelesinde, baston dövüşü hiç kaybetmemiş bir adamın koruması altında.',
  'NYC BUM': 'NYC SERSERİSİ', 'DUMPSTER DUKE': 'ÇÖP KONTEYNERİ DÜKÜ',
  'King of the Alley': 'Ara Sokağın Kralı', "You want the jar? Come take it from the Duke.": 'Kavanozu mu istiyorsun? Gel Dük’ten al.',
  "Alright, alright! The jar's yours, kid.": 'Tamam, tamam! Kavanoz senin, evlat.',
  'BIYIKLI FEHMI': 'BIYIKLI FEHMİ', 'The Tea House Champion': 'Çay Bahçesi Şampiyonu',
  'Sip first. Then we fight. That is the rule.': 'Önce çay içilir. Sonra dövüşürüz. Kural budur.',
  'My tea has gone cold. You win, kanka.': 'Çayım soğudu. Kazandın kanka.',
  'DONDURMA MAN': 'DONDURMACI', 'THE DONDURMA MAN': 'DONDURMACI', 'Master of the Long Stick': 'Uzun Sopanın Ustası',
  'One scoop. One chance. Catch it if you can!': 'Bir top. Bir şans. Yakalayabilirsen yakala!',
  'Eh... the dondurma melts. You win this round.': 'Eh... dondurma eridi. Bu raundu kazandın.',
  'THE TAMPA MAN': 'TAMPA BEYİ', 'President of the Homeowners Association': 'Ev Sahipleri Derneği Başkanı',
  'This pier is private property, sonny.': 'Bu iskele özel mülk, evlat.',
  "Fine. FINE. I'll write you a permit.": 'Peki. PEKİ. Sana izin kâğıdı yazacağım.',
  // ---- shops
  'BODEGA': 'BAKKAL', 'HOT DOG CART': 'SOSİSLİ ARAÇ', 'BAKKAL': 'BAKKAL', 'SİMİT CART': 'SİMİT ARABASI',
  'PAZAR': 'PAZAR', 'ÇAY STAND': 'ÇAY TEZGÂHI', 'TACOS': 'TACOS', 'TACO TRUCK': 'TACO KAMYONU',
  'OPEN 24/7 · COLD DRINKS': '7/24 AÇIK · SOĞUK İÇECEK', 'SABRETT · DIRTY WATER · ICE COLD': 'SABRETT · KAYNAK SUYU · BUZ GİBİ',
  'BAKKAL · ŞARKÜTERİ · 7/24': 'BAKKAL · ŞARKÜTERİ · 7/24', 'TAZE SİMİT · AÇIK HAVA': 'TAZE SİMİT · AÇIK HAVA',
  'KESTANE · MISIR · TURŞU': 'KESTANE · MISIR · TURŞU', 'DEMLİ ÇAY · SICAK SİMİT': 'DEMLİ ÇAY · SICAK SİMİT',
  'TACOS · LIMON · PLAYA': 'TACOS · LİMON · PLAYA', 'TACOS – LIMON · ABIERTO': 'TACOS · LİMON · AÇIK',
  "What's good, papi? Chopped cheese is hot.": 'Ne var ne yok papi? Sıcak chopped cheese.',
  'Bagel and chips, baby? Mind the doors.': 'Bagel ve cips, canım? Kapıya dikkat.',
  "Best cart on the block, buddy. Knish's warm.": 'Mahallenin en iyi arabası, dostum. Knish sıcak.',
  'Fresh tortillas, amigo!': 'Taze tortillalar, amigo!',
  'Tacos, carnal? Elote is off the grill.': 'Tako ister misin, carnal? Elote ızgaradan yeni çıktı.',
  'NEWSSTAND': 'GAZETE BÜFE', 'PAPERS · CANDY · METROCARD': 'GAZETE · ŞEKER · METROKART',
  'Dee': 'Dee', 'Marcos': 'Marcos', 'Sal': 'Sal', 'Hüsnü': 'Hüsnü', 'Hasan': 'Hasan', 'Sabri': 'Sabri', 'Ayşe': 'Ayşe', 'Lupe': 'Lupe', 'Rico': 'Rico',
  // ---- in-game messages / overlays
  'WARNING!': 'DİKKAT!', 'SECTION CLEAR!': 'KISIM TEMİZ!', 'K.O.!': 'K.O.!', 'GAME OVER': 'OYUN BİTTİ',
  'CONTINUE?': 'DEVAM?', 'PRESS START (ENTER) — MONEY IS HALVED': 'START (ENTER) — PARA YARILANIR',
  'VICTORY!': 'ZAFER!', 'THE LAST JAR OF NUTELLA IS SAFE.': 'SON NUTELLA KAVANOZU GÜVENDE.',
  'KANKA KOMBAT: NUTELLA NIGHTS': 'KANKA KOMBAT: NUTELLA NIGHTS', 'THANKS FOR PLAYING!': 'OYNADIĞIN İÇİN SAĞ OL!',
  'ALL HEALTH RESTORED': 'TÜM CAN YENİLENDİ', 'ONE WALLET, ALL STREETS — CASH CARRIES OVER': 'TEK CÜZDAN, TÜM SOKAKLAR — PARA TAŞINIR',
  'PRESS START (ENTER) TO CONTINUE': 'DEVAM İÇİN START (ENTER)',
  'UP/DOWN CHOOSE   ENTER BUY   ESC LEAVE': 'YUKARI/AŞAĞI SEÇ   ENTER AL   ESC ÇIK',
  'BOUGHT': 'ALINDI', 'NOT ENOUGH MONEY': 'YETERSİZ PARA', 'BAG FULL!': 'ÇANTA DOLU!', 'NOT SOLD HERE': 'BURADA SATILMIYOR',
  'NOT IN A SHOP': 'DÜKKÂNDA DEĞİLSİN', 'DUPLICATE': 'TEKRAR', 'FULL HP!': 'CAN DOLU!',
  'GRAB: ENTER': 'TUT: GİR', 'GRAB: PICK UP': 'TUT: AL', 'OPEN': 'AÇIK', 'ABIERTO': 'AÇIK', 'AFİYET': 'AFİYET',
  'TAXI!': 'TAKSİ!', 'TRAM!': 'TRAMVAY!', 'BIKE!': 'BİSİKLET!', 'GOLF CART!': 'GOLF ARABASI!', 'LOOK OUT!': 'DİKKAT!',
  'TIRED!': 'YORGUN!',
  'THE NUTELLA IS LOST... FOR NOW.': 'NUTELLA ŞİMDİLİK KAYIP...',
  'CLEARED!': 'TEMİZLENDİ!',
  'Speed & combos. Four-hit chains, crescent kick, lightning dodge.': 'Hız ve kombo. Dört vuruşluk zincirler, hilal tekme, şimşek atılma.',
  'Power & grapples. Launching uppercut, armored haymaker, huge throws.': 'Güç ve tutuşlar. Havaya kaldıran aparkat, zırhlı kroşe, dev fırlatmalar.',
  'Brick wall. Long reach, three-hit chains, the fastest sidestep in the game.': 'Yürüyen duvar. Uzun erim, üç vuruşluk zincirler, oyunun en hızlı yana atılması.',
  'Grapple queen. Locks you in place, then lands a five-slap combo.': 'Tutuş kraliçesi. Seni yerine kilitler, sonra beş tokatlık kombo indirir.',
  'The roster is all four fighters: LEFT and RIGHT (or the tiles either side of the card, or the name rail) cycle it. B.T. is speed, S.C. power, OZZI toughness, AYNUR the five-slap hold.': 'Kadroda dört dövüşçünün hepsi var: SOL ve SAĞ (ya da kartın iki yanındaki kutular, ya da isim şeridi) aralarında geçiş yapar. B.T. hız, S.C. güç, OZZI dayanıklılık, AYNUR beş tokatlık tutuş.',
  'POWER': 'GÜÇ', 'SPEED': 'HIZ', 'GRAPPLE': 'TUTUŞ', 'TOUGHNESS': 'DAYANIKLILIK',
  // ---- fighter select stat tooltips
  'How hard your strikes land, and how much a throw hurts.': 'Vuruşlarının ne kadar sert indiği ve fırlatmanın ne kadar acıttığı.',
  'How fast you walk and run.': 'Ne kadar hızlı yürüyüp koştuğun.',
  'How far your grab reaches, how long you can hold a grabbed enemy, and how many slaps land before the finisher.': 'Tutuşunun ne kadar uzağa eriştiği, tuttuğun düşmanı ne kadar süre tutabildiğin ve bitiriciden önce kaç tokat indiği.',
  'How much health you bring, and how much of every hit you shrug off.': 'Ne kadar canla başladığın ve her vuruşun ne kadarını savuşturduğun.',
  'THROW': 'FIRLAT', 'REACH': 'ERİM', 'HOLD': 'TUTMA', 'SLAPS': 'TOKAT', 'TAKEN': 'ALINAN', 'HP': 'CAN', 'WALK': 'YÜRÜME',
  // ---- in-game HUD / control legend
  'COMBO': 'KOMBO',
  'MOVE': 'HAREKET', 'LIGHT': 'HAFİF', 'HEAVY': 'AĞIR', 'JUMP': 'ZIPLA', 'GRAB': 'TUT',
  'TRAINING': 'ANTRENMAN', 'TRAINING ROOM': 'ANTRENMAN SALONU',
  "DRAGON'S DEN GYM": 'EJDER İNİ SALONU', 'DUMMY': 'KUKLA',
  'GRAB - SLAP - THROW': 'TUT - ŞAMAR - FIRLAT',
  'DUMMY RESETS WHEN KNOCKED DOWN': 'KUKLA YIKILINCA YENİDEN DİKİLİR',
  'Training room: pick a fighter, then TRAINING to practise grab, slap and throw timing on a dummy that sets itself back up after every knockdown.': 'Antrenman salonu: bir dövüşçü seç, sonra ANTRENMAN ile her yıkılışta yeniden dikilen kuklada tutma, şamar ve fırlatma zamanlamasını çalış.',
  'BLOCK': 'BLOK', 'DODGE': 'ATIL', 'RUN': 'KOŞ', 'EAT': 'YE', 'NEXT ITEM': 'SONRAKİ',
  'PAUSE': 'DURAKLAT', 'KEYBOARD': 'KLAVYE', 'PAD': 'KOL', 'D-PAD/STICK': 'YÖN/ÇUBUK',
  'Move left': 'Sola git', 'Move right': 'Sağa git', 'Move up (into the street)': 'Yukarı git (sokağa)', 'Move down (toward you)': 'Aşağı git (sana doğru)',
  'Light attack / combo — and confirm': 'Hafif vuruş / kombo — ve onay', 'Heavy attack / throw — and cancel': 'Ağır vuruş / fırlat — ve geri', 'Jump': 'Zıpla', 'Grab / pick up / enter shop': 'Tut / al / dükkâna gir',
  'Block (hold)': 'Blok (basılı tut)', 'Dodge roll': 'Atılma', 'Run (hold) — or double-tap': 'Koş (basılı tut) — veya çift dokun', 'Eat selected bag item': 'Seçili çantayı ye',
  'Next bag item': 'Sonraki çanta eşyası', 'Pause / start / continue': 'Duraklat / başla / devam',
  'CONTROLLER CONNECTED': 'KOL BAĞLANDI',
};

export function t(s: string): string {
  if (lang !== 'tr') return s;
  return TR[s] ?? TR[s.toUpperCase()] ?? s;
}

export function getLang(): Lang { return lang; }

export function applyLang(next: Lang): void {
  lang = next;
  setFontLocale(next);
  saveSettings({ lang: next });
  document.documentElement.lang = next === 'tr' ? 'tr' : 'en';
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n!); });
  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml!); });
  document.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach((el) => { (el as HTMLInputElement).placeholder = t(el.dataset.i18nPlaceholder!); });
  document.querySelectorAll<HTMLElement>('[data-lang]').forEach((el) => el.classList.toggle('on', el.dataset.lang === lang));
  // translate simple leaf elements whose whole visible text is a known phrase
  document.querySelectorAll<HTMLElement>('.screen h2, .screen h3, .screen p, .screen li, .screen button, .screen span, .screen option, #touch button').forEach((el) => {
    if (el.children.length) return;
    if (el.dataset.i18n || el.dataset.i18nHtml) return;
    const key = (el.textContent ?? '').trim();
    if (key && !el.dataset.en) el.dataset.en = key;
    const en = el.dataset.en ?? key;
    if (lang === 'tr' && TR[en]) el.textContent = TR[en];
    else if (lang === 'en' && en) el.textContent = en;
  });
}

export function initLang(): void { applyLang(lang); }
