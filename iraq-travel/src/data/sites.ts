import type { Interest, LocalizedText, SiteCategory, TouristSite } from "./types";
import { base, L } from "./helpers";

/**
 * Tourist sites encyclopedia (seed).
 * - Descriptions are general reference summaries pending editorial verification.
 * - Coordinates are approximate (verify against OpenStreetMap before publishing as exact).
 * - Opening hours / entrance fees are intentionally null ("not confirmed / not verified").
 * - Images are empty until an editor attaches verified, licensed photographs via the admin CMS.
 */
type SiteInput = {
  slug: string; gov: string; name: LocalizedText; cats: SiteCategory[]; interests: Interest[];
  summary: LocalizedText; history: LocalizedText; lat: number; lng: number; hours?: number;
  unesco?: TouristSite["unesco"]; featured?: boolean; restrictions?: string;
};

const UNESCO = {
  hatra: { listing: "Hatra", year: 1985, url: "https://whc.unesco.org/en/list/277" },
  ashur: { listing: "Ashur (Qal'at Sherqat)", year: 2003, url: "https://whc.unesco.org/en/list/1130" },
  samarra: { listing: "Samarra Archaeological City", year: 2007, url: "https://whc.unesco.org/en/list/276" },
  erbil: { listing: "Erbil Citadel", year: 2014, url: "https://whc.unesco.org/en/list/1437" },
  ahwar: { listing: "The Ahwar of Southern Iraq: Refuge of Biodiversity and the Relict Landscape of the Mesopotamian Cities", year: 2016, url: "https://whc.unesco.org/en/list/1481" },
  babylon: { listing: "Babylon", year: 2019, url: "https://whc.unesco.org/en/list/278" },
} as const;

const RELIGIOUS_NOTE = "Active place of worship: modest dress is required (women typically need to cover hair; an abaya may be required at shrine entrances). Security checks are standard; cameras and bags may be restricted. Non-Muslim access rules vary — confirm locally.";

function site(i: SiteInput): TouristSite {
  return {
    ...base(`site-${i.slug}`), slug: i.slug, governorateId: i.gov, name: i.name, categories: i.cats, interests: i.interests,
    summary: i.summary, history: i.history, lat: i.lat, lng: i.lng, coordinatesApproximate: true,
    unesco: i.unesco ? { ...i.unesco } : null, images: [], openingHours: null, entranceFee: null,
    visitorRestrictions: i.restrictions ?? null, accessibility: null, accessStatus: "unknown",
    recommendedVisitHours: i.hours ?? 2, sourceIds: i.unesco ? ["src-unesco", "src-mota"] : ["src-mota"],
    verificationStatus: "unverified", lastVerified: null, featured: i.featured ?? false,
  };
}

export const touristSites: TouristSite[] = [
  // ---------------- Baghdad ----------------
  site({ slug: "iraq-museum", gov: "baghdad", cats: ["museum"], interests: ["history", "archaeology", "culture"], lat: 33.3283, lng: 44.387, hours: 3, featured: true,
    name: L("The Iraq Museum (National Museum of Iraq)", "المتحف العراقي", "مۆزەخانەی عێراق", "Musée national d'Irak", "Irakisches Nationalmuseum", "Museo Nacional de Irak"),
    summary: L("Iraq's principal museum, holding Sumerian, Babylonian, Assyrian and Islamic-era collections.", "أهم متاحف العراق، ويضم مجموعات سومرية وبابلية وآشورية وإسلامية."),
    history: L("Established in the 1920s, the museum was looted in 2003; thousands of objects have since been recovered and galleries progressively reopened.", "تأسس في عشرينيات القرن العشرين وتعرّض للنهب عام 2003، واستُعيدت منذ ذلك الحين آلاف القطع وأعيد افتتاح القاعات تدريجياً.") }),
  site({ slug: "al-mutanabbi-street", gov: "baghdad", cats: ["market", "cultural"], interests: ["culture", "history"], lat: 33.3398, lng: 44.3853, hours: 2,
    name: L("Al-Mutanabbi Street", "شارع المتنبي", "شەقامی موتەنەبی", "Rue al-Moutanabbi", "Al-Mutanabbi-Straße", "Calle Al-Mutanabbi"),
    summary: L("Baghdad's historic book market, busiest on Fridays, ending at the Shabandar Café and the Qishla.", "سوق الكتب التاريخي في بغداد، يزدحم أيام الجمعة وينتهي عند مقهى الشابندر والقشلة."),
    history: L("Named after the 10th-century poet al-Mutanabbi, the street has long been the heart of Baghdad's literary life. It was rebuilt after a 2007 bombing.", "سُمّي باسم الشاعر المتنبي (القرن العاشر)، وظل قلب الحياة الأدبية في بغداد، وأعيد بناؤه بعد تفجير عام 2007.") }),
  site({ slug: "abbasid-palace", gov: "baghdad", cats: ["historic_city", "archaeological"], interests: ["history", "archaeology"], lat: 33.3429, lng: 44.3858, hours: 1,
    name: L("Abbasid Palace", "القصر العباسي", "کۆشکی عەباسی", "Palais abbasside", "Abbasidenpalast", "Palacio abasí"),
    summary: L("A brick building on the Tigris with fine muqarnas and arched iwans, from the late Abbasid period.", "مبنى من الطابوق على ضفة دجلة بمقرنصات وأواوين جميلة من أواخر العصر العباسي."),
    history: L("Dated to the late 12th–13th century; scholars debate whether it was a palace or a madrasa.", "يُؤرّخ إلى أواخر القرن الثاني عشر أو الثالث عشر، ويختلف الباحثون حول كونه قصراً أم مدرسة.") }),
  site({ slug: "mustansiriya-madrasa", gov: "baghdad", cats: ["historic_city"], interests: ["history", "culture"], lat: 33.3415, lng: 44.3888, hours: 1,
    name: L("Al-Mustansiriya Madrasa", "المدرسة المستنصرية", "قوتابخانەی موستەنسیریە", "Madrasa al-Mustansiriya", "Mustansiriya-Madrasa", "Madrasa al-Mustansiriya"),
    summary: L("One of the oldest surviving institutions of higher learning in the Islamic world, on the Tigris near Souq al-Saray.", "من أقدم مؤسسات التعليم العالي الباقية في العالم الإسلامي، على ضفة دجلة قرب سوق السراي."),
    history: L("Founded in 1227–1234 CE by the Abbasid caliph al-Mustansir, it taught the four Sunni schools of law alongside medicine and other sciences.", "أسسها الخليفة العباسي المستنصر بالله بين 1227 و1234م، ودُرّست فيها المذاهب الأربعة والطب وعلوم أخرى.") }),
  site({ slug: "taq-kasra", gov: "baghdad", cats: ["archaeological"], interests: ["archaeology", "history"], lat: 33.0937, lng: 44.5807, hours: 1.5,
    name: L("Taq Kasra (Arch of Ctesiphon)", "طاق كسرى", "تاقی کیسرا", "Arc de Ctésiphon", "Taq-e Kisra", "Arco de Ctesifonte"),
    summary: L("The great brick arch of the Sasanian palace at Ctesiphon, near Salman Pak south-east of Baghdad.", "القوس الطابوقي العظيم للقصر الساساني في المدائن قرب سلمان باك جنوب شرق بغداد."),
    history: L("Built around the 6th century CE, it is among the largest single-span unreinforced brick vaults ever constructed. Restoration work has been carried out in recent years.", "بُني نحو القرن السادس الميلادي، ويعدّ من أكبر الأقواس الطابوقية ذات الفتحة الواحدة في التاريخ، وجرت عليه أعمال ترميم في السنوات الأخيرة.") }),

  site({ slug: "aqar-quf", gov: "baghdad", cats: ["archaeological"], interests: ["archaeology", "history"], lat: 33.3536, lng: 44.2026, hours: 1.5,
    name: L("Aqar Quf (Dur-Kurigalzu)", "عقرقوف (دور كوريكالزو)", "عەقەرقووف", "Aqar Quf (Dur-Kurigalzu)", "Aqar Quf (Dur-Kurigalzu)", "Aqar Quf (Dur-Kurigalzu)"),
    summary: L("The mud-brick core of a Kassite ziggurat west of Baghdad, one of the most visible ancient monuments near the capital.", "اللب الطيني لزقورة كيشية غرب بغداد، ومن أبرز المعالم القديمة قرب العاصمة."),
    history: L("Built by the Kassite king Kurigalzu around the 14th century BCE as part of the royal city of Dur-Kurigalzu; reed-mat layers are still visible between the brick courses.", "شيدها الملك الكيشي كوريكالزو نحو القرن الرابع عشر قبل الميلاد ضمن مدينة دور كوريكالزو الملكية، ولا تزال طبقات حصران القصب ظاهرة بين صفوف الطابوق.") }),
  // ---------------- Dhi Qar ----------------
  site({ slug: "ziggurat-of-ur", gov: "dhi-qar", cats: ["archaeological"], interests: ["archaeology", "history", "religious"], lat: 30.9627, lng: 46.1031, hours: 2, featured: true, unesco: UNESCO.ahwar,
    name: L("Ziggurat of Ur", "زقورة أور", "زیگوراتی ئور", "Ziggourat d'Ur", "Zikkurat von Ur", "Zigurat de Ur"),
    summary: L("The best-preserved ziggurat in southern Mesopotamia, built for the moon god Nanna.", "أفضل الزقورات حفظاً في جنوب بلاد الرافدين، شُيّدت لإله القمر نانا."),
    history: L("Built under Ur-Nammu of the Third Dynasty of Ur around the 21st century BCE, its lower stages were partly reconstructed in the 20th century.", "بناها أور-نمو من سلالة أور الثالثة نحو القرن الحادي والعشرين قبل الميلاد، وأعيد بناء أجزاء من طبقاتها السفلى في القرن العشرين.") }),
  site({ slug: "ur", gov: "dhi-qar", cats: ["archaeological"], interests: ["archaeology", "history"], lat: 30.9617, lng: 46.103, hours: 2, featured: true, unesco: UNESCO.ahwar,
    name: L("Ancient City of Ur", "مدينة أور الأثرية", "شاری کۆنی ئور", "Cité antique d'Ur", "Antike Stadt Ur", "Antigua ciudad de Ur"),
    summary: L("Remains of one of Sumer's greatest cities, including residential quarters and temples around the ziggurat.", "بقايا إحدى أعظم مدن سومر، ومنها أحياء سكنية ومعابد حول الزقورة."),
    history: L("Excavated by Leonard Woolley in the 1920s–30s; part of the UNESCO-inscribed Ahwar of Southern Iraq property.", "نقّب فيها ليونارد وولي في عشرينيات وثلاثينيات القرن العشرين، وهي جزء من موقع الأهوار المدرج في اليونسكو.") }),
  site({ slug: "royal-cemetery-of-ur", gov: "dhi-qar", cats: ["archaeological"], interests: ["archaeology", "history"], lat: 30.961, lng: 46.105, hours: 1, unesco: UNESCO.ahwar,
    name: L("Royal Cemetery of Ur", "المقبرة الملكية في أور", "گۆڕستانی شاهانەی ئور", "Cimetière royal d'Ur", "Königsfriedhof von Ur", "Cementerio real de Ur"),
    summary: L("Burial ground where some of the richest finds of Sumerian art were excavated, such as the 'Standard of Ur'.", "مقبرة اكتُشفت فيها أغنى اللقى الفنية السومرية مثل «راية أور»."),
    history: L("Dating to the mid-3rd millennium BCE; most objects are now in museums, and the visible remains are excavated pits and tombs.", "تعود إلى منتصف الألف الثالث قبل الميلاد، ومعظم لقاها اليوم في المتاحف، وما يُرى منها حفر وقبور منقّبة.") }),
  site({ slug: "eridu", gov: "dhi-qar", cats: ["archaeological"], interests: ["archaeology", "history"], lat: 30.8159, lng: 45.9961, hours: 1, unesco: UNESCO.ahwar,
    name: L("Tell Eridu", "تل أبو شهرين (أريدو)", "گردی ئەریدو", "Eridu", "Eridu", "Eridu"),
    summary: L("Desert mound of Eridu, regarded in Sumerian tradition as the first city.", "تلّ أريدو في الصحراء، وتعدّها التقاليد السومرية أول مدينة."),
    history: L("Its temple sequence spans thousands of years of Mesopotamian religious architecture. The site is remote; access usually requires a local guide and permission.", "تمتد سلسلة معابدها آلاف السنين من العمارة الدينية الرافدينية. الموقع نائي ويتطلب عادة دليلاً محلياً وموافقة."), restrictions: "Remote desert site. Access arrangements not confirmed — check with local antiquities authorities." }),
  site({ slug: "lagash", gov: "dhi-qar", cats: ["archaeological"], interests: ["archaeology", "history"], lat: 31.4136, lng: 46.4061, hours: 1,
    name: L("Lagash (Al-Hiba)", "لكش (تل الهبة)", "لەگەش", "Lagash", "Lagasch", "Lagash"),
    summary: L("One of the largest Sumerian city-states, the subject of ongoing international excavations.", "من أكبر دويلات المدن السومرية، وتجري فيها تنقيبات دولية مستمرة."),
    history: L("Lagash rivalled Umma and Ur in the 3rd millennium BCE; recent excavations have uncovered a public eating area dating back about 4,700 years.", "نافست لكش أُمّا وأور في الألف الثالث قبل الميلاد، وكشفت التنقيبات الحديثة عن مكان طعام عام يعود إلى نحو 4700 عام."), restrictions: "Active excavation site — visits may require prior permission." }),
  site({ slug: "girsu", gov: "dhi-qar", cats: ["archaeological"], interests: ["archaeology", "history"], lat: 31.5486, lng: 46.1747, hours: 1,
    name: L("Girsu (Tello)", "جرسو (تلّو)", "گیرسو", "Girsu (Tello)", "Girsu (Tello)", "Girsu (Tello)"),
    summary: L("Religious capital of the state of Lagash, famous for the statues of Gudea.", "العاصمة الدينية لدولة لكش، اشتهرت بتماثيل كوديا."),
    history: L("Excavated from the 1870s; recent work has re-examined its temple of Ningirsu.", "نُقّب فيها منذ سبعينيات القرن التاسع عشر، وأعادت أعمال حديثة دراسة معبد ننجرسو."), restrictions: "Active excavation site — visits may require prior permission." }),
  site({ slug: "central-marshes", gov: "dhi-qar", cats: ["natural", "cultural"], interests: ["nature", "culture"], lat: 30.98, lng: 47.0, hours: 4, featured: true, unesco: UNESCO.ahwar,
    name: L("Mesopotamian Marshes (Central Marshes)", "الأهوار (الأهوار الوسطى)", "زۆنگاوەکانی میزۆپۆتامیا", "Marais de Mésopotamie", "Mesopotamische Sümpfe", "Marismas de Mesopotamia"),
    summary: L("Wetlands of reed beds, water buffalo and mashoof boats, part of the UNESCO-listed Ahwar of Southern Iraq.", "أراضٍ رطبة من القصب والجاموس والمشاحيف، جزء من موقع الأهوار المدرج في اليونسكو."),
    history: L("Largely drained in the 1990s and partly re-flooded after 2003, the marshes are sensitive to drought and water levels vary greatly by year and season.", "جُففت معظمها في التسعينيات وأعيد غمر أجزاء منها بعد 2003، وهي حساسة للجفاف وتتفاوت مناسيب المياه كثيراً بحسب السنة والموسم."), restrictions: "Water levels and boat availability vary with drought conditions; confirm locally." }),
  site({ slug: "al-chibayish", gov: "dhi-qar", cats: ["natural", "cultural"], interests: ["nature", "culture", "food"], lat: 30.95, lng: 47.03, hours: 4,
    name: L("Al-Chibayish", "الجبايش", "چەبایش", "Al-Chibayish", "Al-Chibayish", "Al-Chibayish"),
    summary: L("Marsh town and the usual starting point for boat trips into the Central Marshes and visits to reed mudhifs.", "بلدة في الأهوار ونقطة الانطلاق المعتادة لرحلات القوارب في الأهوار الوسطى وزيارة المضايف القصبية."),
    history: L("Communities here maintain Marsh Arab traditions including reed architecture and buffalo herding.", "تحافظ المجتمعات هنا على تقاليد عرب الأهوار ومنها العمارة القصبية وتربية الجاموس.") }),

  site({ slug: "nippur", gov: "qadisiyah", cats: ["archaeological", "religious"], interests: ["archaeology", "history", "religious"], lat: 32.127, lng: 45.233, hours: 1.5,
    restrictions: "Remote archaeological site; access arrangements not confirmed — check with local antiquities authorities.",
    name: L("Nippur (Nuffar)", "نفّر (نيبور)", "نیپوور", "Nippur", "Nippur", "Nippur"),
    summary: L("The sacred city of the god Enlil, one of the most important religious centres of ancient Mesopotamia.", "مدينة الإله إنليل المقدسة، ومن أهم المراكز الدينية في بلاد الرافدين القديمة."),
    history: L("Excavations since the 19th century recovered tens of thousands of cuneiform tablets here, including major Sumerian literary texts.", "كشفت التنقيبات منذ القرن التاسع عشر عن عشرات الآلاف من الألواح المسمارية، ومنها نصوص أدبية سومرية مهمة.") }),
  site({ slug: "wasit-ancient-city", gov: "wasit", cats: ["archaeological"], interests: ["archaeology", "history"], lat: 32.181, lng: 46.302, hours: 1.5,
    restrictions: "Remote archaeological site; access arrangements not confirmed.",
    name: L("Ancient Wasit", "مدينة واسط الأثرية", "واستی کۆن", "Wasit antique", "Antikes Wasit", "Antigua Wasit"),
    summary: L("Ruins of the early Islamic city founded by al-Hajjaj, including the remains of its great mosque and a later minaret gateway.", "أطلال المدينة الإسلامية المبكرة التي أسسها الحجاج، ومنها بقايا جامعها الكبير وبوابة المنارة اللاحقة."),
    history: L("Founded around 702 CE midway between Kufa and Basra, Wasit was a major administrative city until the Tigris shifted its course.", "تأسست نحو عام 702م في منتصف الطريق بين الكوفة والبصرة، وظلت مدينة إدارية كبرى حتى تغيّر مجرى دجلة.") }),
  // ---------------- Muthanna ----------------
  site({ slug: "uruk", gov: "muthanna", cats: ["archaeological"], interests: ["archaeology", "history"], lat: 31.324, lng: 45.637, hours: 2, unesco: UNESCO.ahwar,
    name: L("Uruk (Warka)", "الوركاء (أوروك)", "ئوروک", "Uruk", "Uruk", "Uruk"),
    summary: L("City of Gilgamesh and one of the first true cities, where early writing appeared.", "مدينة جلجامش ومن أوائل المدن الحقيقية، حيث ظهرت الكتابة المبكرة."),
    history: L("Uruk reached a population in the tens of thousands in the late 4th millennium BCE; the Eanna and Anu precincts remain visible as eroded mud-brick ruins.", "بلغ عدد سكان أوروك عشرات الآلاف في أواخر الألف الرابع قبل الميلاد، ولا تزال منطقتا إينا وآنو ظاهرتين كأطلال طينية متآكلة."), restrictions: "Remote desert site; local guide recommended." }),

  // ---------------- Babylon ----------------
  site({ slug: "babylon-ancient-city", gov: "babylon", cats: ["archaeological"], interests: ["archaeology", "history"], lat: 32.5422, lng: 44.4211, hours: 3, featured: true, unesco: UNESCO.babylon,
    name: L("Ancient Babylon", "مدينة بابل الأثرية", "بابلی کۆن", "Babylone antique", "Antikes Babylon", "Antigua Babilonia"),
    summary: L("The ruins of one of antiquity's most famous cities, inscribed on the World Heritage List in 2019.", "أطلال واحدة من أشهر مدن العالم القديم، أدرجت على قائمة التراث العالمي عام 2019."),
    history: L("Capital of Hammurabi and Nebuchadnezzar II. Parts of the site were reconstructed in the 1980s, which visitors should distinguish from original remains.", "عاصمة حمورابي ونبوخذنصر الثاني. أعيد بناء أجزاء من الموقع في الثمانينيات، وينبغي التمييز بينها وبين البقايا الأصلية.") }),
  site({ slug: "ishtar-gate-area", gov: "babylon", cats: ["archaeological"], interests: ["archaeology", "history"], lat: 32.5436, lng: 44.421, hours: 1, unesco: UNESCO.babylon,
    name: L("Ishtar Gate archaeological area", "منطقة بوابة عشتار", "ناوچەی دەروازەی عەشتار", "Zone de la porte d'Ishtar", "Bereich des Ischtar-Tors", "Zona de la Puerta de Ishtar"),
    summary: L("The excavated foundations of the Ishtar Gate with original relief bricks of bulls and dragons; a replica gate stands at the entrance.", "أسس بوابة عشتار المنقّبة مع آجرّ أصلي بنقوش الثيران والتنانين، وتقف نسخة مقلدة من البوابة عند المدخل."),
    history: L("The glazed upper gate was removed in the early 20th century and is reconstructed in Berlin's Pergamon Museum; the lower foundations remain in situ.", "نُقلت البوابة المزججة العليا في أوائل القرن العشرين وأعيد بناؤها في متحف بيرغامون ببرلين، وبقيت الأسس السفلى في مكانها.") }),
  site({ slug: "lion-of-babylon", gov: "babylon", cats: ["archaeological"], interests: ["archaeology", "history"], lat: 32.545, lng: 44.4217, hours: 0.5, unesco: UNESCO.babylon,
    name: L("Lion of Babylon", "أسد بابل", "شێری بابل", "Lion de Babylone", "Löwe von Babylon", "León de Babilonia"),
    summary: L("A large basalt statue of a lion standing over a human figure, a symbol of Babylon.", "تمثال كبير من البازلت لأسد يعلو شخصاً، وهو رمز لبابل."),
    history: L("Found in 1876; its date and origin are debated by scholars.", "عُثر عليه عام 1876، ويختلف الباحثون في تاريخه وأصله.") }),
  site({ slug: "processional-way", gov: "babylon", cats: ["archaeological"], interests: ["archaeology", "history"], lat: 32.544, lng: 44.4212, hours: 0.5, unesco: UNESCO.babylon,
    name: L("Processional Way", "شارع الموكب", "ڕێگای کاروان", "Voie processionnelle", "Prozessionsstraße", "Vía Procesional"),
    summary: L("The ceremonial road that led through the Ishtar Gate during New Year (Akitu) festivals.", "الطريق الاحتفالي الذي كان يمر عبر بوابة عشتار خلال احتفالات رأس السنة (أكيتو)."),
    history: L("Built under Nebuchadnezzar II; sections of the original paving and walls survive.", "شُيّد في عهد نبوخذنصر الثاني، ولا تزال أجزاء من رصفه وجدرانه الأصلية قائمة.") }),

  // ---------------- Najaf ----------------
  site({ slug: "imam-ali-shrine", gov: "najaf", cats: ["religious"], interests: ["religious", "culture", "history"], lat: 31.9961, lng: 44.3143, hours: 2, featured: true, restrictions: RELIGIOUS_NOTE,
    name: L("Imam Ali Shrine", "العتبة العلوية المقدسة (مرقد الإمام علي)", "مەرقەدی ئیمام عەلی", "Mausolée de l'imam Ali", "Imam-Ali-Schrein", "Santuario del Imán Alí"),
    summary: L("The golden-domed shrine of Imam Ali ibn Abi Talib, one of the most visited pilgrimage sites in the world.", "مرقد الإمام علي بن أبي طالب ذو القبة الذهبية، من أكثر مواقع الزيارة استقبالاً للزوار في العالم."),
    history: L("The shrine has been rebuilt and expanded many times; the current structure largely dates from the Safavid era with major modern extensions.", "أعيد بناء المرقد وتوسيعه مرات عديدة، ويعود معظم البناء الحالي إلى العهد الصفوي مع توسعات حديثة كبيرة.") }),
  site({ slug: "wadi-al-salam", gov: "najaf", cats: ["religious", "historic_city"], interests: ["religious", "history"], lat: 32.01, lng: 44.32, hours: 1, restrictions: "Active cemetery — behave respectfully; photography of funerals is inappropriate.",
    name: L("Wadi al-Salam Cemetery", "مقبرة وادي السلام", "گۆڕستانی وادی سەلام", "Cimetière de Wadi al-Salam", "Friedhof Wadi as-Salam", "Cementerio de Wadi al-Salam"),
    summary: L("One of the largest cemeteries in the world, adjoining the old city of Najaf.", "من أكبر المقابر في العالم، ملاصقة للمدينة القديمة في النجف."),
    history: L("Used for burials for well over a thousand years; it contains the tombs of prophets venerated in Islamic tradition.", "تُستخدم للدفن منذ أكثر من ألف عام، وفيها مراقد أنبياء يجلّهم التقليد الإسلامي.") }),
  site({ slug: "great-mosque-of-kufa", gov: "najaf", cats: ["religious", "historic_city"], interests: ["religious", "history"], lat: 32.0287, lng: 44.4007, hours: 1.5, restrictions: RELIGIOUS_NOTE,
    name: L("Great Mosque of Kufa", "مسجد الكوفة", "مزگەوتی گەورەی کووفە", "Grande mosquée de Koufa", "Große Moschee von Kufa", "Gran Mezquita de Kufa"),
    summary: L("One of the earliest mosques in Islam, where Imam Ali was struck in 661 CE.", "من أقدم المساجد في الإسلام، وفيه ضُرب الإمام علي عام 661م."),
    history: L("Built in the 7th century CE when Kufa was founded as a garrison city; it has been extensively rebuilt.", "بُني في القرن السابع الميلادي عند تأسيس الكوفة معسكراً، وأعيد بناؤه مرات كثيرة.") }),
  site({ slug: "dar-al-imara", gov: "najaf", cats: ["archaeological"], interests: ["archaeology", "history"], lat: 32.0283, lng: 44.4013, hours: 0.5,
    name: L("Dar al-Imara (Kufa)", "دار الإمارة في الكوفة", "دارولئیمارە", "Dar al-Imara", "Dar al-Imara", "Dar al-Imara"),
    summary: L("Excavated foundations of the governor's palace beside the Kufa Mosque.", "أسس قصر الإمارة المنقّبة بجوار مسجد الكوفة."),
    history: L("The early Islamic seat of government in Kufa; the visible remains are low walls revealed by excavation.", "مقر الحكم في الكوفة في صدر الإسلام، وما يظهر منه جدران منخفضة كشفتها التنقيبات.") }),

  // ---------------- Karbala ----------------
  site({ slug: "imam-hussein-shrine", gov: "karbala", cats: ["religious"], interests: ["religious", "culture", "history"], lat: 32.6164, lng: 44.0324, hours: 2, featured: true, restrictions: RELIGIOUS_NOTE,
    name: L("Imam Hussein Shrine", "العتبة الحسينية المقدسة", "مەرقەدی ئیمام حوسێن", "Mausolée de l'imam Hussein", "Imam-Hussein-Schrein", "Santuario del Imán Husein"),
    summary: L("Shrine of Imam Hussein ibn Ali, centre of the Ashura and Arbaeen pilgrimages.", "مرقد الإمام الحسين بن علي، ومحور زيارتي عاشوراء والأربعين."),
    history: L("Built over the burial site of Imam Hussein, killed at the Battle of Karbala in 680 CE.", "شُيّد فوق موضع دفن الإمام الحسين الذي استشهد في واقعة الطف عام 680م.") }),
  site({ slug: "al-abbas-shrine", gov: "karbala", cats: ["religious"], interests: ["religious", "culture"], lat: 32.6158, lng: 44.0352, hours: 1.5, restrictions: RELIGIOUS_NOTE,
    name: L("Al-Abbas Shrine", "العتبة العباسية المقدسة", "مەرقەدی عەباس", "Mausolée d'al-Abbas", "Al-Abbas-Schrein", "Santuario de al-Abbas"),
    summary: L("Shrine of Al-Abbas ibn Ali, facing the Imam Hussein Shrine across the Bayn al-Haramayn plaza.", "مرقد أبي الفضل العباس بن علي، مقابل مرقد الإمام الحسين عبر ساحة ما بين الحرمين."),
    history: L("Al-Abbas was Imam Hussein's half-brother and standard-bearer at Karbala.", "العباس أخو الإمام الحسين وحامل لوائه في كربلاء.") }),
  site({ slug: "al-ukhaidir", gov: "karbala", cats: ["archaeological"], interests: ["archaeology", "history"], lat: 32.4388, lng: 43.6017, hours: 1.5,
    name: L("Al-Ukhaidir Fortress", "حصن الأخيضر", "قەڵای ئوخەیدر", "Forteresse d'Ukhaidir", "Festung al-Uchaidir", "Fortaleza de Ujaidir"),
    summary: L("A massive early Abbasid desert palace-fortress with tall walls, vaults and courtyards.", "قصر-حصن صحراوي ضخم من أوائل العصر العباسي بأسوار عالية وأقبية وأفنية."),
    history: L("Generally dated to around 775 CE; an important example of early Islamic architecture.", "يؤرّخ عموماً بنحو عام 775م، وهو نموذج مهم للعمارة الإسلامية المبكرة.") }),
  site({ slug: "lake-razzaza", gov: "karbala", cats: ["natural"], interests: ["nature"], lat: 32.7, lng: 43.65, hours: 2,
    name: L("Lake Razzaza", "بحيرة الرزازة", "دەریاچەی ڕەززازە", "Lac Razzaza", "Razzaza-See", "Lago Razzaza"),
    summary: L("A large desert lake west of Karbala whose water level has declined significantly in recent years.", "بحيرة صحراوية كبيرة غرب كربلاء تراجع منسوب مياهها كثيراً في السنوات الأخيرة."),
    history: L("Formed as part of a water-management depression; it is an important but stressed wetland for birds.", "تكوّنت ضمن منخفض لتصريف المياه، وهي أرض رطبة مهمة للطيور لكنها تعاني ضغطاً بيئياً.") }),

  // ---------------- Erbil ----------------
  site({ slug: "erbil-citadel", gov: "erbil", cats: ["historic_city", "archaeological"], interests: ["history", "archaeology", "culture"], lat: 36.1912, lng: 44.0092, hours: 2, featured: true, unesco: UNESCO.erbil,
    name: L("Erbil Citadel", "قلعة أربيل", "قەڵای هەولێر", "Citadelle d'Erbil", "Zitadelle von Erbil", "Ciudadela de Erbil"),
    summary: L("A fortified settlement atop a tell in the heart of Erbil, inscribed on the World Heritage List in 2014.", "مستوطنة محصنة فوق تل في قلب أربيل، أدرجت على قائمة التراث العالمي عام 2014."),
    history: L("The mound has been occupied for millennia; the citadel houses a textile museum and is undergoing long-term restoration.", "سُكن التل منذ آلاف السنين، وتضم القلعة متحفاً للمنسوجات وتخضع لأعمال ترميم طويلة الأمد.") }),
  site({ slug: "sami-abdulrahman-park", gov: "erbil", cats: ["park"], interests: ["nature", "entertainment"], lat: 36.198, lng: 43.989, hours: 2,
    name: L("Sami Abdulrahman Park", "متنزه سامي عبد الرحمن", "پارکی سامی عەبدولڕەحمان", "Parc Sami Abdulrahman", "Sami-Abdulrahman-Park", "Parque Sami Abdulrahman"),
    summary: L("Erbil's largest public park, with lakes, walking paths and family areas.", "أكبر حديقة عامة في أربيل، فيها بحيرات وممرات للمشي ومناطق عائلية."),
    history: L("Built on the site of a former military base and named after the Kurdish politician Sami Abdulrahman.", "أنشئت على موقع قاعدة عسكرية سابقة وسُمّيت باسم السياسي الكردي سامي عبد الرحمن.") }),

  // ---------------- Duhok ----------------
  site({ slug: "amedi", gov: "duhok", cats: ["historic_city", "natural"], interests: ["history", "nature", "culture"], lat: 37.0925, lng: 43.487, hours: 3,
    name: L("Amedi (Amadiya)", "العمادية", "ئامێدی", "Amadiya", "Amadiya", "Amadiya"),
    summary: L("A historic town perched on a flat-topped mountain, with the old Bab Zebar gate and dramatic valley views.", "بلدة تاريخية فوق جبل مسطح القمة، فيها باب زيبار القديم وإطلالات خلابة على الوادي."),
    history: L("Amedi was the seat of the Bahdinan emirate and has been home to Muslim, Christian and Jewish communities.", "كانت مقر إمارة بهدينان وسكنتها مجتمعات مسلمة ومسيحية ويهودية.") }),
  site({ slug: "lalish", gov: "duhok", cats: ["religious"], interests: ["religious", "culture"], lat: 36.766, lng: 43.299, hours: 2,
    restrictions: "Holiest site of the Yazidi faith. Visitors customarily remove shoes within the sanctuary area; ask before photographing people.",
    name: L("Lalish", "لالش", "لالش", "Lalish", "Lalisch", "Lalish"),
    summary: L("The sacred valley and temple of Sheikh Adi, the holiest place for Yazidis.", "الوادي المقدس ومعبد الشيخ عدي، أقدس مكان لدى الإيزيديين."),
    history: L("Pilgrims gather here especially for the autumn Jema'iyye feast. Visitors should follow the guidance of temple custodians.", "يجتمع الحجاج هنا خصوصاً في عيد الجماعية الخريفي، وعلى الزوار اتباع إرشادات سدنة المعبد.") }),
  site({ slug: "sarsang", gov: "duhok", cats: ["natural"], interests: ["nature", "entertainment"], lat: 37.05, lng: 43.345, hours: 3,
    name: L("Sarsang", "سرسنك", "سەرسنگ", "Sarsang", "Sarsang", "Sarsang"),
    summary: L("A mountain resort area popular in summer for its cooler climate, springs and valleys.", "منطقة مصايف جبلية مقصودة صيفاً لاعتدال مناخها وينابيعها وأوديتها."),
    history: L("A traditional summer retreat for families from the plains of Iraq.", "مصيف تقليدي للعائلات القادمة من سهول العراق.") }),

  // ---------------- Sulaymaniyah ----------------
  site({ slug: "sulaymaniyah-museum", gov: "sulaymaniyah", cats: ["museum"], interests: ["history", "archaeology", "culture"], lat: 35.56, lng: 45.433, hours: 2,
    name: L("Sulaymaniyah Museum", "متحف السليمانية", "مۆزەخانەی سلێمانی", "Musée de Souleimaniye", "Museum Sulaimaniyya", "Museo de Solimania"),
    summary: L("The second-largest museum in Iraq, with prehistoric to Islamic-era collections.", "ثاني أكبر متحف في العراق، يضم مجموعات من عصور ما قبل التاريخ حتى العصر الإسلامي."),
    history: L("Founded in 1961, it holds many objects from excavations in the Kurdistan Region.", "تأسس عام 1961 ويضم قطعاً كثيرة من تنقيبات إقليم كردستان.") }),
  site({ slug: "lake-dukan", gov: "sulaymaniyah", cats: ["natural"], interests: ["nature", "entertainment"], lat: 35.95, lng: 44.95, hours: 4,
    name: L("Lake Dukan", "بحيرة دوكان", "دەریاچەی دوکان", "Lac de Doukan", "Dukan-See", "Lago Dukan"),
    summary: L("A large reservoir on the Little Zab surrounded by hills, popular for weekend outings.", "خزان مائي كبير على الزاب الصغير تحيط به التلال، مقصد شائع لنزهات نهاية الأسبوع."),
    history: L("Created by the Dukan Dam, completed in 1959.", "تكوّنت بإنشاء سد دوكان الذي اكتمل عام 1959.") }),
  site({ slug: "ahmad-awa", gov: "sulaymaniyah", cats: ["natural"], interests: ["nature"], lat: 35.297, lng: 46.047, hours: 3,
    name: L("Ahmad Awa Waterfall", "شلال أحمد آوا", "تاڤگەی ئەحمەد ئاوا", "Cascade d'Ahmad Awa", "Ahmad-Awa-Wasserfall", "Cascada de Ahmad Awa"),
    summary: L("A mountain waterfall and gorge near the Iranian border, a popular hiking spot.", "شلال وأخدود جبلي قرب الحدود الإيرانية، مقصد شائع للمشي."),
    history: L("Located in the Hawraman area; access roads are close to the border.", "يقع في منطقة هورامان، وطرق الوصول قريبة من الحدود."), restrictions: "Close to the international border — check current advisories before visiting." }),

  // ---------------- Nineveh ----------------
  site({ slug: "hatra", gov: "nineveh", cats: ["archaeological"], interests: ["archaeology", "history"], lat: 35.5875, lng: 42.7183, hours: 2, featured: true, unesco: UNESCO.hatra,
    name: L("Hatra", "الحضر", "هەترا", "Hatra", "Hatra", "Hatra"),
    summary: L("A fortified Parthian-era city with temples blending Hellenistic, Roman and Arab elements.", "مدينة محصنة من العهد الفرثي، معابدها تمزج بين العناصر الهلنستية والرومانية والعربية."),
    history: L("Hatra resisted Roman sieges in the 2nd century CE. The site was damaged in 2015; it is on UNESCO's List of World Heritage in Danger.", "صمدت الحضر أمام الحصار الروماني في القرن الثاني الميلادي، وتضررت عام 2015، وهي مدرجة على قائمة التراث العالمي المعرض للخطر."), restrictions: "Access may require permits; check current status before planning." }),
  site({ slug: "nimrud", gov: "nineveh", cats: ["archaeological"], interests: ["archaeology", "history"], lat: 36.0986, lng: 43.3289, hours: 1.5,
    name: L("Nimrud (Kalhu)", "النمرود (كالخو)", "نەمروود", "Nimroud", "Nimrud", "Nimrud"),
    summary: L("Assyrian royal capital known for its palace reliefs and ivories.", "عاصمة آشورية ملكية اشتهرت بمنحوتات قصورها وعاجياتها."),
    history: L("Capital under Ashurnasirpal II (9th century BCE). Much of the site was deliberately destroyed in 2015; restoration and documentation are ongoing.", "كانت عاصمة في عهد آشورناصربال الثاني (القرن التاسع ق.م)، ودُمّر جزء كبير منها عمداً عام 2015، وتجري أعمال توثيق وترميم."), restrictions: "Access may require permits; check current status before planning." }),
  site({ slug: "nineveh-ancient-city", gov: "nineveh", cats: ["archaeological"], interests: ["archaeology", "history"], lat: 36.3594, lng: 43.1528, hours: 2,
    name: L("Ancient Nineveh", "نينوى الأثرية", "نەینەوای کۆن", "Ninive antique", "Antikes Ninive", "Antigua Nínive"),
    summary: L("The ruins of the Assyrian capital on the east bank of the Tigris in Mosul, with reconstructed city gates.", "أطلال العاصمة الآشورية على الضفة الشرقية لدجلة في الموصل، مع بوابات مدينة معاد بناؤها."),
    history: L("Capital of Sennacherib and Ashurbanipal, whose library of clay tablets is one of the great discoveries of archaeology.", "عاصمة سنحاريب وآشوربانيبال الذي تعدّ مكتبته من الألواح الطينية من أعظم الاكتشافات الأثرية.") }),
  site({ slug: "old-mosul", gov: "nineveh", cats: ["historic_city", "religious"], interests: ["history", "culture", "religious"], lat: 36.3412, lng: 43.129, hours: 3,
    name: L("Old City of Mosul", "الموصل القديمة", "مووسڵی کۆن", "Vieille ville de Mossoul", "Altstadt von Mossul", "Ciudad vieja de Mosul"),
    summary: L("The historic city on the west bank of the Tigris, including the Al-Nuri Mosque and its rebuilt al-Hadba minaret, and historic churches.", "المدينة التاريخية على الضفة الغربية لدجلة، ومنها جامع النوري ومئذنة الحدباء المعاد بناؤها والكنائس التاريخية."),
    history: L("Heavily damaged in 2017, the old city has been the focus of large reconstruction projects, including UNESCO's 'Revive the Spirit of Mosul'.", "تعرضت لدمار كبير عام 2017 وكانت محور مشاريع إعادة إعمار كبرى منها مبادرة اليونسكو «إحياء روح الموصل».") }),

  // ---------------- Salah al-Din ----------------
  site({ slug: "great-mosque-of-samarra", gov: "salah-al-din", cats: ["archaeological", "religious"], interests: ["archaeology", "history", "religious"], lat: 34.2059, lng: 43.8789, hours: 1.5, featured: true, unesco: UNESCO.samarra,
    name: L("Great Mosque of Samarra", "الجامع الكبير في سامراء", "مزگەوتی گەورەی سامەڕا", "Grande mosquée de Samarra", "Große Moschee von Samarra", "Gran Mezquita de Samarra"),
    summary: L("The vast 9th-century Abbasid mosque enclosure, once the largest mosque in the world.", "حرم الجامع العباسي الضخم من القرن التاسع، وكان يوماً أكبر مسجد في العالم."),
    history: L("Built by Caliph al-Mutawakkil around 848–852 CE; its outer walls survive.", "بناه الخليفة المتوكل نحو 848–852م، ولا تزال أسواره الخارجية قائمة.") }),
  site({ slug: "malwiya-minaret", gov: "salah-al-din", cats: ["archaeological"], interests: ["archaeology", "history"], lat: 34.2072, lng: 43.8796, hours: 1, unesco: UNESCO.samarra,
    name: L("Malwiya Minaret", "المئذنة الملوية", "منارەی مەلویە", "Minaret Malwiya", "Malwiya-Minarett", "Minarete Malwiya"),
    summary: L("The famous spiral minaret of the Great Mosque of Samarra, about 52 metres high.", "المئذنة الحلزونية الشهيرة للجامع الكبير في سامراء، بارتفاع نحو 52 متراً."),
    history: L("Its spiral ramp design is unique in Islamic architecture. Climbing it may be restricted — confirm on site.", "تصميمها الحلزوني فريد في العمارة الإسلامية. قد يكون الصعود مقيداً — تأكد في الموقع."), restrictions: "Climbing may be restricted; no guard rails on the ramp." }),
  site({ slug: "ashur", gov: "salah-al-din", cats: ["archaeological"], interests: ["archaeology", "history"], lat: 35.4567, lng: 43.2622, hours: 1.5, unesco: UNESCO.ashur,
    name: L("Ashur (Qal'at Sherqat)", "آشور (قلعة الشرقاط)", "ئاشوور", "Assour", "Assur", "Asur"),
    summary: L("The first capital and religious centre of Assyria, on the Tigris.", "العاصمة الأولى والمركز الديني لآشور، على نهر دجلة."),
    history: L("Inscribed in 2003 and placed on the List of World Heritage in Danger the same year.", "أدرجت عام 2003 ووضعت في العام نفسه على قائمة التراث العالمي المعرض للخطر."), restrictions: "Access may require permits; check current status before planning." }),

  // ---------------- Kirkuk ----------------
  site({ slug: "kirkuk-citadel", gov: "kirkuk", cats: ["historic_city", "archaeological"], interests: ["history", "archaeology"], lat: 35.4688, lng: 44.3956, hours: 1.5,
    name: L("Kirkuk Citadel", "قلعة كركوك", "قەڵای کەرکووک", "Citadelle de Kirkouk", "Zitadelle von Kirkuk", "Ciudadela de Kirkuk"),
    summary: L("A historic mound above the Khasa river with old houses, mosques and the tomb traditionally associated with the Prophet Daniel.", "تل تاريخي فوق نهر الخاصة فيه بيوت قديمة ومساجد ومرقد ينسب تقليدياً إلى النبي دانيال."),
    history: L("Occupied since ancient times; restoration has been undertaken in parts of the citadel.", "مأهولة منذ العصور القديمة، وأجريت أعمال ترميم في أجزاء من القلعة.") }),

  // ---------------- Basra ----------------
  site({ slug: "shatt-al-arab", gov: "basra", cats: ["natural"], interests: ["nature", "culture"], lat: 30.53, lng: 47.83, hours: 2,
    name: L("Shatt al-Arab", "شط العرب", "شەتولعەرەب", "Chatt-el-Arab", "Schatt al-Arab", "Shatt al-Arab"),
    summary: L("The river formed by the Tigris and Euphrates, lined with date-palm groves; boat rides depart from Basra.", "النهر المتكون من التقاء دجلة والفرات، تحفّه بساتين النخيل، وتنطلق جولات القوارب من البصرة."),
    history: L("Historically a vital trade artery linking Basra to the Gulf.", "شريان تجاري حيوي تاريخياً يربط البصرة بالخليج.") }),
  site({ slug: "basra-corniche", gov: "basra", cats: ["park", "cultural"], interests: ["entertainment", "food", "culture"], lat: 30.512, lng: 47.827, hours: 2,
    name: L("Basra Corniche", "كورنيش البصرة", "کۆرنیشی بەسرە", "Corniche de Bassorah", "Corniche von Basra", "Corniche de Basora"),
    summary: L("A riverside promenade along the Shatt al-Arab, lively in the evenings, with statues of Iraqi poets.", "ممشى نهري على شط العرب يعجّ بالحياة مساءً، وفيه تماثيل لشعراء عراقيين."),
    history: L("Features the well-known statue of the poet Badr Shakir al-Sayyab.", "يضم تمثال الشاعر بدر شاكر السياب المعروف.") }),
  site({ slug: "al-faw", gov: "basra", cats: ["natural"], interests: ["nature"], lat: 29.9758, lng: 48.4722, hours: 2,
    name: L("Al-Faw Peninsula", "شبه جزيرة الفاو", "نیمچەدوورگەی فاو", "Péninsule de Fao", "Halbinsel Fao", "Península de Fao"),
    summary: L("Iraq's southernmost point at the mouth of the Shatt al-Arab, site of the Grand Faw Port project.", "أقصى نقطة في جنوب العراق عند مصب شط العرب، وفيها مشروع ميناء الفاو الكبير."),
    history: L("A strategic area historically and the scene of heavy fighting in the 1980s.", "منطقة استراتيجية تاريخياً وشهدت معارك عنيفة في الثمانينيات."), restrictions: "Port and border-area security zones — photography of infrastructure may be prohibited." }),
];
