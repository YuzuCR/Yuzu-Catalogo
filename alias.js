/* Alias de búsqueda por serie (personajes y sinónimos). Lo usan index.html y admin.html.
   Lo que guardés en Admin → Precios → Búsqueda (tienda.json → busqueda.alias) reemplaza la serie correspondiente. */
window.YUZU_ALIAS = {
  'Dragon Ball Z': 'goku, vegeta, gohan, goten, trunks, piccolo, freezer, frieza, cell, majin buu, broly, krillin, bulma, shenron, saiyan, super saiyajin, dragon ball, dbz',
  'Demon Slayer': 'tanjiro, kamado, nezuko, zenitsu, inosuke, rengoku, giyu, shinobu, muzan, akaza, tengen, mitsuri, muichiro, kimetsu, kimetsu no yaiba',
  'Attack on Titan': 'eren, mikasa, levi, armin, erwin, hange, reiner, annie, zeke, historia, titan, titanes, shingeki, shingeki no kyojin, aot, snk',
  'Pokemon': 'pikachu, charizard, charmander, bulbasaur, squirtle, mewtwo, mew, gengar, eevee, snorlax, lucario, ash, pokemon',
  'Bleach': 'ichigo, rukia, aizen, byakuya, kenpachi, zangetsu, urahara, toshiro, hitsugaya, hollow, bankai',
  'Assassination Classroom': 'koro sensei, korosensei, nagisa, karma',
  'Baki': 'baki hanma, yujiro, hanma, jack hanma',
  'Bakemonogatari': 'araragi, senjougahara, hitagi, shinobu, monogatari',
  'Bluelock': 'isagi, bachira, rin, nagi, reo, chigiri, barou, kunigami, sae, ego, blue lock',
  'Akira': 'kaneda, tetsuo, otomo',
  'Angel Beats': 'yuri, otonashi, kanade, tenshi',
  'Blue Exorcist': 'rin okumura, yukio, ao no exorcist',
  'Akame Ga Kill!': 'akame, tatsumi, esdeath, leone, mine',
  'Black Clover': 'asta, yuno, noelle',
  'Astro Boy': 'atom, tetsuwan atom',
  'Avatar': 'aang, zuko, katara, toph, sokka',
  'Black Lagoon': 'revy, dutch, roberta',
  'Afro Samurai': 'afro',
  'Another': 'mei misaki',
  'Black Butler': 'ciel, sebastian, kuroshitsuji',
  'Berserk': 'guts, griffith, casca'
};

/* Títulos legibles por serie (la subcategoría guardada → cómo se muestra). Admin → Nombres de colecciones los reemplaza. */
window.YUZU_TITULOS = { 'Bluelock': 'Blue Lock', 'Pokemon': 'Pokémon', 'Akame Ga Kill!': 'Akame ga Kill!' };

/* «BLU 016» → «Blue Lock · 016». Lo usan la tienda (en pantalla) y el admin (páginas para compartir). */
window.yuzuNombreLegible = function (p, titulos) {
  var m = String(p.nombre || '').match(/^\s*[A-Za-zÁ-ú]{1,6}\s*[-_ ]?\s*\(?(\d{1,4})\)?\s*$/), serie = p.subcategoria;
  if (!m || !serie) return p.nombre;
  var t = (titulos && titulos[serie]) || window.YUZU_TITULOS[serie] || serie;
  return t + ' · ' + m[1];
};
