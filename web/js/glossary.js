// The glossary (28 Nov 2026; the user asked on 27 Nov: "astronomi sözlüğü: yıldız nedir, kahverengi cüce nedir, galaksi
// nedir"). Twenty-four words in the site's six languages, each said in a sentence or two for someone who knows nothing
// of astronomy. The menu opens them all; in the panel, the guide and the pages, the first time a harder word appears it
// is underlined with dots and a press says what it means. The words used for exposure and visit are the site's own
// (poz, gözlem; Aufnahme, Beobachtung; pose, observation; ekspozycja, obserwacja; exposición, observación).

const L = ['en', 'tr', 'de', 'fr', 'pl', 'es'];
// id: [title, text] per language in the order of L; `m`: the pattern that finds the word in running text, per language
// (the start of a word; any letters may follow, so Turkish and Polish endings are matched too). No `m`: in the list only.
const G = {
  star: [
    ['Star', 'A ball of hot gas that makes its own light by fusing hydrogen in its core. The Sun is a star.'],
    ['Yıldız', 'Çekirdeğinde hidrojeni kaynaştırarak kendi ışığını üreten sıcak bir gaz küresi. Güneş de bir yıldızdır.'],
    ['Stern', 'Eine Kugel aus heißem Gas, die ihr eigenes Licht erzeugt, indem sie in ihrem Kern Wasserstoff verschmilzt. Die Sonne ist ein Stern.'],
    ['Étoile', 'Une boule de gaz chaud qui produit sa propre lumière en fusionnant de l’hydrogène en son cœur. Le Soleil est une étoile.'],
    ['Gwiazda', 'Kula gorącego gazu, która sama wytwarza światło, łącząc wodór w swoim jądrze. Słońce też jest gwiazdą.'],
    ['Estrella', 'Una bola de gas caliente que produce su propia luz fusionando hidrógeno en su núcleo. El Sol es una estrella.'],
  ],
  planet: [
    ['Planet', 'A large body that orbits a star and does not shine by itself: it reflects its star’s light.'],
    ['Gezegen', 'Bir yıldızın çevresinde dolanan, kendi ışığı olmayan büyük bir cisim; yıldızının ışığını yansıtır.'],
    ['Planet', 'Ein großer Körper, der einen Stern umkreist und nicht selbst leuchtet; er wirft das Licht seines Sterns zurück.'],
    ['Planète', 'Un grand corps qui tourne autour d’une étoile et ne brille pas par lui-même : il renvoie la lumière de son étoile.'],
    ['Planeta', 'Duże ciało krążące wokół gwiazdy, które samo nie świeci, tylko odbija światło swojej gwiazdy.'],
    ['Planeta', 'Un cuerpo grande que gira alrededor de una estrella y no brilla por sí mismo: refleja la luz de su estrella.'],
  ],
  browndwarf: [
    ['Brown dwarf', 'Too big to be a planet, too small to be a star: it never gets hot enough inside to burn hydrogen steadily. It glows faintly, mostly in infrared.'],
    ['Kahverengi cüce', 'Gezegen olamayacak kadar büyük, yıldız olamayacak kadar küçük bir cisim. İçi hidrojeni sürekli yakacak kadar ısınmaz; bu yüzden sönük ışır, en çok kızılötesinde.'],
    ['Brauner Zwerg', 'Zu groß für einen Planeten, zu klein für einen Stern: Im Inneren wird er nie heiß genug, um dauerhaft Wasserstoff zu verbrennen. Er leuchtet schwach, vor allem im Infrarot.'],
    ['Naine brune', 'Trop grosse pour être une planète, trop petite pour être une étoile : elle ne devient jamais assez chaude pour brûler l’hydrogène durablement. Elle brille faiblement, surtout en infrarouge.'],
    ['Brązowy karzeł', 'Za duży na planetę, za mały na gwiazdę: w jego wnętrzu nigdy nie jest dość gorąco, by stale spalać wodór. Świeci słabo, głównie w podczerwieni.'],
    ['Enana marrón', 'Demasiado grande para ser un planeta y demasiado pequeña para ser una estrella: nunca se calienta lo bastante por dentro para quemar hidrógeno de forma continua. Brilla débilmente, sobre todo en infrarrojo.'],
  ],
  galaxy: [
    ['Galaxy', 'A huge collection of stars, gas and dust held together by gravity. Ours, the Milky Way, has hundreds of billions of stars.'],
    ['Galaksi', 'Kütle çekimiyle bir arada duran devasa bir yıldız, gaz ve toz topluluğu. Bizimki olan Samanyolu’nda yüz milyarlarca yıldız var.'],
    ['Galaxie', 'Eine riesige Ansammlung von Sternen, Gas und Staub, die die Schwerkraft zusammenhält. Unsere, die Milchstraße, hat Hunderte Milliarden Sterne.'],
    ['Galaxie', 'Un immense ensemble d’étoiles, de gaz et de poussière tenu par la gravité. La nôtre, la Voie lactée, compte des centaines de milliards d’étoiles.'],
    ['Galaktyka', 'Ogromne skupisko gwiazd, gazu i pyłu utrzymywane razem przez grawitację. Nasza, Droga Mleczna, ma setki miliardów gwiazd.'],
    ['Galaxia', 'Un enorme conjunto de estrellas, gas y polvo unido por la gravedad. La nuestra, la Vía Láctea, tiene cientos de miles de millones de estrellas.'],
  ],
  milkyway: [
    ['Milky Way', 'Our galaxy. On a dark night its disc is the faint band of light across the sky; the Sun is one of its stars.'],
    ['Samanyolu', 'Bizim galaksimiz. Karanlık bir gecede diski, gökyüzünü boydan boya geçen soluk ışık şerididir; Güneş onun yıldızlarından biridir.'],
    ['Milchstraße', 'Unsere Galaxie. In einer dunklen Nacht ist ihre Scheibe das blasse Lichtband am Himmel; die Sonne ist einer ihrer Sterne.'],
    ['Voie lactée', 'Notre galaxie. Par une nuit noire, son disque est la pâle bande de lumière qui traverse le ciel ; le Soleil est l’une de ses étoiles.'],
    ['Droga Mleczna', 'Nasza galaktyka. W ciemną noc jej dysk to blade pasmo światła na niebie; Słońce jest jedną z jej gwiazd.'],
    ['Vía Láctea', 'Nuestra galaxia. En una noche oscura, su disco es la pálida franja de luz que cruza el cielo; el Sol es una de sus estrellas.'],
  ],
  nebula: [
    ['Nebula', 'A cloud of gas and dust in space. In some, new stars are born; others were thrown off by a dying star.'],
    ['Bulutsu', 'Uzayda bir gaz ve toz bulutu. Kimi yeni yıldızların doğduğu yerdir, kimi ölen bir yıldızın dışarı attığı gazdır.'],
    ['Nebel', 'Eine Wolke aus Gas und Staub im All. In manchen entstehen neue Sterne, andere hat ein sterbender Stern abgestoßen.'],
    ['Nébuleuse', 'Un nuage de gaz et de poussière dans l’espace. Certaines sont des berceaux d’étoiles, d’autres ont été rejetées par une étoile mourante.'],
    ['Mgławica', 'Obłok gazu i pyłu w kosmosie. W niektórych rodzą się nowe gwiazdy, inne zostały odrzucone przez umierającą gwiazdę.'],
    ['Nebulosa', 'Una nube de gas y polvo en el espacio. En algunas nacen estrellas nuevas; otras las expulsó una estrella moribunda.'],
  ],
  asteroid: [
    ['Asteroid', 'A rocky body orbiting the Sun, smaller than a planet; most lie between Mars and Jupiter.'],
    ['Asteroit', 'Güneş’in çevresinde dolanan, gezegenden küçük kayalık bir cisim; çoğu Mars ile Jüpiter arasındadır.'],
    ['Asteroid', 'Ein felsiger Körper, der die Sonne umkreist, kleiner als ein Planet; die meisten liegen zwischen Mars und Jupiter.'],
    ['Astéroïde', 'Un corps rocheux qui tourne autour du Soleil, plus petit qu’une planète ; la plupart se trouvent entre Mars et Jupiter.'],
    ['Planetoida', 'Skaliste ciało krążące wokół Słońca, mniejsze od planety; większość znajduje się między Marsem a Jowiszem.'],
    ['Asteroide', 'Un cuerpo rocoso que gira alrededor del Sol, más pequeño que un planeta; la mayoría está entre Marte y Júpiter.'],
  ],
  comet: [
    ['Comet', 'A lump of ice and dust orbiting the Sun. Near the Sun its ice turns to gas, and it grows a glowing head and tail.'],
    ['Kuyruklu yıldız', 'Güneş’in çevresinde dolanan bir buz ve toz yığını. Güneş’e yaklaşınca buzu gaza dönüşür; parlayan bir baş ve kuyruk oluşur.'],
    ['Komet', 'Ein Klumpen aus Eis und Staub, der die Sonne umkreist. In Sonnennähe wird sein Eis zu Gas, und er bekommt einen leuchtenden Kopf und Schweif.'],
    ['Comète', 'Un bloc de glace et de poussière qui tourne autour du Soleil. Près du Soleil, sa glace se change en gaz et elle prend une tête et une queue brillantes.'],
    ['Kometa', 'Bryła lodu i pyłu krążąca wokół Słońca. W pobliżu Słońca jej lód zamienia się w gaz i pojawiają się świecąca głowa i warkocz.'],
    ['Cometa', 'Un bloque de hielo y polvo que gira alrededor del Sol. Cerca del Sol su hielo se vuelve gas y le crecen una cabeza y una cola brillantes.'],
  ],
  constellation: [
    ['Constellation', 'One of the 88 areas into which astronomers divide the sky, named after a figure of bright stars.'],
    ['Takımyıldızı', 'Gökbilimcilerin gökyüzünü böldüğü 88 bölgeden biri; adını parlak yıldızların oluşturduğu bir şekilden alır.'],
    ['Sternbild', 'Eines der 88 Gebiete, in die die Astronomen den Himmel teilen, benannt nach einer Figur aus hellen Sternen.'],
    ['Constellation', 'L’une des 88 zones entre lesquelles les astronomes divisent le ciel, nommée d’après une figure d’étoiles brillantes.'],
    ['Gwiazdozbiór', 'Jeden z 88 obszarów, na które astronomowie dzielą niebo, nazwany od figury tworzonej przez jasne gwiazdy.'],
    ['Constelación', 'Una de las 88 zonas en que los astrónomos dividen el cielo, con el nombre de una figura de estrellas brillantes.'],
  ],
  lightyear: [
    ['Light-year', 'The distance light travels in a year: about 9.5 trillion kilometres. It measures distance, not time.'],
    ['Işık yılı', 'Işığın bir yılda aldığı yol: yaklaşık 9,5 trilyon kilometre. Zamanı değil, uzaklığı ölçer.'],
    ['Lichtjahr', 'Die Strecke, die das Licht in einem Jahr zurücklegt: etwa 9,5 Billionen Kilometer. Es misst eine Entfernung, keine Zeit.'],
    ['Année-lumière', 'La distance que la lumière parcourt en un an : environ 9 500 milliards de kilomètres. Elle mesure une distance, pas un temps.'],
    ['Rok świetlny', 'Odległość, jaką światło przebywa w ciągu roku: około 9,5 biliona kilometrów. Mierzy odległość, a nie czas.'],
    ['Año luz', 'La distancia que recorre la luz en un año: unos 9,5 billones de kilómetros. Mide una distancia, no un tiempo.'],
  ],
  infrared: [
    ['Infrared', 'Light with longer waves than red, invisible to our eyes. Warm things, and cold dusty places, shine in it.'],
    ['Kızılötesi', 'Kırmızıdan daha uzun dalgalı, gözümüzün göremediği ışık. Ilık cisimler ve soğuk, tozlu yerler bu ışıkta parlar.'],
    ['Infrarot', 'Licht mit längeren Wellen als Rot, unsichtbar für unsere Augen. Warme Dinge und kalte, staubige Orte leuchten darin.'],
    ['Infrarouge', 'Une lumière aux ondes plus longues que le rouge, invisible à nos yeux. Les objets tièdes et les régions froides et poussiéreuses y brillent.'],
    ['Podczerwień', 'Światło o falach dłuższych niż czerwień, niewidoczne dla oczu. Świecą w nim ciepłe ciała oraz zimne, zapylone miejsca.'],
    ['Infrarrojo', 'Luz de ondas más largas que el rojo, invisible para nuestros ojos. En ella brillan los objetos tibios y los lugares fríos y polvorientos.'],
  ],
  wavelength: [
    ['Wavelength', 'The length of one wave of light: it sets the light’s colour. SPHEREx measures it in micrometres (µm), thousandths of a millimetre.'],
    ['Dalga boyu', 'Işığın bir dalgasının uzunluğu; ışığın rengini o belirler. SPHEREx bunu mikrometreyle (µm), milimetrenin binde biriyle ölçer.'],
    ['Wellenlänge', 'Die Länge einer Lichtwelle; sie bestimmt die Farbe. SPHEREx misst sie in Mikrometern (µm), Tausendstel Millimetern.'],
    ['Longueur d’onde', 'La longueur d’une onde de lumière : elle fixe sa couleur. SPHEREx la mesure en micromètres (µm), des millièmes de millimètre.'],
    ['Długość fali', 'Długość jednej fali światła; to ona wyznacza barwę. SPHEREx mierzy ją w mikrometrach (µm), tysięcznych częściach milimetra.'],
    ['Longitud de onda', 'La longitud de una onda de luz: fija su color. SPHEREx la mide en micrómetros (µm), milésimas de milímetro.'],
  ],
  spectrum: [
    ['Spectrum', 'Light spread out by wavelength, like a rainbow. Its dips and bumps tell what a body is made of.'],
    ['Spektrum', 'Gökkuşağı gibi dalga boyuna göre açılmış ışık. İçindeki çukurlar ve tümsekler cismin neyden oluştuğunu söyler.'],
    ['Spektrum', 'Licht, nach Wellenlängen aufgefächert wie ein Regenbogen. Senken und Buckel darin verraten, woraus ein Körper besteht.'],
    ['Spectre', 'La lumière étalée selon la longueur d’onde, comme un arc-en-ciel. Ses creux et ses bosses disent de quoi un corps est fait.'],
    ['Widmo', 'Światło rozłożone według długości fali, jak tęcza. Jego doliny i wzniesienia mówią, z czego zbudowane jest ciało.'],
    ['Espectro', 'La luz extendida según la longitud de onda, como un arcoíris. Sus valles y picos dicen de qué está hecho un cuerpo.'],
  ],
  magnitude: [
    ['Magnitude', 'How bright something looks, on a reversed scale: smaller numbers are brighter. The eye sees down to about 6.'],
    ['Kadir', 'Bir cismin ne kadar parlak göründüğü, ters bir ölçekte: sayı küçüldükçe cisim parlaklaşır. Göz yaklaşık 6 kadire kadar görür.'],
    ['Größenklasse', 'Wie hell etwas erscheint, auf einer umgekehrten Skala: kleinere Zahlen sind heller. Das Auge sieht bis etwa 6.'],
    ['Magnitude', 'L’éclat apparent d’un objet, sur une échelle inversée : plus le nombre est petit, plus l’objet est brillant. L’œil voit jusqu’à environ 6.'],
    ['Wielkość gwiazdowa', 'Jak jasny wydaje się obiekt, na odwróconej skali: mniejsza liczba oznacza jaśniejszy. Oko widzi do około 6.'],
    ['Magnitud', 'Lo brillante que se ve algo, en una escala invertida: cuanto menor el número, más brillante. El ojo ve hasta unas 6.'],
  ],
  parallax: [
    ['Parallax', 'A star’s small yearly back-and-forth as the Earth goes round the Sun. The nearer the star, the bigger it is: it gives the distance.'],
    ['Paralaks', 'Dünya Güneş’in çevresinde dolanırken bir yıldızın gökte yaptığı küçük yıllık gidip gelme. Yıldız ne kadar yakınsa o kadar büyüktür; uzaklık buradan bulunur.'],
    ['Parallaxe', 'Das kleine jährliche Hin und Her eines Sterns, während die Erde um die Sonne läuft. Je näher der Stern, desto größer ist es; so ergibt sich seine Entfernung.'],
    ['Parallaxe', 'Le petit va-et-vient annuel d’une étoile pendant que la Terre tourne autour du Soleil. Plus l’étoile est proche, plus il est grand : il donne sa distance.'],
    ['Paralaksa', 'Małe coroczne przesunięcie gwiazdy, gdy Ziemia obiega Słońce. Im bliższa gwiazda, tym jest większe; z niego wyznacza się odległość.'],
    ['Paralaje', 'El pequeño vaivén anual de una estrella mientras la Tierra gira alrededor del Sol. Cuanto más cerca la estrella, mayor es; de él sale su distancia.'],
  ],
  propermotion: [
    ['Proper motion', 'How far a star moves across the sky each year as it travels through space, in arcseconds a year.'],
    ['Öz hareket', 'Bir yıldızın uzayda ilerlerken gökte her yıl aldığı yol; yılda yay saniyesiyle ölçülür. Bu sitede “gökteki yıllık hareketi” diye geçer.'],
    ['Eigenbewegung', 'Wie weit ein Stern auf seinem Weg durchs All jedes Jahr am Himmel vorrückt, in Bogensekunden pro Jahr.'],
    ['Mouvement propre', 'La distance dont une étoile avance chaque année dans le ciel en voyageant dans l’espace, en secondes d’arc par an.'],
    ['Ruch własny', 'Jak daleko gwiazda przesuwa się co roku na niebie, podróżując przez przestrzeń; mierzony w sekundach łuku na rok.'],
    ['Movimiento propio', 'Cuánto avanza una estrella en el cielo cada año al viajar por el espacio, en segundos de arco por año.'],
  ],
  arcsecond: [
    ['Arcsecond (″)', 'A tiny angle on the sky: one 3,600th of a degree. The full Moon is about 1,800″ wide.'],
    ['Yay saniyesi (″)', 'Gökte çok küçük bir açı: bir derecenin 3.600’de biri. Dolunay yaklaşık 1.800″ genişliğindedir.'],
    ['Bogensekunde (″)', 'Ein winziger Winkel am Himmel: ein 3600stel Grad. Der Vollmond ist etwa 1800″ breit.'],
    ['Seconde d’arc (″)', 'Un angle minuscule dans le ciel : un 3 600e de degré. La pleine Lune mesure environ 1 800″.'],
    ['Sekunda łuku (″)', 'Maleńki kąt na niebie: 1/3600 stopnia. Tarcza Księżyca w pełni ma około 1800″.'],
    ['Segundo de arco (″)', 'Un ángulo diminuto en el cielo: la 3600.ª parte de un grado. La Luna llena mide unos 1800″.'],
  ],
  variable: [
    ['Variable star', 'A star whose brightness changes: because it pulsates, because dust or a companion hides it, or because it flares.'],
    ['Değişen yıldız', 'Parlaklığı değişen yıldız: zonkladığı için, bir toz bulutunun ya da eşinin arkasında kaldığı için ya da patlamalar yaptığı için.'],
    ['Veränderlicher Stern', 'Ein Stern, dessen Helligkeit sich ändert: weil er pulsiert, weil Staub oder ein Begleiter ihn verdeckt oder weil er ausbricht.'],
    ['Étoile variable', 'Une étoile dont l’éclat change : parce qu’elle pulse, qu’elle est cachée par de la poussière ou un compagnon, ou qu’elle connaît des sursauts.'],
    ['Gwiazda zmienna', 'Gwiazda, której jasność się zmienia: bo pulsuje, zasłania ją pył lub towarzysz albo wybucha.'],
    ['Estrella variable', 'Una estrella cuyo brillo cambia: porque pulsa, porque el polvo o una compañera la tapan, o porque estalla.'],
  ],
  blackhole: [
    ['Black hole', 'A place where gravity is so strong that not even light gets out. It shows itself by what it does to the gas and stars around it.'],
    ['Kara delik', 'Kütle çekimi o kadar güçlü bir yer ki ışık bile kaçamaz. Çevresindeki gaza ve yıldızlara yaptıklarından anlaşılır.'],
    ['Schwarzes Loch', 'Ein Ort, an dem die Schwerkraft so stark ist, dass nicht einmal Licht entkommt. Man erkennt es an dem, was es mit Gas und Sternen in seiner Nähe macht.'],
    ['Trou noir', 'Un lieu où la gravité est si forte que même la lumière ne s’en échappe pas. On le repère à ce qu’il fait au gaz et aux étoiles qui l’entourent.'],
    ['Czarna dziura', 'Miejsce, gdzie grawitacja jest tak silna, że nawet światło nie może uciec. Poznaje się ją po tym, co robi z gazem i gwiazdami wokół.'],
    ['Agujero negro', 'Un lugar donde la gravedad es tan fuerte que ni la luz escapa. Se descubre por lo que hace con el gas y las estrellas de su alrededor.'],
  ],
  spherex: [
    ['SPHEREx', 'A NASA space telescope launched in March 2025. Every six months it maps the whole sky in 102 infrared colours.'],
    ['SPHEREx', 'Mart 2025’te fırlatılan bir NASA uzay teleskobu. Bütün gökyüzünü altı ayda bir, 102 kızılötesi renkte haritalar.'],
    ['SPHEREx', 'Ein Weltraumteleskop der NASA, gestartet im März 2025. Es kartiert alle sechs Monate den ganzen Himmel in 102 Infrarotfarben.'],
    ['SPHEREx', 'Un télescope spatial de la NASA lancé en mars 2025. Tous les six mois, il cartographie le ciel entier en 102 couleurs infrarouges.'],
    ['SPHEREx', 'Kosmiczny teleskop NASA wystrzelony w marcu 2025. Co pół roku mapuje całe niebo w 102 barwach podczerwieni.'],
    ['SPHEREx', 'Un telescopio espacial de la NASA lanzado en marzo de 2025. Cada seis meses cartografía todo el cielo en 102 colores infrarrojos.'],
  ],
  exposure: [
    ['Exposure', 'One picture taken by the telescope. SPHEREx takes many of the same spot, each in a slightly different colour.'],
    ['Poz', 'Teleskobun çektiği tek bir görüntü. SPHEREx aynı yerin pek çok pozunu çeker; her biri biraz farklı bir renkte.'],
    ['Aufnahme', 'Ein einzelnes Bild des Teleskops. SPHEREx macht viele von derselben Stelle, jede in einer etwas anderen Farbe.'],
    ['Pose', 'Une seule image prise par le télescope. SPHEREx en prend beaucoup du même endroit, chacune dans une couleur un peu différente.'],
    ['Ekspozycja', 'Jedno zdjęcie wykonane przez teleskop. SPHEREx robi wiele zdjęć tego samego miejsca, każde w nieco innej barwie.'],
    ['Exposición', 'Una sola imagen tomada por el telescopio. SPHEREx toma muchas del mismo lugar, cada una en un color algo distinto.'],
  ],
  visit: [
    ['Visit', 'One of SPHEREx’s passes over a spot, about every six months; each holds many exposures.'],
    ['Gözlem', 'SPHEREx’in bir noktaya yaklaşık altı ayda bir bakışı; her gözlemde çok sayıda poz vardır.'],
    ['Beobachtung', 'Ein Überflug von SPHEREx über eine Stelle, etwa alle sechs Monate; jede umfasst viele Aufnahmen.'],
    ['Observation', 'Un passage de SPHEREx sur un endroit, environ tous les six mois ; chacun réunit de nombreuses poses.'],
    ['Obserwacja', 'Jedno przejście SPHEREx nad danym miejscem, mniej więcej co pół roku; każde obejmuje wiele ekspozycji.'],
    ['Observación', 'Una pasada de SPHEREx sobre un lugar, más o menos cada seis meses; cada una reúne muchas exposiciones.'],
  ],
  detector: [
    ['Detector', 'SPHEREx has six (D1–D6); each catches one band of wavelengths between 0.75 and 5 µm.'],
    ['Dedektör', 'SPHEREx’in altı dedektörü vardır (D1–D6); her biri 0,75 ile 5 µm arasındaki bir dalga boyu bandını yakalar.'],
    ['Detektor', 'SPHEREx hat sechs (D1–D6); jeder fängt ein Band von Wellenlängen zwischen 0,75 und 5 µm ein.'],
    ['Détecteur', 'SPHEREx en a six (D1–D6) ; chacun capte une bande de longueurs d’onde entre 0,75 et 5 µm.'],
    ['Detektor', 'SPHEREx ma sześć detektorów (D1–D6); każdy chwyta pasmo fal między 0,75 a 5 µm.'],
    ['Detector', 'SPHEREx tiene seis (D1–D6); cada uno capta una banda de longitudes de onda entre 0,75 y 5 µm.'],
  ],
  catalogue: [
    ['Catalogue', 'The list in which astronomers keep measured objects: their places, motions, distances and brightness. Here its values are the ones to rely on.'],
    ['Katalog', 'Gökbilimcilerin ölçtükleri cisimleri kaydettiği liste: yerleri, hareketleri, uzaklıkları, parlaklıkları. Buradaki değerleri güvenilecek olanlardır.'],
    ['Katalog', 'Die Liste, in der Astronomen vermessene Objekte führen: Ort, Bewegung, Entfernung, Helligkeit. Ihre Werte sind hier die verlässlichen.'],
    ['Catalogue', 'La liste où les astronomes consignent les objets mesurés : position, mouvement, distance, éclat. Ses valeurs sont ici celles qui font foi.'],
    ['Katalog', 'Spis, w którym astronomowie prowadzą zmierzone obiekty: położenie, ruch, odległość, jasność. Jego wartości są tu tymi wiarygodnymi.'],
    ['Catálogo', 'La lista en que los astrónomos registran los objetos medidos: posición, movimiento, distancia, brillo. Aquí sus valores son los fiables.'],
  ],
};
// Where a harder word is underlined in running text: the start of the word in each language (order of L).
const M = {
  browndwarf: ['[Bb]rown dwarf', '[Kk]ahverengi cüce', '[Bb]raune[rn]? Zwerg', '[Nn]aines? brunes?', '[Bb]rązow\\p{L}* karł', '[Ee]nanas? marr[oó]n'],
  infrared: ['[Ii]nfrared', '[Kk]ızılötesi', '[Ii]nfrarot', '[Ii]nfrarouge', '[Pp]odczerwie', '[Ii]nfrarroj'],
  spectrum: ['[Ss]pectr(?:um|a)', '[Ss]pektrum', '[Ss]pektr(?:um|en)', '[Ss]pectre', '[Ww]idm', '[Ee]spectro'],
  wavelength: ['[Ww]avelength', '[Dd]alga boy', '[Ww]ellenlänge', '[Ll]ongueurs? d[’\']onde', '[Dd]ługoś\\p{L}* fal', '[Ll]ongitud(?:es)? de onda'],
  magnitude: ['[Mm]agnitude', 'kadir', '[Gg]rößenklasse', '[Mm]agnitude', '[Ww]ielkoś\\p{L}* gwiazdow', '[Mm]agnitud'],
  parallax: ['[Pp]arallax', '[Pp]aralaks', '[Pp]arallaxe', '[Pp]arallaxe', '[Pp]aralaks', '[Pp]aralaje'],
  propermotion: ['[Pp]roper motion', '[Öö]z hareket', '[Ee]igenbewegung', '[Mm]ouvements? propres?', '[Rr]uch\\p{L}* własn', '[Mm]ovimientos? propios?'],
  lightyear: ['[Ll]ight[- ]years?', '[Iı]şık yıl', '[Ll]ichtjahr', '[Aa]nnées?-lumière', '(?:[Ll]at|[Rr]ok\\p{L}*) świetln', '[Aa]ños? luz'],
  variable: ['[Vv]ariable star', '[Dd]eğişen yıldız', '[Vv]eränderliche[rn]? Stern', '[Éé]toiles? variables?', '[Gg]wiazd\\p{L}* zmienn', '[Ee]strellas? variables?'],
  nebula: ['[Nn]ebula', '[Bb]ulutsu', '[Nn]ebel', '[Nn]ébuleuse', '[Mm]gławic', '[Nn]ebulosa'],
  detector: ['[Dd]etector', '[Dd]edektör', '[Dd]etektor', '[Dd]étecteur', '[Dd]etektor', '[Dd]etector'],
  arcsecond: ['[Aa]rcsecond', '[Yy]ay saniye', '[Bb]ogensekunde', '[Ss]econdes? d[’\']arc', '[Ss]ekund\\p{L}* łuku', '[Ss]egundos? de arco'],
};
// Where words are looked for, and never inside a link, a button or a word already underlined.
const WHERE = ['#lookbox p.look', '#leadbox .leadtxt', '#findings .chkbody p', '#findings .rfacts dt', '#findings .rwhy', '#explain', '#about .gloss', '#rg_text', '#sheet article p', '#sheet article li', ':is(#sheet) > p:not(.eyebrow)'];

export function makeGlossary({ lang, title, more, close, intro, onAll }) {
  const k = Math.max(0, L.indexOf(lang));
  const word = id => G[id][k] || G[id][0];
  const rx = {};
  for (const [id, pats] of Object.entries(M)) rx[id] = new RegExp(`(^|[^\\p{L}\\p{N}])((?:${pats[k]})\\p{L}*)`, 'u');
  let pop = null, busy = false, raf = 0;

  /** The first time each harder word appears in the text on screen, it is underlined; a press says what it means. */
  function mark() {
    raf = 0;
    if (busy) return;
    const inList = !!document.querySelector('#sheet .glosslist');          // the glossary's own sheet (open, or closed with its words still in it) is not marked
    busy = true;
    try {
      const done = new Set([...document.querySelectorAll('.term[data-g]')].filter(t => t.isConnected && t.getClientRects().length).map(t => t.dataset.g));
      for (const root of document.querySelectorAll(WHERE.join(', '))) {
        if (!root.getClientRects().length || (inList && root.closest('#sheet'))) continue;
        const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.parentElement.closest('a, button, .term, summary') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
        const nodes = []; while (walk.nextNode()) nodes.push(walk.currentNode);
        for (const n of nodes) {
          for (const id of Object.keys(rx)) {
            if (done.has(id)) continue;
            const m = rx[id].exec(n.nodeValue); if (!m) continue;
            const at = m.index + m[1].length, w = m[2];
            const rest = n.splitText(at); rest.nodeValue = rest.nodeValue.slice(w.length);
            const b = document.createElement('button'); b.type = 'button'; b.className = 'term'; b.dataset.g = id; b.textContent = w; b.title = word(id)[0];
            rest.parentNode.insertBefore(b, rest);
            done.add(id);
            break;          // this text node is now two; the next pass looks at what is left
          }
        }
      }
    } finally { busy = false; }
  }
  const soon = () => { if (!raf) raf = requestAnimationFrame(mark); };

  function hide() { if (pop) pop.hidden = true; }
  function show(id, from) {
    if (!pop) {
      pop = document.createElement('div'); pop.id = 'gpop'; pop.className = 'gpop'; pop.setAttribute('role', 'dialog');
      pop.innerHTML = '<header><b></b><button type="button" class="x"></button></header><p></p><button type="button" class="all"></button>';
      document.body.append(pop);
      pop.querySelector('.x').onclick = hide;
      pop.querySelector('.all').onclick = () => { hide(); onAll(); };
    }
    const [t, x] = word(id);
    pop.querySelector('b').textContent = t; pop.querySelector('p').textContent = x;
    pop.querySelector('.x').setAttribute('aria-label', close); pop.querySelector('.x').textContent = '×';
    pop.querySelector('.all').textContent = `${more} →`;
    pop.setAttribute('aria-label', t); pop.hidden = false;
    // a desk: under the word; a phone: along the bottom, above the app's bar
    if (innerWidth < 600) { pop.classList.add('sheetlike'); pop.style.left = pop.style.top = ''; }
    else {
      pop.classList.remove('sheetlike');
      const r = from.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
      let left = Math.min(Math.max(8, r.left), innerWidth - w - 8), top = r.bottom + 8;
      if (top + h > innerHeight - 8) top = Math.max(8, r.top - h - 8);
      pop.style.left = `${left}px`; pop.style.top = `${top}px`;
    }
    pop.querySelector('.x').focus({ preventScroll: true });
  }
  document.addEventListener('click', e => {
    const t = e.target.closest?.('.term[data-g]');
    if (t) { e.preventDefault(); e.stopPropagation(); show(t.dataset.g, t); return; }
    if (pop && !pop.hidden && !e.target.closest?.('#gpop')) hide();
  }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  new MutationObserver(soon).observe(document.body, { childList: true, subtree: true, characterData: true });
  document.addEventListener('toggle', soon, true);          // a line opened in the story: its words come into sight
  soon();

  /** Every word, in the order of the language's alphabet, for the menu's sheet. */
  function sheetHtml() {
    const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const ids = Object.keys(G).sort((a, b) => word(a)[0].localeCompare(word(b)[0], lang));
    return `<article><h1>${esc(title)}</h1><p class="lead">${esc(intro)}</p><dl class="glosslist">${ids.map(id => `<div id="g-${id}"><dt>${esc(word(id)[0])}</dt><dd>${esc(word(id)[1])}</dd></div>`).join('')}</dl></article>`;
  }
  return { sheetHtml, mark: soon, show, hide, ids: Object.keys(G) };
}
