// The four information pages in Turkish. The English text is in ../pages.js: keep the two in step.
export default {
  nav: { hunt: 'Asteroit avı', spherex: 'SPHEREx nedir?', how: 'Nasıl çalışır?', about: 'Hakkında' },
  figure: {
    label: 'Rengi bir kenarından ötekine değişen bir filtre; aynı yıldız her pozda başka bir renge düşer',
    exposure: 'poz',
    caption: 'Teleskop gökyüzünde adım adım ilerler; böylece aynı yıldız her pozda filtrenin başka bir rengine düşer.',
  },
  sheets: ({ TEAM, figure, team }) => ({
    spherex: () => `
    <p class="eyebrow">Görev</p>
    <h1>SPHEREx nedir?</h1>
    <p class="lead">SPHEREx, bütün gökyüzünü kızılötesi ışığın 102 renginde fotoğraflayan bir NASA uzay teleskobudur. Sonra bunu altı ayda bir yeniden yapar.</p>
    <div class="statgrid">
      <div><b>102</b><span>renk, 0,75 ile 5 mikron arasında</span></div>
      <div><b>6 ay</b><span>bütün gökyüzünü bir kez haritalamak için</span></div>
      <div><b>2025</b><span>11 Mart’ta fırlatıldı</span></div>
      <div><b>6,15″</b><span>bir pikselin kapladığı gökyüzü parçası</span></div>
    </div>
    <h2>Neden kızılötesi?</h2>
    <p>Kızılötesi, gözümüzün görebildiğinden daha uzun dalga boylu ışıktır. Soğuk cisimler bu ışıkta parlar: kahverengi cüceler, toz bulutları, ömrünün sonuna yaklaşmış dev yıldızlar. Çok uzak galaksilerin ışığı bize bu dalga boylarına uzamış olarak ulaşır. Su, karbondioksit ve metan gibi moleküllerin her biri kızılötesi ışığı kendine özgü dalga boylarında soğurur; bu yüzden bir cismin kızılötesi renkleri onun neyden oluştuğunu ele verir.</p>
    <h2>Filtre tekerleği olmadan 102 renk</h2>
    <p>Çoğu kamera bir seferde tek bir renk çeker. SPHEREx ise rengi bir kenarından ötekine yumuşakça değişen filtrelerin ardından bakar. Teleskop gökyüzünde adım adım ilerledikçe her yıldız her pozda filtrenin başka bir yerine düşer ve başka bir renkte kaydedilir.</p>
    ${figure}
    <p>Bir yıldızın yeterince pozunu toplayınca bütün spektrumu elinizde olur. ChronosphereX’te zaman çizgisinde ilerlerken spektrumun da oluşması bu yüzden.</p>
    <h2>Ne için yapıldı</h2>
    <ul>
      <li><b>Evrenin ilk anı.</b> 450 milyondan fazla galaksiyi üç boyutlu haritalayarak Büyük Patlama’dan sonraki ilk anda neler olduğuna dair düşünceleri sınar.</li>
      <li><b>Galaksilerin tarihi.</b> Tek tek görülemeyecek kadar sönük olanlar da içinde, bütün galaksilerin toplam ışımasını ölçer.</li>
      <li><b>Su ve yaşamın yapı taşları.</b> Yıldızların ve gezegenlerin oluştuğu bulutlardaki donmuş suyu, karbondioksiti ve öteki buzları tarar.</li>
    </ul>
    <h2>Bu arada yaptığı başka bir şey</h2>
    <p>SPHEREx gökyüzünün her noktasına tekrar tekrar döndüğü için <b>hareket eden ya da değişen</b> her şeyi de kaydeder: asteroitler, kuyruklu yıldızlar, yakından geçen yıldızlar, kahverengi cüceler, şişip büzülen ya da ani parlamalar yapan yıldızlar. Yüz milyonlarca yıldızı ve galaksiyi fotoğraflar. Bu, herhangi bir ekibin tek tek bakabileceğinden çok daha fazladır. Bu araç, daha çok insan bakabilsin diye var.</p>
    <p class="fine">Kaynaklar: <a href="https://www.jpl.nasa.gov/missions/spherex/" target="_blank" rel="noopener">NASA/JPL görev sayfası</a> · <a href="https://science.nasa.gov/mission/spherex/" target="_blank" rel="noopener">NASA Science</a> · <a href="https://irsa.ipac.caltech.edu/Missions/spherex.html" target="_blank" rel="noopener">NASA/IPAC arşivinde SPHEREx</a></p>`,

    how: () => `
    <p class="eyebrow">Perde arkası</p>
    <h1>Nasıl çalışır?</h1>
    <p class="lead">Gökyüzünde bir noktaya tıklarsınız. Birkaç saniye sonra SPHEREx’in o noktadan çektiği bütün görüntüler hizalanmış olarak oynar, yanında da neyin yerinden oynadığını ya da değiştiğini anlatan birkaç satır belirir. Spektrum ve diğer bütün ölçümler tek dokunuş ötede. Arada şunlar olur.</p>
    <ol>
      <li><b>Gökyüzü dizininde arama.</b> Herkese açık bütün SPHEREx pozlarının, yaklaşık 1,6 milyon pozun, küçük bir dizini hangilerinin sizin noktanızın yakınına bakmış olduğunu söyler. Dizin belirli aralıklarla NASA’nın arşivinden yeniden kurulur; böylece yeni veri sürümleri kimse koda dokunmadan görünür.</li>
      <li><b>Yalnızca gereken pikselleri okuma.</b> Tam bir poz 60 megabayttan büyük bir dosyadır. Tarayıcınız dosyanın baş kısmını ve yalnızca noktanızın çevresindeki birkaç yüz kilobaytlık küçük piksel bloğunu, doğrudan NASA’nın buluttaki herkese açık verisinden okur.</li>
      <li><b>Görüntüleri hizalama.</b> Her poz başka bir açıyla çekilmiştir. Her blok, dosyada saklanan konum bilgisi kullanılarak kuzey yukarıda olacak biçimde aynı çerçeveye yeniden çizilir ve gökyüzü arka planının ışıması çıkarılır.</li>
      <li><b>Her pikselin rengini bulma.</b> Her poz noktanızı başka bir dalga boyunda kaydeder. Bu dalga boyu her dosyanın içindeki bir tablodan okunur.</li>
      <li><b>Hesabı sizin cihazınızda yapma.</b> Parlaklık, üst üste toplama, çıkarma, renkli görüntüler, ölçümler ve grafikler tarayıcınızda hesaplanır; her düğmenin anında yanıt vermesi bundandır.</li>
      <li><b>Ne olduğunu söyleme.</b> SIMBAD kataloğuna o konumda ne bulunduğu sorulur. Kataloglar bir yıldızın 2000 yılında nerede olduğunu saklar; bu yüzden o zamandan beri yer değiştirmiş yakın yıldızlar eşleştirmeden önce bugünün tarihine taşınır.</li>
    </ol>
    <h2>Sunucu yok, internet olmadan da çalışır</h2>
    <p>ChronosphereX’in kendi sunucusu yoktur. Sayfa bir dizi sabit dosyadan oluşur; geri kalan her şeyi tarayıcınız doğrudan NASA’nın herkese açık verisinden alır. Yani bizim tarafımızda çalışır durumda tutulacak ya da çökebilecek bir şey yok. Cihazınız son açtığınız beş yeri saklar. Rehberli turun tamamını da açılış sayfasındaki düğmeyle kaydedip internet olmadan kullanabilirsiniz.</p>
    <h2>Gördüklerinizi nasıl okumalı</h2>
    <ul>
      <li><b>Gözlemler.</b> SPHEREx gökyüzünün çoğu bölümüne yaklaşık altı ayda bir geri gelir ve her gözlem birkaç günden birkaç haftaya kadar sürer. Her gözlem için üst üste toplanmış tek bir görüntü sırayla gösterilince küçük bir yer değişimi kolayca görülür. Güneş Sistemi düzleminin kutuplarına yakın yerlere neredeyse her yörüngede baktığı için orada görüntüler aylara göre gruplanır.</li>
      <li><b>Yer değişimi tablosu.</b> Hareket eden bir cisim için her gözlemde ölçülen konum, kataloğun öngördüğüyle karşılaştırılır: gökyüzündeki düzgün hareketi ve en yakın yıldızlar için Dünya’nın yörüngesinden kaynaklanan yıllık paralaks kayması. Hareket, cismi gören her dedektörde ayrı ayrı ölçülür ve dedektörler birbiriyle karşılaştırılır.</li>
      <li><b>Spektrum.</b> Her nokta bir pozdur: dalga boyu ve halka içindeki noktanın o pozdaki parlaklığı. Noktalar gözleme göre renklendirilir.</li>
      <li><b>Molekül bantları.</b> Gölgeli şeritler yaygın moleküllerin ışığı soğurduğu yerleri gösterir. Tablo, orada ne kadar soğurma ölçüldüğünü bildirir.</li>
      <li><b>Komşularıyla karşılaştırma.</b> Parlaklık eğrisinin altında, halka içindeki noktanın gözlemler arasındaki değişimi aynı görüntülerdeki sıradan yıldızlarla karşılaştırılır. Onlar sabit kalmış, nokta kalmamışsa değişim gerçektir, kameranın bir kusuru değildir. Aynısı konumu için de yapılır.</li>
      <li><b>Her yıldız kontrol edilir.</b> Görüntülerin altında, alandaki her net yıldız hiçbir katalog kullanılmadan hareket ve parlaklık değişimi açısından sınanır. Öne çıkan birkaçı listelenir ve bir baklava işaretiyle gösterilir. İşaret, bakmak için bir nedendir, bir bulgu değil.</li>
      <li><b>Alandan geçen cisimler.</b> Görüntülerin altında her poz, birkaç dakika boyunca aynı yerde görünüp başka günlerde orada olmayan noktalar için taranır: asteroitler, kuyruklu yıldızlar, cüce gezegenler. Her çekimde SPHEREx durur ve iki dakika arayla en çok dört poz alır; altı dedektöründen ikisi de her an gökyüzünün aynı yerine bakar. Bu yüzden gerçek bir cisim aynı anda birkaç bağımsız görüntüde görünür; bir kozmik ışın çarpması ise yalnızca birinde. Bulunan her cismin adını, kataloglanmış her cismin o anda nerede olduğunu bilen SkyBoT (Paris Gözlemevi’nin bir hizmeti) verir; cisim çekimden çekime izlenebilir ve kendi spektrumu çıkarılır.</li>
      <li><b>Yıllar.</b> SPHEREx gökyüzünü ancak bir buçuk yıldır izliyor: çoğu yıldızın yer değiştirmesine yetmeyecek kadar kısa. Yıllar görünümü daha eski teleskopları ekler: her yere 1997 ile 2001 arasında bir gece bakan 2MASS, 2010’da WISE ve NEOWISE adıyla 2014’ten 2024’e altı ayda bir. Beş test nesnesinde bu teleskopların kendi pozları SPHEREx görüntüleriyle aynı çerçevede hizalanır; başka her yerde 2MASS ve AllWISE gökyüzü haritaları. Katalogdaki bir yıldız her resimde bulunur ve hareketi bütün süre boyunca ölçülür: Barnard Yıldızı için yılda 10,42 yay saniyesi, katalogda 10,39. Yalnızca en uzun dalga boylarında görünen bir cisim, WISE 0855 gibi, soğuktur: bu tür dünyalar böyle bulunur.</li>
    </ul>
    <h2 id="limits">Size söyleyemeyecekleri</h2>
    <ul>
      <li>Burada ölçülen hareket, bu sayfanın birkaç görüntüden yaptığı kendi tahminidir. Öğrenmek ve keşfetmek içindir. Bir katalog (Gaia, SIMBAD) değer veriyorsa esas alınacak olan odur. Sayfa katalog değerini kendi sayısının yanında gösterir ve kendi sayısının ne kadar şaşabileceğini söyler.</li>
      <li>Sayfanın kendi sayısının yanındaki ±, o sayının ne kadar şaşabileceğini gösterir. Yıllar görünümünde (2MASS, WISE, SPHEREx) sayfa, yıldızın her görüntüdeki konumundan düz bir çizgi geçirir: ± bu çizginin eğimindeki belirsizliktir ve tek bir görüntüdeki konum saçılmasının, ilk ve son görüntü arasındaki yıllara bölünmüş hâlinden küçük alınmaz. SPHEREx’in kendi gözlemlerinde ise konumların ilk ve son gözlem arasında ne kadar yakın çıktığına bakılır ve bu, aradaki süreye bölünür; birden çok dedektör ölçtüyse pay, dedektörlerin birbirinden farkından küçük alınmaz. Bu, saçılmadan çıkarılan basit bir tahmindir, tam bir hata analizi değildir: bir görüntüdeki her kusuru hesaba katmaz.</li>
      <li>Bir SPHEREx pikseli 6,15 yay saniyesi kaplar. Gökyüzündeki yeri en hızlı değişen yıldız bile yılda iki pikselden az yer değiştirir; bu yüzden hareket, gözlemler arasında küçük bir sıçrama olarak görülür, uzayan bir iz olarak görülmez.</li>
      <li>Ölçümler basit, sabit bir daire kullanır; keşfetmek içindir, bilimsel yayın için değil. Çok parlak yıldızlar dedektörü doyurur; onlarda bunun yerine yıldızın sönük dış ışıması ölçülür ve her dedektör komşusuna eklenir: spektrumun genel biçimi doğrudur, düzeyi ve ince ayrıntısı yaklaşıktır.</li>
      <li>Bir molekülün dalga boyundaki soğurma izi bir ipucudur, kesin bir tespit değil.</li>
      <li>Sıradan yıldızlarda konumlar yay saniyesinin onda birkaçı kadar bir doğrulukla yinelenir; ama kamerayı doyurmaya yakın bir yıldız tek bir gözlemde bir yay saniyesi ya da daha fazla sapabilir.</li>
      <li>Alandan geçen cisim araması yaklaşık 18. kadire kadar iner. Güneş Sistemi düzlemi boyunca sekiz deneme alanında, 14 ile 18,8 kadir arasında yirmi cisim bildirdi ve SkyBoT bunların hepsini tanıyordu; o düzlemden uzaktaki ya da yıldızların çevresindeki sekiz alanda hiçbir şey bildirmedi. Hiçbir kataloğun tanımadığı bir nokta yine de görüntüdeki bir kusur olabilir: yeniden bakmak için bir nedendir.</li>
      <li>Buradaki hiçbir şey bir keşif iddiası değildir. Yeni görünen bir şey, onu her cisimden bağlantısı verilen öteki araçlarda kontrol etmek için bir nedendir.</li>
    </ul>`,

    hunt: () => `
    <p class="eyebrow">Asteroit avı</p>
    <h1>SPHEREx görüntülerinde asteroit bulun</h1>
    <p class="lead">Asteroitler, kuyruklu yıldızlar ve cüce gezegenler SPHEREx görüntülerinden durmadan geçer: birkaç dakika aynı yerde duran, ertesi gün orada olmayan noktalar. Birini nasıl bulursunuz, bulunca elinize ne geçer ve bulunan cisim nereye bildirilir, hepsi burada.</p>
    <p class="docgo"><a class="cta" href="./?hunt" data-do="hunt">Ava başla</a></p>
    <h2>Bulmanın üç yolu</h2>
    <ul>
      <li><b>Alanı araç seçsin.</b> “Asteroit bul” düğmesi, numara almış ilk üç bin asteroitten birini rastgele seçer ve SPHEREx bakarken onun geçtiği bir gökyüzü parçasını açar. Aramaya ne hangi asteroit olduğu ne de nerede olduğu söylenir. Arama o parçanın bütün pozlarını, yaklaşık üç yüz pozu okur ve oradan nelerin geçtiğini bildirir. Bu, iki ile dört dakika sürer.</li>
      <li><b>Adıyla isteyin.</b> Arama kutusuna bir ad ya da numara yazın: Ceres, 433 Eros, Plüton, Uranüs, 2P/Encke. Araç yörüngeye bakar, SPHEREx’in o cismi gördüğü günleri bulur ve halka cismin üzerindeyken o gökyüzü parçasını açar.</li>
      <li><b>Herhangi bir yere bakın.</b> Hangi yeri açarsanız açın, o yerin pozlarında geçen cisimler aranır ve bulunanlar görüntülerin altında listelenir. Cisimlerin çoğu tutulum (ekliptik) yakınında, yani gezegenlerin gökyüzünde izlediği kuşakta dolaşır.</li>
    </ul>
    <h2>Cisim, görüntü kusurundan nasıl ayırt edilir?</h2>
    <p>Her çekimde SPHEREx durur ve ikişer dakika arayla en çok dört poz alır; altı dedektöründen ikisi de her an gökyüzünün aynı yerine bakar. Bu yüzden bir cisim aynı yerde, birbirinden bağımsız birkaç görüntüde birden görünür; teleskop saatler sonra geri döndüğünde ise orada olmaz. Yıldız her seferinde oradadır. Kozmik ışın izi yalnızca tek bir görüntüde görülür.</p>
    <p>Arama, yanıtı bilinen alanlarda denendi. Tutulum boyunca sekiz alanda yirmi cisim bildirdi; hepsi de doğru yerde duran, kataloglanmış cisimlerdi. Tutulumdan uzaktaki ya da yıldızların çevresindeki sekiz başka alanda hiçbir şey bildirmedi. Arama yaklaşık 18. kadire kadar iner.</p>
    <h2>Elinize ne geçer?</h2>
    <ul>
      <li><b>Bir ad.</b> Bulunan her cisim, kataloglanmış her cismin o anda nerede olduğunu bilen SkyBoT hizmetinde (Paris Gözlemevi) aranır.</li>
      <li><b>Hareketi.</b> İzlemek için bir cisme basın: her çekim için bir görüntü, cisimle birlikte ilerleyen halka, ne kadar yol aldığı ve ne kadar hızlı gittiği.</li>
      <li><b>Spektrumu.</b> Her poz onu 0,75 ile 5 mikron arasında başka bir kızılötesi renkte yakalar. Yerden yapılan asteroit renk taramaları 2,5 mikron dolayında biter; SPHEREx bunun ötesine, su içeren minerallerin ve buzların iz bıraktığı yere kadar gider. Plüton’un spektrumunda metan buzu görülür.</li>
      <li><b>Saklayabileceğiniz dosyalar.</b> Her dalga boyundaki parlaklığı bir tablo olarak (CSV) ve ölçülen konumları, her pozda uydunun nerede olduğuyla birlikte, Minor Planet Center’ın biçiminde (ADES).</li>
    </ul>
    <h2>Bulduğunuz cisim yeni mi?</h2>
    <p>Neredeyse kesinlikle hayır. Bunu avdan önce bilmek daha iyi. Tek bir SPHEREx pozu yaklaşık 18. kadire kadar olan asteroitleri görür. Her gece yeni asteroit arayan taramalar ise ana kuşağı bundan kat kat sönük cisimlere kadar katalogladı; yani SPHEREx’in görebildikleri çoktan bulundu. Denemelerimizde aramanın bildirdiği her cisim bilinen bir cisimdi.</p>
    <p>SkyBoT’un adlandıramadığı bir nokta çoğu zaman bir görüntü kusurudur. Ona inanmadan önce:</p>
    <ol>
      <li><b>İzleyin.</b> Gerçek bir cisim üç ya da daha çok çekimde, düz bir çizgi üzerinde ve değişmeyen bir hızla bulunur.</li>
      <li><b>Bakın.</b> “Pozlar” görünümünde çevresindeki yıldızlara benzemeli ve bir çekimin her görüntüsünde yer almalıdır.</li>
      <li><b>Minor Planet Center’a sorun.</b> Adsız bir noktanın kutusunda, yeri ve anı doldurulmuş olarak merkezin MPChecker aracına giden bir bağlantı vardır. Bu araç oranın yakınında bilinen her cismi listeler; geçen hafta bulunanları da.</li>
    </ol>
    <h2>Bulunan cisim nereye bildirilir?</h2>
    <p>Yeni asteroitler ve kuyruklu yıldızlar Küçük Gezegen Merkezi’ne (Minor Planet Center, MPC) bildirilir. Merkez, Uluslararası Astronomi Birliği’ne bağlı olarak dünyanın her yerindeki gözlemevlerinin ölçtüğü konumları toplar ve yörüngeleri hesaplar. Gerekenler:</p>
    <ul>
      <li><b>Merkezin biçiminde konumlar.</b> Cismin aynı geceden en az iki konumu, ADES adlı biçimde. “Konumlar (ADES)” düğmesi bu dosyayı yazar: zamanlar, konumlar, bunların ne kadar iyi bilindiği ve her poz için SPHEREx’in nerede olduğu; çünkü yörüngedeki bir teleskop yakın bir cismi Dünya’nın merkezinden biraz farklı bir açıdan görür. SPHEREx, MPC’nin listesinde 288 numaralı gözlemevidir.</li>
      <li><b>Önce MPC’ye yazmak.</b> SPHEREx görüntüleri, başkasının teleskobundan gelen arşiv verisidir. MPC böyle veriler için, herhangi bir şey gönderilmeden önce yardım masası üzerinden kendisine yazılmasını ister. Dosya, o yazıya eklenecek şeydir.</li>
      <li><b>Sabır.</b> Yalnızca bir gece görülen bir cisim, başka gözlemlerle birleştirilene kadar doğrulanmamış izler dosyasında bekler. Yörüngesi belli olunca geçici bir ad alır. Yörünge kesinleşince, ana kuşak asteroitlerinde yaklaşık dört dönüşten sonra, bir numara verilir. Keşfin kime ait olduğu o zaman belirlenir ve kâşif ancak o zaman bir ad önerebilir; ada Uluslararası Astronomi Birliği’nin bir çalışma grubu karar verir.</li>
    </ul>
    <p>Amacınız yeni bir asteroit keşfetmekse: NASA’nın Uluslararası Astronomik Arama İş Birliği (IASC), gönüllülere Pan-STARRS teleskobunun yeni görüntülerini taramaları için verir ve buluşlarını MPC’ye bildirir.</p>
    <h2>SPHEREx’in kattığı</h2>
    <p>Bu görüntülerin getirdiği yenilik, asteroitlerin kızılötesi ışığı. SPHEREx’in yüz binden fazla asteroit ve kuyruklu yıldızı 102 kızılötesi renkte kaydetmesi bekleniyor; görevin çevresindeki bir iş birliği de bunların spektrum kataloğunu hazırlıyor. Bu araçla herhangi birine bugün, çekimlerini tek tek izleyerek bakabilirsiniz.</p>
    <p class="fine">Kaynaklar: <a href="https://www.minorplanetcenter.net/about" target="_blank" rel="noopener">Minor Planet Center</a> · <a href="https://docs.minorplanetcenter.net/mpc-ops-docs/astrometry/" target="_blank" rel="noopener">MPC: konum bildirme kılavuzu</a> · <a href="https://docs.minorplanetcenter.net/mpc-ops-docs/data-and-services/sarc/" target="_blank" rel="noopener">MPC: arşiv gözlemleri</a> · <a href="https://docs.minorplanetcenter.net/mpc-ops-docs/astrometry/discoveries-and-credit/" target="_blank" rel="noopener">MPC: keşif, hak sahipliği ve adlandırma</a> · <a href="https://minorplanetcenter.net/cgi-bin/checkmp.cgi" target="_blank" rel="noopener">MPChecker</a> · <a href="https://ssp.imcce.fr/webservices/skybot/" target="_blank" rel="noopener">SkyBoT</a>, <a href="https://ssp.imcce.fr/webservices/miriade/" target="_blank" rel="noopener">Miriade</a> (IMCCE, Paris Gözlemevi) · <a href="https://irsa.ipac.caltech.edu/data/SPHEREx/docs/SPHEREx_Expsupp_QR.pdf" target="_blank" rel="noopener">SPHEREx Explanatory Supplement</a> · <a href="https://meetingorganizer.copernicus.org/EPSC2026/EPSC2026-797.html" target="_blank" rel="noopener">Mahlke vd. 2026</a> · <a href="https://arxiv.org/abs/2010.07822" target="_blank" rel="noopener">Hendler &amp; Malhotra 2020</a> · <a href="https://science.nasa.gov/get-involved/citizen-science/new-way-you-can-discover-asteroids/" target="_blank" rel="noopener">NASA: IASC</a></p>`,

    about: () => `
    <p class="eyebrow">Hakkında</p>
    <h1>Daha çok insan bakabilsin diye yapıldı</h1>
    <p class="lead">ChronosphereX’i ${TEAM.name} takımı geliştiriyor. SPHEREx verisinden hazırladığımız galaksi merkezi animasyonu 25 Kasım 2026’da NASA’nın <a href="https://science.nasa.gov/image-article/apod-2026-november-25-spherex-seeing-through-dust/" target="_blank" rel="noopener">Günün Astronomi Fotoğrafı</a> (APOD) sayfasında yayımlandı. Sitede gökyüzünün herhangi bir noktasını SPHEREx’in 102 renginde ve 27 yılın görüntülerinde inceleyebilir, asteroit avına çıkabilir ya da hareket eden noktayı bulma oyununu oynayabilirsiniz.</p>
    ${team('Ekip')}
    <h2>Neden yaptık</h2>
    <p>Plüton 1930’da iki fotoğrafı karşılaştıran bir insan tarafından bulundu. İnsanlar hâlâ yeni dünyaları bu yolla buluyor. SOHO uzay aracının görüntülerinde keşfedilen 5.000’den fazla kuyruklu yıldızın çoğunu ve NASA’nın WISE teleskobunun görüntülerindeki yaklaşık 3.000 kahverengi cüce adayını gönüllüler fark etti. SPHEREx şimdi yüz milyonlarca cismi tekrar tekrar fotoğraflıyor. Bu, herhangi bir uzman grubunun inceleyebileceğinden çok daha fazlası.</p>
    <p>Hiç astronomi eğitimi almamış birinin gökyüzünde bir nokta seçip orada bir şeyin hareket edip etmediğini ya da değişip değişmediğini kendi gözüyle görebileceği, sonra da bunu tek tıkla bağımsız kaynaklarla karşılaştırabileceği bir araç istedik.</p>
    <p>Güneş Sistemi’nin dış bölgesinde bulunduğu varsayılan, henüz keşfedilmemiş X Gezegeni de böyle bulunabilir. SPHEREx’in onu görüp göremeyeceği belli olmasa da yakındaki bilinmeyen her cisim kendini Plüton’un ele verdiği yolla ele verir: hareket eden bir nokta olarak.</p>
    <h2>Kimler için</h2>
    <ul>
      <li><b>Merak eden herkes.</b> Hesap açmak ya da eğitim almak gerekmez: tur iki dakika sürer ve her cisim, ölçümlerin ne gösterdiğini anlatan birkaç yalın cümleyle açılır.</li>
      <li><b>Öğretmenler ve öğrenciler.</b> Bir sınıf, hareket eden bir yıldızı Plüton’un bulunduğu yöntemle, gerçek NASA görüntülerinde kendisi bulabilir. Tur cihaza kaydedilir ve internet olmadan, altı dilde çalışır.</li>
      <li><b>Amatör gökbilimciler ve araştırmacılar.</b> Seçilen noktanın ölçümleri tablo (CSV) olarak indirilebilir, her poz NASA arşivindeki özgün dosyasına bağlanır, her görünüm bağlantı olarak paylaşılabilir ya da başka bir sayfanın içine yerleştirilebilir.</li>
    </ul>
    <h2>Veriler nereden geliyor</h2>
    <ul>
      <li><b>SPHEREx görüntüleri ve tüm gökyüzü haritası:</b> NASA/JPL-Caltech; NASA/IPAC Kızılötesi Bilim Arşivi (IRSA) sunar.</li>
      <li><b>Öteki gökyüzü haritaları:</b> 2MASS, WISE ve DSS; CDS’in hazırladığı HiPS olarak, IRSA sunar.</li>
      <li><b>Aynı gökyüzünün eski görüntüleri (Yıllar görünümü):</b> 2MASS atlas görüntüleri (1997–2001), WISE ve NEOWISE tekil pozları (2010–2024); IRSA sunar.</li>
      <li><b>Kataloglar:</b> Gaia DR3 (ESA), CatWISE2020, SIMBAD (CDS, Strazburg).</li>
      <li><b>Gökyüzü atlası bileşeni:</b> Aladin Lite (CDS).</li>
      <li><b>Ansiklopedi kartları:</b> Vikipedi; maddeye bağlantıyla birlikte gösterilir.</li>
    </ul>
    <h2>Kod</h2>
    <p>Kodu GitHub’da okuyabilirsiniz: <a href="${TEAM.repo}" target="_blank" rel="noopener">${TEAM.repo.replace('https://', '')}</a>. Tüm hakları saklıdır: ekibin izni olmadan kopyalanamaz, başka yerde kullanılamaz ya da yayınlanamaz.</p>
    <p>Yeni görüntüler ve kısa filmler Instagram’da: <a href="${TEAM.instagram}" target="_blank" rel="noopener">@chronospherex_official</a>.</p>
    <h2>Ziyaret sayısı</h2>
    <p>Kaç kişinin geldiğini ve hangi sitelerden geldiğini bilmek için ziyaretleri <a href="https://www.goatcounter.com/" target="_blank" rel="noopener">GoatCounter</a> ile sayıyoruz. Çerez kullanmaz, IP adresi saklamaz; biz yalnızca toplamları görürüz: sayfalar, ziyaretçilerin geldiği siteler, tarayıcılar ve ülkeler. Reklam engelleyiciniz bunu durdurursa sorun değil.</p>
    <p class="fine">Yukarıdaki sayıların kaynakları: <a href="https://svs.gsfc.nasa.gov/14552/" target="_blank" rel="noopener">SOHO’nun 5.000. kuyruklu yıldızı üzerine NASA</a> · <a href="https://www.backyardworlds.org/" target="_blank" rel="noopener">Backyard Worlds: Planet 9</a></p>`,
  }),
};
