// What the search box offers to someone who knows no names (27 Nov 2026: the user and a friend: people type "galaksi",
// "kara delik", "güneş sistemi"; 32 of 40 such Turkish searches found nothing). Topics are ready-made searches, each a
// short list of things to open; things can also be found by any of their names, in any of the six languages, with or
// without Turkish letters, plural or possessive endings, or a slip of one letter.
// Names: each language's own encyclopedia titles (Wikipedia interlanguage links, read on 27 Nov 2026) and the names of
// names.js; kinds: the titles of those languages' articles on that kind of object. Places: SIMBAD (CDS), the same as
// data/sky.json. Every line is a fact the panel and the map can show; none is a claim the data cannot back.

const L6 = (en, tr, de, fr, es, pl) => ({ en, tr, de, fr, es, pl });

/** The words of the search's list itself. */
export const WORDS = {
  ask: L6('What would you like to see?', 'Ne görmek istersiniz?', 'Was möchten Sie sehen?', 'Que voulez-vous voir ?', '¿Qué quieres ver?', 'Co chcesz zobaczyć?'),
  hint: L6('Or type a name: Andromeda, Betelgeuse, Ceres, M31…', 'Ya da bir ad yazın: Andromeda, Betelgeuse, Ceres, M31…', 'Oder geben Sie einen Namen ein: Andromeda, Beteigeuze, Ceres, M31 …',
    'Ou tapez un nom : Andromède, Bételgeuse, Cérès, M31…', 'O escribe un nombre: Andrómeda, Betelgeuse, Ceres, M31…', 'Albo wpisz nazwę: Andromeda, Betelgeza, Ceres, M31…'),
  back: L6('All topics', 'Bütün konular', 'Alle Themen', 'Tous les thèmes', 'Todos los temas', 'Wszystkie tematy'),
  searchFor: L6('Search the archives for “{q}”', 'Arşivlerde ara: “{q}”', 'In den Archiven suchen: „{q}“', 'Chercher « {q} » dans les archives', 'Buscar «{q}» en los archivos', 'Szukaj w archiwach: „{q}”'),
  count: L6('{n} to open', '{n} örnek', '{n} zum Öffnen', '{n} à ouvrir', '{n} para abrir', 'do otwarcia: {n}'),
  label: L6('Suggestions', 'Öneriler', 'Vorschläge', 'Suggestions', 'Sugerencias', 'Podpowiedzi'),
  page: L6('Page', 'Sayfa', 'Seite', 'Page', 'Página', 'Strona'),
};

/** Kinds of object: each language's encyclopedia title for it. */
const KIND = {
  centre: L6('Galactic Centre', 'Galaksi merkezi', 'Galaktisches Zentrum', 'Centre galactique', 'Centro galáctico', 'Centrum Galaktyki'),
  spiral: L6('Spiral galaxy', 'Sarmal galaksi', 'Spiralgalaxie', 'Galaxie spirale', 'Galaxia espiral', 'Galaktyka spiralna'),
  dwarf: L6('Dwarf galaxy', 'Cüce galaksi', 'Zwerggalaxie', 'Galaxie naine', 'Galaxia enana', 'Galaktyka karłowata'),
  elliptical: L6('Elliptical galaxy', 'Eliptik galaksi', 'Elliptische Galaxie', 'Galaxie elliptique', 'Galaxia elíptica', 'Galaktyka eliptyczna'),
  starburst: L6('Starburst galaxy', 'Yıldız patlama galaksisi', 'Starburstgalaxie', 'Galaxie à sursauts de formation d’étoiles', 'Galaxia con brote estelar', 'Galaktyka gwiazdotwórcza'),
  radio: L6('Radio galaxy', 'Radyo galaksisi', 'Radiogalaxie', 'Radiogalaxie', 'Radiogalaxia', 'Radiogalaktyka'),
  smbh: L6('Supermassive black hole', 'Süper kütleli kara delik', 'Supermassereiches Schwarzes Loch', 'Trou noir supermassif', 'Agujero negro supermasivo', 'Supermasywna czarna dziura'),
  binary: L6('Binary star', 'Çift yıldız', 'Doppelstern', 'Étoile binaire', 'Estrella binaria', 'Gwiazda binarna'),
  quasar: L6('Quasar', 'Kuasar', 'Quasar', 'Quasar', 'Cuásar', 'Kwazar'),
  forming: L6('Star formation', 'Yıldız oluşumu', 'Sternentstehung', 'Naissance des étoiles', 'Formación estelar', 'Powstawanie gwiazd'),
  dark: L6('Dark nebula', 'Karanlık bulutsu', 'Dunkelwolke', 'Nébuleuse obscure', 'Nebulosa oscura', 'Ciemna mgławica'),
  snr: L6('Supernova remnant', 'Süpernova kalıntısı', 'Supernovaüberrest', 'Rémanent de supernova', 'Resto de supernova', 'Pozostałość po supernowej'),
  pn: L6('Planetary nebula', 'Gezegenimsi bulutsu', 'Planetarischer Nebel', 'Nébuleuse planétaire', 'Nebulosa planetaria', 'Mgławica planetarna'),
  open: L6('Open cluster', 'Açık yıldız kümesi', 'Offener Sternhaufen', 'Amas ouvert', 'Cúmulo abierto', 'Gromada otwarta'),
  globular: L6('Globular cluster', 'Küresel yıldız kümesi', 'Kugelsternhaufen', 'Amas globulaire', 'Cúmulo globular', 'Gromada kulista'),
  star: L6('Star', 'Yıldız', 'Stern', 'Étoile', 'Estrella', 'Gwiazda'),
  redsg: L6('Red supergiant', 'Kırmızı üstdev', 'Roter Überriese', 'Supergéante rouge', 'Supergigante roja', 'Czerwony nadolbrzym'),
  redgiant: L6('Red giant', 'Kırmızı dev', 'Roter Riese', 'Géante rouge', 'Gigante roja', 'Czerwony olbrzym'),
  variable: L6('Variable star', 'Değişen yıldız', 'Veränderlicher Stern', 'Étoile variable', 'Estrella variable', 'Gwiazda zmienna'),
  browndwarf: L6('Brown dwarf', 'Kahverengi cüce', 'Brauner Zwerg', 'Naine brune', 'Enana marrón', 'Brązowy karzeł'),
  planet: L6('Planet', 'Gezegen', 'Planet', 'Planète', 'Planeta', 'Planeta'),
};

/**
 * The things the topics open. do: { sky: [ra, dec, width of the map in degrees] } a place, { name } a name the archives
 * resolve (stars: their motion comes with it), { target } a showcase object, { body } a body of the solar system
 * (where and when SPHEREx had it in view), { sheet } a page of the site, { href } another page.
 * name: per language (one string: the same everywhere); words: more names to find it by (any language, any case).
 */
export const ITEMS = {
  gc: { do: { sky: [266.4168, -29.0078, 6] }, kind: 'centre', name: L6('Centre of the Milky Way', 'Samanyolu’nun merkezi', 'Zentrum der Milchstraße', 'Centre de la Voie lactée', 'Centro de la Vía Láctea', 'Centrum Drogi Mlecznej'),
    words: ['samanyolu', 'milky way', 'galactic center', 'galactic centre', 'galaksi merkezi', 'galaksimiz', 'milchstraße', 'voie lactée', 'vía láctea', 'droga mleczna', 'galaktisches zentrum', 'centre galactique', 'centro galáctico', 'centrum galaktyki'] },
  sgra: { do: { sky: [266.4168, -29.0078, 0.8] }, kind: 'smbh', name: L6('Sagittarius A*', 'Sagittarius A*', 'Sagittarius A*', 'Sagittarius A*', 'Sagitario A*', 'Sagittarius A*'), words: ['sgr a', 'sgra', 'sagittarius a'] },
  m31: { do: { sky: [10.6847, 41.2688, 4] }, kind: 'spiral', name: L6('Andromeda Galaxy', 'Andromeda Galaksisi', 'Andromedagalaxie', 'Galaxie d’Andromède', 'Galaxia de Andrómeda', 'Galaktyka Andromedy'), words: ['m31', 'ngc 224', 'andromeda', 'andromède', 'andrómeda'] },
  m33: { do: { sky: [23.4621, 30.6602, 1.6] }, kind: 'spiral', name: L6('Triangulum Galaxy', 'Üçgen Galaksisi', 'Dreiecksgalaxie', 'Galaxie du Triangle', 'Galaxia del Triángulo', 'Galaktyka Trójkąta'), words: ['m33', 'ngc 598', 'triangulum'] },
  lmc: { do: { sky: [80.8942, -69.7561, 12] }, kind: 'dwarf', name: L6('Large Magellanic Cloud', 'Büyük Macellan Bulutu', 'Große Magellansche Wolke', 'Grand Nuage de Magellan', 'Gran Nube de Magallanes', 'Wielki Obłok Magellana'), words: ['lmc', 'macellan', 'magellan', 'magallanes'] },
  smc: { do: { sky: [13.1583, -72.8003, 6] }, kind: 'dwarf', name: L6('Small Magellanic Cloud', 'Küçük Macellan Bulutu', 'Kleine Magellansche Wolke', 'Petit Nuage de Magellan', 'Pequeña Nube de Magallanes', 'Mały Obłok Magellana'), words: ['smc', 'macellan', 'magellan', 'magallanes'] },
  m51: { do: { sky: [202.4696, 47.1953, 0.6] }, kind: 'spiral', name: L6('Whirlpool Galaxy', 'Girdap Galaksisi', 'Whirlpool-Galaxie', 'Galaxie du Tourbillon', 'Galaxia del Remolino', 'Galaktyka Wir'), words: ['m51', 'ngc 5194', 'whirlpool'] },
  m81: { do: { sky: [148.8882, 69.0653, 1.2] }, kind: 'spiral', name: L6('Bode’s Galaxy (M81)', 'M81 (Bode Galaksisi)', 'Messier 81', 'M81 (galaxie de Bode)', 'Galaxia de Bode', 'Galaktyka Bodego'), words: ['m81', 'ngc 3031', 'bode'] },
  m82: { do: { sky: [148.9685, 69.6797, 0.5] }, kind: 'starburst', name: L6('Cigar Galaxy (M82)', 'M82 (Puro Galaksisi)', 'Messier 82', 'M82 (galaxie du Cigare)', 'Galaxia del Cigarro', 'Galaktyka Cygaro'), words: ['m82', 'ngc 3034', 'cigar', 'puro', 'zigarre', 'cigare', 'cigarro', 'cygaro'] },
  m104: { do: { sky: [189.9976, -11.6231, 0.5] }, kind: 'spiral', name: L6('Sombrero Galaxy', 'Sombrero Galaksisi', 'Sombrerogalaxie', 'Galaxie du Sombrero', 'Galaxia del Sombrero', 'Galaktyka Sombrero'), words: ['m104', 'ngc 4594', 'sombrero'] },
  m83: { do: { sky: [204.2538, -29.8658, 0.6] }, kind: 'spiral', name: L6('Southern Pinwheel Galaxy (M83)', 'Messier 83', 'Messier 83', 'M83 (galaxie)', 'Molinillo Austral', 'Galaktyka Południowy Wiatraczek'), words: ['m83', 'ngc 5236', 'pinwheel'] },
  cena: { do: { sky: [201.3651, -43.0191, 0.8] }, kind: 'radio', name: L6('Centaurus A', 'Erboğa A', 'Centaurus A', 'Centaurus A', 'Centaurus A', 'NGC 5128'), words: ['centaurus a', 'cen a', 'ngc 5128', 'erboga a'] },
  m87: { do: { sky: [187.7059, 12.3911, 0.5] }, kind: 'elliptical', name: L6('Messier 87', 'Messier 87', 'Messier 87', 'M87 (galaxie)', 'Galaxia elíptica M87', 'Galaktyka Panna A'), words: ['m87', 'ngc 4486', 'virgo a', 'panna a'],
    note: L6('Its black hole was the first ever imaged (2019)', 'Kara deliği, görüntüsü çekilen ilk kara delik (2019)', 'Sein Schwarzes Loch wurde als erstes abgebildet (2019)', 'Son trou noir est le premier jamais photographié (2019)', 'Su agujero negro fue el primero fotografiado (2019)', 'Jej czarna dziura jako pierwsza została sfotografowana (2019)') },
  cygx1: { do: { sky: [299.5903, 35.2016, 0.3] }, kind: 'binary', name: L6('Cygnus X-1', 'Cygnus X-1', 'Cygnus X-1', 'Cygnus X-1', 'Cygnus X-1', 'Cygnus X-1'), words: ['cyg x-1', 'hde 226868', 'kugu x-1'],
    note: L6('A black hole and a star that circle each other', 'Bir yıldızla birbirinin çevresinde dönen kara delik', 'Ein Schwarzes Loch und ein Stern, die einander umkreisen', 'Un trou noir et une étoile qui tournent l’un autour de l’autre', 'Un agujero negro y una estrella que giran uno alrededor del otro', 'Czarna dziura i gwiazda krążące wokół siebie') },
  q3c273: { do: { sky: [187.2779, 2.0524, 0.3] }, kind: 'quasar', name: L6('3C 273', '3C 273', '3C 273', '3C 273', '3C 273', '3C 273'), words: ['3c273'],
    note: L6('The first quasar to be recognised (1963)', 'Tanınan ilk kuasar (1963)', 'Der erste erkannte Quasar (1963)', 'Le premier quasar identifié (1963)', 'El primer cuásar identificado (1963)', 'Pierwszy rozpoznany kwazar (1963)') },
  m42: { do: { sky: [83.8201, -5.3876, 1.6] }, kind: 'forming', name: L6('Orion Nebula', 'Orion Bulutsusu', 'Orionnebel', 'Nébuleuse d’Orion', 'Nebulosa de Orión', 'Wielka Mgławica w Orionie'), words: ['m42', 'ngc 1976', 'orion'] },
  horsehead: { do: { sky: [85.2458, -2.4583, 1] }, kind: 'dark', name: L6('Horsehead Nebula', 'Atbaşı Bulutsusu', 'Pferdekopfnebel', 'Nébuleuse de la Tête de Cheval', 'Nebulosa Cabeza de Caballo', 'Mgławica Koński Łeb'), words: ['b33', 'barnard 33', 'at başı', 'at başı bulutsusu', 'atbaşı', 'horsehead', 'pferdekopf', 'tête de cheval', 'cabeza de caballo', 'koński łeb'] },
  m16: { do: { sky: [274.688, -13.792, 0.8] }, kind: 'forming', name: L6('Eagle Nebula', 'Kartal Bulutsusu', 'Adlernebel', 'Nébuleuse de l’Aigle', 'Nebulosa del Águila', 'Mgławica Orzeł'), words: ['m16', 'ngc 6611', 'eagle', 'pillars of creation', 'yaratılış sütunları', 'säulen der schöpfung', 'piliers de la création', 'pilares de la creación', 'filary stworzenia'],
    note: L6('Home of the Pillars of Creation', 'Yaratılış Sütunları’nın bulunduğu bulutsu', 'Hier stehen die Säulen der Schöpfung', 'Là se dressent les Piliers de la création', 'Allí están los Pilares de la Creación', 'Tu stoją Filary Stworzenia') },
  m8: { do: { sky: [270.9042, -24.3867, 1.4] }, kind: 'forming', name: L6('Lagoon Nebula', 'Lagün Bulutsusu', 'Lagunennebel', 'Nébuleuse de la Lagune', 'Nebulosa de la Laguna', 'Mgławica Laguna'), words: ['m8', 'ngc 6523', 'lagoon'] },
  m17: { do: { sky: [275.1958, -16.1717, 1] }, kind: 'forming', name: L6('Omega Nebula', 'Omega Bulutsusu', 'Omeganebel', 'Nébuleuse Oméga', 'Nebulosa Omega', 'Mgławica Omega'), words: ['m17', 'ngc 6618', 'omega nebula', 'swan nebula'] },
  m20: { do: { sky: [270.675, -22.9717, 0.8] }, kind: 'forming', name: L6('Trifid Nebula', 'Trifid Bulutsusu', 'Trifidnebel', 'Nébuleuse Trifide', 'Nebulosa Trífida', 'Mgławica Trójlistna Koniczyna'), words: ['m20', 'ngc 6514', 'trifid'] },
  carina: { do: { sky: [161.2593, -59.6999, 3] }, kind: 'forming', name: L6('Carina Nebula', 'Karina Bulutsusu', 'Carinanebel', 'Nébuleuse de la Carène', 'Nebulosa de Carina', 'Mgławica Carina'), words: ['ngc 3372', 'carina', 'karina'] },
  rosette: { do: { sky: [97.6504, 4.9807, 2.6] }, kind: 'forming', name: L6('Rosette Nebula', 'Rozet Bulutsusu', 'Rosettennebel', 'Nébuleuse de la Rosette', 'Nebulosa Roseta', 'Mgławica Rozeta'), words: ['ngc 2237', 'rosette', 'rozet'] },
  northam: { do: { sky: [314.6958, 44.33, 3] }, kind: 'forming', name: L6('North America Nebula', 'Kuzey Amerika Bulutsusu', 'Nordamerikanebel', 'Nébuleuse de l’Amérique du Nord', 'Nebulosa Norteamérica', 'Mgławica Ameryka Północna'), words: ['ngc 7000', 'north america'] },
  tarantula: { do: { sky: [84.675, -69.1, 1.2] }, kind: 'forming', name: L6('Tarantula Nebula', 'Tarantula Bulutsusu', 'Tarantelnebel', 'Nébuleuse de la Tarentule', 'Nebulosa de la Tarántula', 'Mgławica Tarantula'), words: ['ngc 2070', '30 doradus', 'tarantula'] },
  rhooph: { do: { sky: [246.3963, -23.4472, 4] }, kind: 'forming', name: L6('Rho Ophiuchi cloud complex', 'Rho Ophiuchi bulut kompleksi', 'Rho-Ophiuchi-Wolke', 'Nuage de Rho Ophiuchi', 'Nube de Rho Ophiuchi', 'Mgławica Rho Ophiuchi'), words: ['rho oph', 'rho ophiuchi'] },
  crab: { do: { sky: [83.6324, 22.0174, 0.4] }, kind: 'snr', name: L6('Crab Nebula', 'Yengeç Bulutsusu', 'Krebsnebel', 'Nébuleuse du Crabe', 'Nebulosa del Cangrejo', 'Mgławica Kraba'), words: ['m1', 'ngc 1952', 'crab', 'yengec', 'pulsar', 'crab pulsar'],
    note: L6('What is left of a star seen to explode in 1054', '1054’te patladığı görülen bir yıldızdan kalan', 'Der Rest eines Sterns, dessen Explosion 1054 gesehen wurde', 'Ce qui reste d’une étoile vue exploser en 1054', 'Lo que queda de una estrella que se vio estallar en 1054', 'Pozostałość gwiazdy, której wybuch widziano w 1054 roku') },
  casa: { do: { sky: [350.8584, 58.8113, 0.3] }, kind: 'snr', name: L6('Cassiopeia A', 'Cassiopeia A', 'Cassiopeia A', 'Cassiopée A', 'Cassiopeia A', 'Cassiopeia A'), words: ['cas a', 'kassiopeia a'] },
  veil: { do: { sky: [312.75, 30.6667, 4] }, kind: 'snr', name: L6('Cygnus Loop (Veil Nebula)', 'Kuğu İlmeği (Peçe Bulutsusu)', 'Cygnusbogen', 'Dentelles du Cygne', 'Bucle de Cygnus', 'Pętla Łabędzia'), words: ['veil', 'cygnus loop', 'peçe', 'kuğu ilmeği', 'cirrusnebel'] },
  m57: { do: { sky: [283.3962, 33.0291, 0.15] }, kind: 'pn', name: L6('Ring Nebula', 'Halka Bulutsusu', 'Ringnebel', 'Nébuleuse de l’Anneau', 'Nebulosa del Anillo', 'Mgławica Pierścień'), words: ['m57', 'ngc 6720', 'ring nebula'] },
  m27: { do: { sky: [299.9015, 22.7212, 0.3] }, kind: 'pn', name: L6('Dumbbell Nebula', 'Dambıl Bulutsusu', 'Hantelnebel', 'Nébuleuse de l’Haltère', 'Nebulosa Dumbbell', 'Mgławica Hantle'), words: ['m27', 'ngc 6853', 'dumbbell'] },
  helix: { do: { sky: [337.4106, -20.8372, 0.6] }, kind: 'pn', name: L6('Helix Nebula', 'Helix Bulutsusu', 'Helixnebel', 'Nébuleuse de l’Hélice', 'Nebulosa de la Hélice', 'Mgławica Ślimak'), words: ['ngc 7293', 'helix'] },
  ngc7027: { do: { sky: [316.7565, 42.2362, 0.1] }, kind: 'pn', name: L6('NGC 7027', 'NGC 7027', 'NGC 7027', 'NGC 7027', 'NGC 7027', 'NGC 7027'), words: ['ngc7027'] },
  m45: { do: { sky: [56.6008, 24.1139, 2.4] }, kind: 'open', name: L6('Pleiades', 'Ülker', 'Plejaden', 'Pléiades', 'Pléyades', 'Plejady'), words: ['m45', 'pleiades', 'yedi kardeşler', 'seven sisters', 'siebengestirn'] },
  m44: { do: { sky: [130.0542, 19.6211, 2] }, kind: 'open', name: L6('Beehive Cluster', 'Arı Kovanı Kümesi', 'Krippe', 'Amas de la Crèche', 'Cúmulo del Pesebre', 'Żłóbek'), words: ['m44', 'praesepe', 'beehive'] },
  double: { do: { sky: [34.7408, 57.1339, 1.6] }, kind: 'open', name: L6('Double Cluster', 'Çift Küme', 'h und χ Persei', 'Double amas de Persée', 'Doble Cúmulo de Perseo', 'Podwójna Gromada Perseusza'), words: ['ngc 869', 'ngc 884', 'double cluster', 'h persei'] },
  m13: { do: { sky: [250.4235, 36.4613, 0.5] }, kind: 'globular', name: L6('Hercules Cluster (M13)', 'Messier 13 (Herkül Kümesi)', 'Messier 13', 'Amas d’Hercule', 'Cúmulo de Hércules', 'Gromada Herkulesa'), words: ['m13', 'ngc 6205', 'hercules', 'herkül'] },
  omegacen: { do: { sky: [201.697, -47.4795, 1] }, kind: 'globular', name: L6('Omega Centauri', 'Omega Centauri', 'Omega Centauri', 'Omega Centauri', 'Omega Centauri', 'Omega Centauri'), words: ['ngc 5139', 'omega cen'] },
  tuc47: { do: { sky: [6.0223, -72.0814, 0.8] }, kind: 'globular', name: L6('47 Tucanae', '47 Tucanae', '47 Tucanae', '47 Tucanae', '47 Tucanae', 'NGC 104'), words: ['ngc 104', '47 tuc'] },
  sirius: { do: { name: 'Sirius' }, kind: 'star', name: L6('Sirius', 'Sirius', 'Sirius', 'Sirius', 'Sirio', 'Syriusz'), words: ['akyıldız', 'alpha canis majoris'],
    note: L6('The brightest star of the night sky', 'Gece gökyüzünün en parlak yıldızı', 'Der hellste Stern am Nachthimmel', 'L’étoile la plus brillante du ciel nocturne', 'La estrella más brillante del cielo nocturno', 'Najjaśniejsza gwiazda nocnego nieba') },
  proxima: { do: { name: 'Proxima Centauri' }, kind: 'star', name: L6('Proxima Centauri', 'Proxima Centauri', 'Proxima Centauri', 'Proxima Centauri', 'Próxima Centauri', 'Proxima Centauri'), words: ['proxima', 'nearest star', 'en yakın yıldız'],
    note: L6('The nearest star to the Sun', 'Güneş’e en yakın yıldız', 'Der sonnennächste Stern', 'L’étoile la plus proche du Soleil', 'La estrella más cercana al Sol', 'Najbliższa Słońcu gwiazda') },
  betelgeuse: { do: { name: 'Betelgeuse' }, kind: 'redsg', name: L6('Betelgeuse', 'Betelgeuse', 'Beteigeuze', 'Bételgeuse', 'Betelgeuse', 'Betelgeza'), words: ['alpha orionis'] },
  polaris: { do: { name: 'Polaris' }, kind: 'star', name: L6('Polaris', 'Kutup Yıldızı', 'Polarstern', 'Étoile polaire', 'Polaris', 'Gwiazda Polarna'), words: ['polaris', 'north star', 'kutup yıldızı', 'demirkazık', 'alpha ursae minoris'],
    note: L6('The star that shows north', 'Kuzeyi gösteren yıldız', 'Der Stern, der den Norden zeigt', 'L’étoile qui indique le nord', 'La estrella que señala el norte', 'Gwiazda wskazująca północ') },
  vega: { do: { name: 'Vega' }, kind: 'star', name: L6('Vega', 'Vega', 'Wega', 'Véga', 'Vega', 'Wega'), words: ['alpha lyrae'] },
  rigel: { do: { name: 'Rigel' }, kind: 'star', name: L6('Rigel', 'Rigel', 'Rigel', 'Rigel', 'Rigel', 'Rigel'), words: ['beta orionis'] },
  antares: { do: { name: 'Antares' }, kind: 'redsg', name: L6('Antares', 'Antares', 'Antares', 'Antarès', 'Antares', 'Antares'), words: ['alpha scorpii'] },
  mira: { do: { name: 'Mira' }, kind: 'variable', name: L6('Mira', 'Mira Ceti', 'Mira', 'Mira', 'Mira', 'Mira Ceti'), words: ['omicron ceti', 'mira ceti'] },
  algol: { do: { name: 'Algol' }, kind: 'variable', name: L6('Algol', 'Algol', 'Algol', 'Algol', 'Algol', 'Algol'), words: ['beta persei'] },
  etacar: { do: { name: 'eta Car' }, kind: 'variable', name: L6('Eta Carinae', 'Eta Carinae', 'Eta Carinae', 'Eta Carinae', 'Eta Carinae', 'Eta Carinae'), words: ['eta car'] },
  luhman16: { do: { name: 'Luhman 16' }, kind: 'browndwarf', name: L6('Luhman 16', 'Luhman 16', 'Luhman 16', 'Luhman 16', 'Luhman 16', 'Luhman 16'), words: ['wise 1049'] },
  barnard: { do: { target: 'barnard' } }, epsindib: { do: { target: 'epsindib' } }, wise0855: { do: { target: 'wise0855' } },
  rwaur: { do: { target: 'rwaur' } }, rdra: { do: { target: 'rdra' } }, pluto: { do: { target: 'pluto' }, words: ['plüton', 'pluton', 'plutón'] },
  atlas: { do: { target: '3i-atlas' }, words: ['3i atlas', 'atlas', 'c/2025 n1'] },
  jupiter: { do: { body: 'Jupiter' }, kind: 'planet', name: L6('Jupiter', 'Jüpiter', 'Jupiter', 'Jupiter', 'Júpiter', 'Jowisz'), words: [] },
  saturn: { do: { body: 'Saturn' }, kind: 'planet', name: L6('Saturn', 'Satürn', 'Saturn', 'Saturne', 'Saturno', 'Saturn'), words: [] },
  hunt: { do: { sheet: 'hunt' }, kind: 'page', words: ['asteroid', 'asteroit', 'asteroids', 'asteroitler', 'göktaşı', 'planetoida', 'astéroïde', 'asteroide', 'asteroiden'] },
  planetx: { do: { sheet: 'planetx' }, kind: 'page', words: ['planet x', 'x gezegeni', 'planet nine', 'dokuzuncu gezegen', 'planète x', 'planeta x', 'planeta dziewiąta'] },
  game: { do: { href: 'play.html' }, kind: 'page', name: L6('Game: find the dot that moved', 'Oyun: hareket eden noktayı bul', 'Spiel: Finde den Punkt, der sich bewegt hat', 'Jeu : trouvez le point qui a bougé', 'Juego: encuentra el punto que se movió', 'Gra: znajdź punkt, który się przesunął'), words: ['oyun', 'game', 'spiel', 'jeu', 'juego', 'gra'] },
};

/** Ready-made searches: what a person types who knows no name. say: what SPHEREx shows of them, in one sentence. */
export const TOPICS = [
  { id: 'galaxies', name: L6('Galaxies', 'Galaksiler', 'Galaxien', 'Galaxies', 'Galaxias', 'Galaktyki'),
    words: ['galaxy', 'galaxies', 'galaksi', 'gökada', 'galaxie', 'galaxien', 'galaxia', 'galaxias', 'galaktyka', 'galaktyki'],
    say: L6('Our own galaxy’s centre and our neighbours; in infrared the dust that hides stars from the eye glows.', 'Kendi galaksimizin merkezi ve komşularımız; kızılötesinde, yıldızları gözden saklayan toz ışıldar.',
      'Das Zentrum unserer eigenen Galaxie und unsere Nachbarn; im Infraroten leuchtet der Staub, der dem Auge Sterne verbirgt.', 'Le centre de notre propre galaxie et nos voisines ; en infrarouge, la poussière qui cache les étoiles à l’œil brille.',
      'El centro de nuestra propia galaxia y nuestras vecinas; en infrarrojo brilla el polvo que oculta las estrellas al ojo.', 'Środek naszej własnej galaktyki i nasze sąsiadki; w podczerwieni świeci pył, który zasłania gwiazdy przed okiem.'),
    items: ['gc', 'm31', 'm33', 'lmc', 'smc', 'm51', 'm81', 'm82', 'm104', 'm83', 'cena', 'm87'] },
  { id: 'blackholes', name: L6('Black holes', 'Kara delikler', 'Schwarze Löcher', 'Trous noirs', 'Agujeros negros', 'Czarne dziury'),
    words: ['black hole', 'black holes', 'kara delik', 'karadelik', 'schwarzes loch', 'schwarze löcher', 'trou noir', 'trous noirs', 'agujero negro', 'agujeros negros', 'czarna dziura', 'czarne dziury'],
    say: L6('A black hole gives no light of its own: what SPHEREx sees is what is around it, the stars, the dust, the hot gas.', 'Kara deliğin kendisi ışık vermez: SPHEREx onun çevresindekini görür; yıldızları, tozu, ısınan gazı.',
      'Ein Schwarzes Loch leuchtet nicht selbst: SPHEREx sieht, was es umgibt, die Sterne, den Staub, das heiße Gas.', 'Un trou noir n’émet pas de lumière : SPHEREx voit ce qui l’entoure, les étoiles, la poussière, le gaz chaud.',
      'Un agujero negro no da luz propia: SPHEREx ve lo que lo rodea, las estrellas, el polvo, el gas caliente.', 'Czarna dziura nie świeci sama: SPHEREx widzi to, co ją otacza, gwiazdy, pył, gorący gaz.'),
    items: ['sgra', 'm87', 'cygx1', 'q3c273', 'cena'] },
  { id: 'solar', name: L6('Solar System', 'Güneş Sistemi', 'Sonnensystem', 'Système solaire', 'Sistema solar', 'Układ Słoneczny'),
    words: ['solar system', 'güneş sistemi', 'gunes sistemi', 'sonnensystem', 'système solaire', 'sistema solar', 'układ słoneczny', 'planet', 'planets', 'gezegen', 'gezegenler', 'planeten', 'planète', 'planètes', 'planeta', 'planetas', 'planety',
      'comet', 'comets', 'kuyruklu yıldız', 'kuyrukluyıldız', 'komet', 'comète', 'cometa', 'kometa', 'dwarf planet', 'cüce gezegen'],
    say: L6('Planets, comets and asteroids move across the sky: each opens where and when SPHEREx had it in view.', 'Gezegenler, kuyruklu yıldızlar ve asteroitler gökte yer değiştirir: her biri, SPHEREx’in onu gördüğü yerde ve günde açılır.',
      'Planeten, Kometen und Asteroiden wandern über den Himmel: Jeder öffnet sich dort und dann, wo SPHEREx ihn im Blick hatte.', 'Planètes, comètes et astéroïdes se déplacent dans le ciel : chacun s’ouvre là et au moment où SPHEREx l’a vu.',
      'Planetas, cometas y asteroides se mueven por el cielo: cada uno se abre donde y cuando SPHEREx lo tuvo a la vista.', 'Planety, komety i planetoidy wędrują po niebie: każda otwiera się tam i wtedy, gdzie SPHEREx ją widział.'),
    items: ['pluto', 'atlas', 'jupiter', 'saturn', 'hunt', 'planetx'] },
  { id: 'nebulae', name: L6('Nebulae', 'Bulutsular', 'Nebel', 'Nébuleuses', 'Nebulosas', 'Mgławice'),
    words: ['nebula', 'nebulae', 'bulutsu', 'nebula', 'nebel', 'nébuleuse', 'nebulosa', 'mgławica', 'mgławice', 'star formation', 'yıldız oluşumu', 'yıldız doğumu'],
    say: L6('Clouds of gas and dust where stars are born; infrared sees into the dust that blocks visible light.', 'Yıldızların doğduğu gaz ve toz bulutları; kızılötesi, görünür ışığı kesen tozun içini görür.',
      'Wolken aus Gas und Staub, in denen Sterne entstehen; das Infrarot blickt in den Staub, der sichtbares Licht verschluckt.', 'Des nuages de gaz et de poussière où naissent les étoiles ; l’infrarouge voit à travers la poussière qui arrête la lumière visible.',
      'Nubes de gas y polvo donde nacen estrellas; el infrarrojo ve dentro del polvo que bloquea la luz visible.', 'Obłoki gazu i pyłu, w których rodzą się gwiazdy; podczerwień zagląda w pył, który zatrzymuje światło widzialne.'),
    items: ['m42', 'horsehead', 'm16', 'm8', 'm17', 'm20', 'carina', 'rosette', 'northam', 'tarantula', 'rhooph'] },
  { id: 'dying', name: L6('Dying stars', 'Ölen yıldızlar', 'Sterbende Sterne', 'Étoiles mourantes', 'Estrellas moribundas', 'Umierające gwiazdy'),
    words: ['supernova', 'süpernova', 'supernowa', 'supernova remnant', 'süpernova kalıntısı', 'planetary nebula', 'gezegenimsi bulutsu', 'dying star', 'ölen yıldız', 'ölü yıldız', 'white dwarf', 'beyaz cüce'],
    say: L6('What stars leave when they die: the clouds of exploded stars, and the shells that quieter ones blow off.', 'Yıldızların ölürken geride bıraktıkları: patlayan yıldızların bulutları ve daha sakin ölenlerin savurduğu kabuklar.',
      'Was Sterne hinterlassen, wenn sie sterben: die Wolken explodierter Sterne und die Hüllen, die ruhigere abstoßen.', 'Ce que les étoiles laissent en mourant : les nuages des étoiles qui ont explosé, et les enveloppes que les plus calmes rejettent.',
      'Lo que dejan las estrellas al morir: las nubes de las que estallaron y las capas que expulsan las más tranquilas.', 'To, co zostawiają umierające gwiazdy: obłoki po wybuchach i otoczki odrzucane przez spokojniejsze.'),
    items: ['crab', 'casa', 'veil', 'm57', 'm27', 'helix', 'ngc7027'] },
  { id: 'clusters', name: L6('Star clusters', 'Yıldız kümeleri', 'Sternhaufen', 'Amas d’étoiles', 'Cúmulos estelares', 'Gromady gwiazd'),
    words: ['star cluster', 'cluster', 'yıldız kümesi', 'küme', 'sternhaufen', 'amas', 'cúmulo', 'gromada'],
    say: L6('Stars born together: young open clusters, and globular clusters as old as the galaxy.', 'Birlikte doğmuş yıldızlar: genç açık kümeler ve galaksi kadar yaşlı küresel kümeler.',
      'Gemeinsam geborene Sterne: junge offene Haufen und Kugelsternhaufen, so alt wie die Galaxie.', 'Des étoiles nées ensemble : de jeunes amas ouverts et des amas globulaires aussi vieux que la galaxie.',
      'Estrellas nacidas juntas: jóvenes cúmulos abiertos y cúmulos globulares tan viejos como la galaxia.', 'Gwiazdy urodzone razem: młode gromady otwarte i gromady kuliste stare jak galaktyka.'),
    items: ['m45', 'm44', 'double', 'm13', 'omegacen', 'tuc47'] },
  { id: 'stars', name: L6('Famous stars', 'Ünlü yıldızlar', 'Bekannte Sterne', 'Étoiles célèbres', 'Estrellas famosas', 'Znane gwiazdy'),
    words: ['star', 'stars', 'yıldız', 'yıldızlar', 'stern', 'sterne', 'étoile', 'étoiles', 'estrella', 'estrellas', 'gwiazda', 'gwiazdy', 'nearest star', 'en yakın yıldız', 'brightest star', 'en parlak yıldız'],
    say: L6('The brightest, the nearest, the fastest: each opens with its pictures and how it moves.', 'En parlağı, en yakını, en hızlısı: her biri görüntüleri ve hareketiyle açılır.',
      'Der hellste, der nächste, der schnellste: Jeder öffnet sich mit seinen Bildern und seiner Bewegung.', 'La plus brillante, la plus proche, la plus rapide : chacune s’ouvre avec ses images et son mouvement.',
      'La más brillante, la más cercana, la más rápida: cada una se abre con sus imágenes y su movimiento.', 'Najjaśniejsza, najbliższa, najszybsza: każda otwiera się ze zdjęciami i swoim ruchem.'),
    items: ['sirius', 'proxima', 'barnard', 'betelgeuse', 'polaris', 'vega', 'rigel', 'antares'] },
  { id: 'browndwarfs', name: L6('Brown dwarfs', 'Kahverengi cüceler', 'Braune Zwerge', 'Naines brunes', 'Enanas marrones', 'Brązowe karły'),
    words: ['brown dwarf', 'brown dwarfs', 'kahverengi cüce', 'kahverengi cüceler', 'brauner zwerg', 'braune zwerge', 'naine brune', 'naines brunes', 'enana marrón', 'enanas marrones', 'brązowy karzeł', 'brązowe karły'],
    say: L6('Too small to be stars, too big to be planets: cold bodies seen best in infrared, SPHEREx’s own light.', 'Yıldız olamayacak kadar küçük, gezegen olamayacak kadar büyük soğuk cisimler: en iyi kızılötesinde, SPHEREx’in ışığında görünürler.',
      'Zu klein für Sterne, zu groß für Planeten: kalte Körper, am besten im Infraroten zu sehen, dem Licht von SPHEREx.', 'Trop petites pour être des étoiles, trop grandes pour être des planètes : des corps froids, mieux vus en infrarouge, la lumière de SPHEREx.',
      'Demasiado pequeñas para ser estrellas, demasiado grandes para ser planetas: cuerpos fríos que se ven mejor en infrarrojo, la luz de SPHEREx.', 'Za małe na gwiazdy, za duże na planety: zimne ciała, najlepiej widoczne w podczerwieni, świetle SPHEREx.'),
    items: ['wise0855', 'epsindib', 'luhman16', 'game'] },
  { id: 'variables', name: L6('Variable stars', 'Değişen yıldızlar', 'Veränderliche Sterne', 'Étoiles variables', 'Estrellas variables', 'Gwiazdy zmienne'),
    words: ['variable star', 'variable stars', 'değişen yıldız', 'değişen yıldızlar', 'veränderlicher stern', 'étoile variable', 'estrella variable', 'gwiazda zmienna'],
    say: L6('Stars whose light rises and falls: SPHEREx saw them again and again, so the change shows in its pictures.', 'Işığı artıp azalan yıldızlar: SPHEREx onları tekrar tekrar gördü, değişim görüntülerinde izlenir.',
      'Sterne, deren Licht steigt und fällt: SPHEREx sah sie immer wieder, die Änderung zeigt sich in den Bildern.', 'Des étoiles dont la lumière monte et descend : SPHEREx les a vues encore et encore, le changement se voit dans ses images.',
      'Estrellas cuya luz sube y baja: SPHEREx las vio una y otra vez, el cambio se ve en sus imágenes.', 'Gwiazdy, których blask rośnie i maleje: SPHEREx widział je raz po raz, zmiana widać na zdjęciach.'),
    items: ['rdra', 'rwaur', 'mira', 'algol', 'betelgeuse', 'etacar'] },
];

// ------------------------------------------------------------------------------------------------ finding them
/** One way of writing every word: small letters, no accents, Turkish ı as i, punctuation as spaces. */
export const fold = s => String(s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/ß/g, 'ss').replace(/ł/g, 'l')
  .replace(/[^a-z0-9*]+/g, ' ').trim();
/** A Turkish word without its plural and possessive endings ("galaksiler", "bulutsusu", "yildizlari" → their stems). */
function stems(w) {
  const out = [w]; let x = w;
  for (const re of [/(lerinin|larinin|lerini|larini|lerin|larin|leri|lari|ler|lar)$/, /(sinin|sunun|nin|nun|si|su)$/, /(i|u)$/]) {
    const y = x.replace(re, ''); if (y !== x && y.length >= 3) { out.push(y); x = y; }
  }
  return out;
}
/** How many edits turn a into b (insert, delete, change, swap two neighbours); stops counting past `max`. */
function edits(a, b, max = 2) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let best = max + 1;
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      best = Math.min(best, d[i][j]);
    }
    if (best > max) return max + 1;
  }
  return d[a.length][b.length];
}
/** How well a query (folded) fits one name (folded): 0 not at all … 100 the very name. */
function fit(q, name) {
  if (!q || !name) return 0;
  if (name === q) return 100;
  if (name.startsWith(q)) return q.length >= 2 ? 85 - Math.min(20, name.length - q.length) : 0;
  const words = name.split(' '), qw = q.split(' ');
  // every word of the query, or one of its stems, starts a word of the name
  const each = qw.map(w => { let s = 0; for (const v of stems(w)) for (const n of words) { if (n === v) s = Math.max(s, 3); else if (n.startsWith(v) && v.length >= 2) s = Math.max(s, 2); else if (v.length >= (qw.length > 1 ? 4 : 5) && edits(v, n, v.length >= 8 ? 2 : 1) <= (v.length >= 8 ? 2 : 1)) s = Math.max(s, 1); } return s; });
  if (each.every(s => s > 0)) return 55 + 5 * Math.min(...each) + (qw.length > 1 ? 5 : 0);
  // a slip of a letter in a name written as one word ("andromda", "betelguese")
  if (q.length >= 5 && !q.includes(' ') && edits(q, name.replace(/ /g, ''), q.length >= 8 ? 2 : 1) <= (q.length >= 8 ? 2 : 1)) return 50;
  return 0;
}
const best = (q, names) => Math.max(0, ...names.map(n => fit(q, fold(n))));

/** Topics and things for a query, best first: [{ kind: 'topic'|'item', id, score }]. An empty query gives nothing. */
export function find(text, lang, extraNames = {}) {
  const q = fold(text); if (!q) return [];
  const out = [];
  for (const t of TOPICS) {
    const s = best(q, [...Object.values(t.name), ...t.words]);
    if (s >= 50) out.push({ kind: 'topic', id: t.id, score: s + 2 });          // a topic and a thing fitting as well: the topic first
  }
  for (const [id, it] of Object.entries(ITEMS)) {
    const s = best(q, [...Object.values(it.name || {}), ...(it.words || []), ...(extraNames[id] || [])]);
    if (s >= 50) out.push({ kind: 'item', id, score: s });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 9);
}
export const topic = id => TOPICS.find(t => t.id === id);
export const kindWord = (kind, lang) => (KIND[kind] || (kind === 'page' ? WORDS.page : null))?.[lang] || KIND[kind]?.en || '';
export const say = (words, lang) => (words ? words[lang] || words.en : '');
