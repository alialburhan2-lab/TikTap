import type { LocalizedText } from "./types";
import { L } from "./helpers";

/**
 * Long-form heritage stories. General reference history, pending editorial review
 * (verification status: unverified). Photo slots stay empty until each image has a
 * confirmed source, licence and correct identification.
 */
export interface StorySection {
  id: string;
  period: LocalizedText;
  title: LocalizedText;
  paragraphs: LocalizedText[];
  /** What a correct, licensed photo for this section must show. */
  photoBrief: LocalizedText;
  relatedSiteSlugs: string[];
}

export interface Story {
  slug: string;
  title: LocalizedText;
  intro: LocalizedText;
  sections: StorySection[];
}

export const STORIES: Story[] = [
  {
    slug: "babylon-civilization",
    title: L("The Civilization of Babylon", "حضارة بابل"),
    intro: L(
      "For almost two thousand years Babylon was one of the great cities of the ancient world. This story follows its history through four themes: the craft of its goldsmiths, the temple of Marduk and its great ziggurat, the cuneiform writing that preserved its laws and literature, and the neighbouring sacred city of Borsippa.",
      "على مدى ما يقارب ألفي عام كانت بابل واحدة من أعظم مدن العالم القديم. تتتبع هذه الصفحة تاريخها عبر أربعة محاور: صناعة الذهب والحليّ، ومعبد مردوخ وزقورته العظيمة، والكتابة المسمارية التي حفظت قوانينها وآدابها، ومدينة بورسيبا المقدسة المجاورة لها.",
    ),
    sections: [
      {
        id: "rise-of-babylon",
        period: L("c. 1894 – 539 BCE", "نحو 1894 – 539 ق.م"),
        title: L("From a small town to the capital of an empire", "من بلدة صغيرة إلى عاصمة إمبراطورية"),
        paragraphs: [
          L(
            "Babylon rose to power under the First Dynasty of Babylon, founded around 1894 BCE. Its sixth king, Hammurabi (reigned c. 1792–1750 BCE), united southern Mesopotamia and issued the law code that bears his name, inscribed on a basalt stele now kept in the Louvre.",
            "صعدت بابل في عهد سلالة بابل الأولى التي تأسست نحو عام 1894 ق.م. ووحّد ملكها السادس حمورابي (حكم نحو 1792–1750 ق.م) جنوب بلاد الرافدين، وأصدر الشريعة التي تحمل اسمه، المنقوشة على مسلّة من البازلت محفوظة اليوم في متحف اللوفر.",
          ),
          L(
            "After the Kassite dynasty (c. 1595–1155 BCE) and long periods under Assyrian rule, Babylon reached its greatest splendour under the Neo-Babylonian kings Nabopolassar and Nebuchadnezzar II (604–562 BCE), who rebuilt the city with the Ishtar Gate, the Processional Way and vast palaces. In 539 BCE the city was taken by Cyrus the Great of Persia, and in 323 BCE Alexander the Great died there.",
            "وبعد حكم الكيشيين (نحو 1595–1155 ق.م) وفترات طويلة من السيطرة الآشورية، بلغت بابل أوج مجدها في عهد الملوك البابليين الجدد نبوبولاصر ونبوخذنصر الثاني (604–562 ق.م)، اللذين أعادا بناء المدينة ببوابة عشتار وشارع الموكب والقصور الكبرى. وفي عام 539 ق.م دخلها كورش الفارسي، وفي عام 323 ق.م توفي فيها الإسكندر المقدوني.",
          ),
        ],
        photoBrief: L("A current photograph of the Babylon archaeological site (original remains distinguished from 1980s reconstruction).", "صورة حديثة لموقع بابل الأثري مع التمييز بين البقايا الأصلية وأعمال إعادة البناء في الثمانينيات."),
        relatedSiteSlugs: ["babylon-ancient-city", "ishtar-gate-area", "processional-way", "lion-of-babylon"],
      },
      {
        id: "goldsmiths",
        period: L("3rd – 1st millennium BCE", "الألف الثالث – الألف الأول ق.م"),
        title: L("Goldsmiths of Mesopotamia", "صاغة الذهب في بلاد الرافدين"),
        paragraphs: [
          L(
            "Mesopotamian jewellers worked gold with remarkable skill, using granulation (tiny gold beads fused onto a surface), filigree and inlay. Lapis lazuli was brought from the mountains of Badakhshan in today's Afghanistan, and carnelian from the Indus region — evidence of long-distance trade networks thousands of years old.",
            "أتقن صاغة بلاد الرافدين العمل بالذهب بمهارة لافتة، فاستخدموا التحبيب (لحام حبيبات ذهبية دقيقة على السطح) والتخريم والترصيع. وكان اللازورد يُجلب من جبال بدخشان في أفغانستان الحالية، والعقيق الأحمر من منطقة وادي السند، وهذا دليل على شبكات تجارة بعيدة المدى عمرها آلاف السنين.",
          ),
          L(
            "Some of the most famous pieces are older than Babylon itself: the gold and lapis necklaces and leaf pendants from the Royal Cemetery of Ur (c. 2600–2400 BCE) belong to Sumerian civilization. From the Old Babylonian period (c. 19th–17th century BCE) comes a hoard of jewellery said to be from Dilbat, near Babylon, with rosette medallions, a crescent pendant of the moon god Sin, a forked lightning symbol of the storm god Adad and small figures of the protective goddess Lama. Many of these objects are today held in museums outside Iraq.",
            "وبعض أشهر القطع أقدم من بابل نفسها؛ فقلائد الذهب واللازورد والمعلّقات الورقية الشكل من المقبرة الملكية في أور (نحو 2600–2400 ق.م) تعود إلى الحضارة السومرية. ومن العصر البابلي القديم (نحو القرنين التاسع عشر والسابع عشر ق.م) وصلت مجموعة حليّ يُنسب العثور عليها إلى دلبات قرب بابل، تضم أوسمة على شكل وردة، ومعلّقاً هلالياً رمزاً لإله القمر سين، ورمز البرق ذا الشعبتين لإله العواصف أدد، وتماثيل صغيرة للإلهة الحامية لاما. وكثير من هذه القطع محفوظ اليوم في متاحف خارج العراق.",
          ),
        ],
        photoBrief: L("Licensed museum photographs with the object's collection, accession number and find site stated (e.g. a museum open-access image). Sumerian pieces from Ur must be captioned as Ur, not Babylon.", "صور متحفية مرخّصة يُذكر فيها اسم المتحف ورقم القطعة ومكان العثور عليها (مثل صور المتاحف المفتوحة الوصول). وقطع أور السومرية يجب أن تُعنون باسم أور لا بابل."),
        relatedSiteSlugs: ["royal-cemetery-of-ur", "iraq-museum", "babylon-ancient-city"],
      },
      {
        id: "esagila-etemenanki",
        period: L("Rebuilt 7th – 6th century BCE", "أُعيد بناؤهما في القرنين السابع والسادس ق.م"),
        title: L("Esagila and Etemenanki: the temple of Marduk and the 'Tower of Babel'", "إيساجيلا وإيتيمينانكي: معبد مردوخ و«برج بابل»"),
        paragraphs: [
          L(
            "At the heart of Babylon stood Esagila, the temple of Marduk, the city's chief god. Beside it rose the ziggurat Etemenanki, 'House of the Foundation of Heaven and Earth'. Ancient sources, including a cuneiform tablet known as the Esagila Tablet, describe a square base of about 91 metres per side; its exact height is debated.",
            "في قلب بابل قام معبد إيساجيلا، بيت مردوخ إله المدينة الأكبر، وإلى جانبه ارتفعت زقورة إيتيمينانكي أي «بيت أساس السماء والأرض». وتصف مصادر قديمة، منها لوح مسماري يُعرف بلوح إيساجيلا، قاعدة مربعة يبلغ طول ضلعها نحو 91 متراً، أما ارتفاعها الدقيق فموضع خلاف بين الباحثين.",
          ),
          L(
            "The ziggurat was completed by Nebuchadnezzar II and is widely linked with the biblical story of the Tower of Babel. It was later dismantled; today visitors see only the outline of its foundations. All images of the complete tower are modern reconstructions — drawings, models and digital renderings based on texts and excavation plans — and should be read as interpretations, not photographs.",
            "أكمل نبوخذنصر الثاني بناء الزقورة، ويربطها كثيرون بقصة برج بابل التوراتية. وقد هُدمت لاحقاً، ولا يرى الزائر اليوم سوى مخطط أساساتها. وجميع صور البرج الكامل هي إعادة تصوّر حديثة من رسوم ونماذج وتصاميم رقمية مبنية على النصوص ومخططات التنقيب، فهي تفسيرات وليست صوراً فوتوغرافية.",
          ),
        ],
        photoBrief: L("A licensed reconstruction drawing or model, clearly captioned 'Artistic reconstruction' with its author — or a current photo of the foundation outline at Babylon.", "رسم أو نموذج إعادة تصوّر مرخّص، مع عنوان واضح «إعادة تصوّر فني» واسم صاحبه، أو صورة حديثة لمخطط الأساسات في بابل."),
        relatedSiteSlugs: ["babylon-ancient-city"],
      },
      {
        id: "cuneiform",
        period: L("c. 3200 BCE – 1st century CE", "نحو 3200 ق.م – القرن الأول الميلادي"),
        title: L("Cuneiform: the writing that preserved Babylon", "المسمارية: الكتابة التي حفظت بابل"),
        paragraphs: [
          L(
            "Writing first appeared in Mesopotamia at Uruk around 3200 BCE and developed into cuneiform — wedge-shaped signs pressed into clay with a reed stylus. The Babylonians wrote mainly in Akkadian, recording laws, letters, contracts, prayers and literature such as the creation epic Enuma Elish and the standard version of the Epic of Gilgamesh.",
            "ظهرت الكتابة أول مرة في بلاد الرافدين في أوروك نحو عام 3200 ق.م، وتطورت إلى الكتابة المسمارية: علامات على شكل أسافين تُضغط في الطين بقلم من القصب. وكتب البابليون أساساً باللغة الأكدية، فدوّنوا القوانين والرسائل والعقود والصلوات والآداب، ومنها ملحمة الخليقة «إينوما إيليش» والنسخة المعيارية من ملحمة جلجامش.",
          ),
          L(
            "Babylonian scholars also developed a sexagesimal (base-60) number system — the origin of our 60 minutes and 360 degrees — and kept astronomical diaries for centuries. Hundreds of thousands of clay tablets survive in museums worldwide, including the Iraq Museum in Baghdad.",
            "وطوّر العلماء البابليون كذلك نظام العدّ الستيني، وهو أصل الدقائق الستين والدرجات الثلاثمئة والستين، ودوّنوا يوميات فلكية على مدى قرون. وقد وصلتنا مئات الآلاف من الألواح الطينية المحفوظة في متاحف العالم، ومنها المتحف العراقي في بغداد.",
          ),
        ],
        photoBrief: L("A licensed photograph of an identified tablet (museum, accession number, content and date in the caption).", "صورة مرخّصة للوح معرّف، يُذكر في عنوانها المتحف ورقم القطعة ومحتواها وتاريخها."),
        relatedSiteSlugs: ["iraq-museum", "uruk", "nippur"],
      },
      {
        id: "borsippa",
        period: L("Ezida rebuilt 6th century BCE", "أُعيد بناء إيزيدا في القرن السادس ق.م"),
        title: L("Borsippa: the city of Nabu", "بورسيبا: مدينة الإله نابو"),
        paragraphs: [
          L(
            "About 17 km south-west of Babylon lies Borsippa (Birs Nimrud), sacred city of Nabu, god of writing and wisdom and son of Marduk. Its temple Ezida and ziggurat were rebuilt by Nebuchadnezzar II, and each New Year the statue of Nabu travelled to Babylon for the Akitu festival.",
            "على بُعد نحو 17 كيلومتراً جنوب غرب بابل تقع بورسيبا (برس نمرود)، المدينة المقدسة للإله نابو، إله الكتابة والحكمة وابن مردوخ. وقد أعاد نبوخذنصر الثاني بناء معبدها إيزيدا وزقورتها، وكان تمثال نابو يُنقل كل عام إلى بابل للمشاركة في احتفالات رأس السنة «أكيتو».",
          ),
          L(
            "The ruined core of its ziggurat still rises above the plain, topped by a mass of vitrified brick that early travellers often mistook for the remains of the Tower of Babel. It remains one of the most striking ancient silhouettes in the Babylon governorate.",
            "ولا يزال لبّ الزقورة المتهدم يرتفع فوق السهل، تعلوه كتلة من الآجر المتزجج ظنها الرحالة الأوائل بقايا برج بابل. وتبقى من أبرز المشاهد الأثرية في محافظة بابل.",
          ),
        ],
        photoBrief: L("A licensed current photograph of the Borsippa ziggurat (Birs Nimrud) with photographer and licence.", "صورة حديثة مرخّصة لزقورة بورسيبا (برس نمرود) مع اسم المصوّر والترخيص."),
        relatedSiteSlugs: ["borsippa"],
      },
    ],
  },
];
