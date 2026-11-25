const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { connectDB } = require('../config/db');
const Knowledge = require('../models/Knowledge');

const curatedKnowledge = [
  // ================= DOSHAS =================
  {
    title: 'The Three Doshas: Vata, Pitta, and Kapha',
    sanskritName: 'Tridosha Siddhanta',
    category: 'Doshas',
    doshaAffinity: 'Tridoshic',
    description: 'The foundation of Ayurvedic philosophy rests on the Tridosha doctrine: three functional bio-energies derived from the five universal elements (Pancha Mahabhutas). Vata (Space & Air) governs movement, nervous conduction, and respiration; Pitta (Fire & Water) directs digestion, metabolism, and thermoregulation; Kapha (Water & Earth) sustains structural cohesion, joint lubrication, and endurance.',
    traditionalUses: [
      'Constitutional assessment (Prakriti) and personalized lifestyle balancing',
      'Understanding bodily rhythms and seasonal fluctuations',
      'Guiding dietary choices, botanicals, and yoga asanas'
    ],
    modernContext: 'Modern integrative medicine increasingly recognizes personalized chronobiology and metabolic phenotyping, aligning with classical Ayurvedic typologies.',
    contraindications: ['Avoid rigid self-pigeonholing; every individual possesses all three doshas in unique proportions.'],
    practicalApplication: ['Observe appetite patterns, sleep quality, and climate tolerance to notice doshic shifts.'],
    references: ['Charaka Samhita, Sutrasthana Ch. 1', 'Ashtanga Hridaya, Sutrasthana Ch. 1'],
    tags: ['tridosha', 'vata', 'pitta', 'kapha', 'prakriti', 'elements'],
    isFeatured: true
  },
  {
    title: 'Vata Dosha: The Principle of Movement',
    sanskritName: 'Vata (Akasha + Vayu)',
    category: 'Doshas',
    doshaAffinity: 'Vata',
    description: 'Composed of Ether (Space) and Air, Vata is dry, light, cold, rough, subtle, and mobile. It governs all biological movement including breathing, blinking, nerve impulses, and circulation. Balanced Vata inspires creativity and adaptability; aggravated Vata manifests as dryness, restlessness, and erratic digestion.',
    traditionalUses: [
      'Pacified by warm, moist, grounding, and oily (Snigdha) qualities',
      'Balanced through regular daily routines (Dinacharya) and warm sesame Abhyanga'
    ],
    modernContext: 'Correlates with autonomic nervous system tone and sympathetic-parasympathetic regulation.',
    contraindications: ['Excessive fasting, cold raw foods, and irregular sleep aggravate Vata.'],
    practicalApplication: ['Favor warm cooked soups, root vegetables, ghee, and grounding standing yoga poses.'],
    references: ['Charaka Samhita, Sutrasthana Ch. 12'],
    tags: ['vata', 'dosha', 'air', 'space', 'grounding', 'movement'],
    isFeatured: false
  },
  {
    title: 'Pitta Dosha: The Principle of Transformation',
    sanskritName: 'Pitta (Agni + Jala)',
    category: 'Doshas',
    doshaAffinity: 'Pitta',
    description: 'Composed of Fire and Water, Pitta is hot, sharp, light, liquid, and slightly oily. It governs digestion, enzymatic metabolism, body temperature, and sharp intellect. Balanced Pitta fosters clarity and courage; excess Pitta leads to heat sensitivity, acidity, and irritability.',
    traditionalUses: [
      'Pacified by cooling, sweet, bitter, and astringent tastes',
      'Balanced through moderation, cooling herbs, and non-competitive movement'
    ],
    modernContext: 'Parallels metabolic rate, enzymatic activity, and inflammatory thermoregulation.',
    contraindications: ['Excessive spicy, sour, fermented foods and midday sun exposure aggravate Pitta.'],
    practicalApplication: ['Include cucumber, coconut, cilantro, mint, and cooling Moon Salutations.'],
    references: ['Sushruta Samhita, Sutrasthana Ch. 21'],
    tags: ['pitta', 'dosha', 'fire', 'digestion', 'cooling', 'metabolism'],
    isFeatured: false
  },
  {
    title: 'Kapha Dosha: The Principle of Structure & Cohesion',
    sanskritName: 'Kapha (Jala + Prithvi)',
    category: 'Doshas',
    doshaAffinity: 'Kapha',
    description: 'Composed of Water and Earth, Kapha is heavy, slow, cool, oily, smooth, dense, and stable. It provides physical strength, joint lubrication, immunity, and emotional steadiness. Balanced Kapha brings patience and endurance; excess Kapha causes sluggishness and congestion.',
    traditionalUses: [
      'Pacified by light, warm, dry, pungent, bitter, and astringent qualities',
      'Balanced through invigorating morning exercise and early rising'
    ],
    modernContext: 'Relates to anabolic tissue maintenance, mucosal immunity, and lipid-fluid homeostasis.',
    contraindications: ['Daytime sleeping and heavy, cold, sweet dairy foods aggravate Kapha.'],
    practicalApplication: ['Practice dynamic Sun Salutations, dry brushing, and favor spiced steamed greens.'],
    references: ['Ashtanga Hridaya, Sutrasthana Ch. 11'],
    tags: ['kapha', 'dosha', 'earth', 'water', 'stability', 'immunity'],
    isFeatured: false
  },

  // ================= HERBS =================
  {
    title: 'Tulsi (Holy Basil): Queen of Herbs',
    sanskritName: 'Ocimum sanctum / Vrinda',
    category: 'Herbs',
    doshaAffinity: 'Vata-Kapha',
    imageUrl: '/images/tulsi.jpg',
    description: 'Revered as a sacred adaptogen, Tulsi possesses warm potency (Ushna Virya) and pungent-bitter taste (Katu-Tikta Rasa). It gently clears Kapha from the respiratory tract while calming erratic Vata nervous impulses.',
    traditionalUses: [
      'Respiratory comfort and clearance of Pranavaha Srotas',
      'Adaptogenic stress resilience and mental clarity',
      'Digestive kindling (Deepana) and seasonal immunity support'
    ],
    modernContext: 'Studies document phenolic compounds (eugenol, rosmarinic acid, ursolic acid) exhibiting antioxidant and neuroprotective properties.',
    contraindications: ['Use cautiously in high Pitta heat states or during pregnancy.'],
    practicalApplication: ['Steep 4–6 fresh or dried leaves in hot water for a fragrant herbal infusion.'],
    references: ['Dravyaguna Vijnana, Vol. II', 'Bhavaprakasha Nighantu'],
    tags: ['tulsi', 'herbs', 'adaptogen', 'holy basil', 'immunity', 'respiratory'],
    isFeatured: true
  },
  {
    title: 'Ashwagandha: The Premier Rejuvenator (Rasayana)',
    sanskritName: 'Withania somnifera',
    category: 'Herbs',
    doshaAffinity: 'Vata-Kapha',
    description: 'One of the most celebrated Rasayanas in Ayurvedic pharmacopeia. Deeply grounds Vata, promotes restorative sleep, nourishes bodily tissues (Mamsa & Majja Dhatu), and supports physical stamina.',
    traditionalUses: [
      'Calming mental restlessness and supporting deep sleep',
      'Strengthening physical endurance and post-exercise recovery',
      'Nervous system nourishment and stress adaptation'
    ],
    modernContext: 'Clinical trials indicate withanolides help modulate cortisol levels and support the HPA stress axis.',
    contraindications: ['Avoid during acute fever, high Ama (congestion), or hyperthyroidism without medical guidance.'],
    practicalApplication: ['Traditionally prepared as a warm evening tonic with milk or plant milk and nutmeg.'],
    references: ['Charaka Samhita, Chikitsasthana Ch. 1'],
    tags: ['ashwagandha', 'herbs', 'sleep', 'stress', 'rasayana', 'endurance'],
    isFeatured: true
  },
  {
    title: 'Brahmi: Herb of Cognitive Grace',
    sanskritName: 'Bacopa monnieri',
    category: 'Herbs',
    doshaAffinity: 'Tridoshic',
    description: 'A premier Medhya Rasayana (nootropic rejuvenator) with cooling potency and sweet-bitter taste. Nourishes the nervous system, cools Pitta agitation in the mind, and supports calm concentration.',
    traditionalUses: [
      'Memory, focus, and calm mental clarity (Medhya)',
      'Soothing mental fatigue and emotional tension',
      'Cooling Pitta-type restlessness'
    ],
    modernContext: 'Bacosides have been studied for synaptic transmission support and antioxidant neuroprotection.',
    contraindications: ['May cause mild digestive heaviness if taken on an empty stomach with weak Agni.'],
    practicalApplication: ['Used in herbal teas or infused in Brahmi oil for soothing scalp massage.'],
    references: ['Charaka Samhita, Chikitsasthana Ch. 1:3'],
    tags: ['brahmi', 'herbs', 'focus', 'memory', 'medhya', 'mindfulness'],
    isFeatured: false
  },
  {
    title: 'Haridra (Turmeric): The Golden Spice',
    sanskritName: 'Curcuma longa',
    category: 'Herbs',
    doshaAffinity: 'Tridoshic',
    imageUrl: '/images/turmeric.jpg',
    description: 'Bitter, astringent, and pungent with heating potency, Turmeric purifies blood tissue (Rakta Dhatu), supports joint comfort, and kindles digestive fire without overly aggravating Pitta in culinary amounts.',
    traditionalUses: [
      'Joint mobility and healthy inflammatory response',
      'Skin radiance (Varnya) and metabolic cleansing',
      'Respiratory and throat soothing'
    ],
    modernContext: 'Curcuminoids are extensively researched for antioxidant and cellular signaling support, especially with piperine (black pepper).',
    contraindications: ['High supplemental doses should be avoided with gallstones or blood-thinning medications.'],
    practicalApplication: ['Simmer with a pinch of black pepper and healthy fat for optimal absorption.'],
    references: ['Bhavaprakasha Nighantu, Haritakyadi Varga'],
    tags: ['turmeric', 'haridra', 'herbs', 'joints', 'skin', 'inflammation'],
    isFeatured: false
  },
  {
    title: 'Triphala: The Harmonizing Three Fruits',
    sanskritName: 'Haritaki, Bibhitaki, Amalaki',
    category: 'Herbs',
    doshaAffinity: 'Tridoshic',
    description: 'A synergistic blend of equal parts Amalaki (Pitta pacifying), Bibhitaki (Kapha pacifying), and Haritaki (Vata pacifying), renowned for gentle digestive tonification and cellular rejuvenation.',
    traditionalUses: [
      'Gentle bowel regularity without habit formation',
      'Antioxidant cellular support and ocular health (Chakshushya)',
      'Balancing all three doshas'
    ],
    modernContext: 'Rich in polyphenols and vitamin C; acts as a prebiotic supporting beneficial gut microbiota.',
    contraindications: ['Avoid during pregnancy, acute dehydration, or loose stools.'],
    practicalApplication: ['1/2 tsp steeped in warm water 30 minutes before sleep.'],
    references: ['Sushruta Samhita, Sutrasthana Ch. 38'],
    tags: ['triphala', 'digestion', 'gut health', 'detox', 'amalaki'],
    isFeatured: true
  },

  // ================= SHRUBS =================
  {
    title: 'Guduchi (Giloy): The Nectar of Immortality',
    sanskritName: 'Tinospora cordifolia',
    category: 'Shrubs',
    doshaAffinity: 'Tridoshic',
    description: 'A climbing woody shrub revered as Amrita (nectar). Despite its bitter and astringent taste, it possesses a sweet post-digestive effect (Madhura Vipaka), uniquely balancing all three doshas and strengthening natural resilience.',
    traditionalUses: [
      'Supporting natural immune defense (Ojas) and seasonal resilience',
      'Cooling excess Pitta heat and purifying liver pathways',
      'Restoring vitality after seasonal fatigue'
    ],
    modernContext: 'Alkaloids and diterpenoid lactones in Tinospora cordifolia are studied for immunomodulatory activity.',
    contraindications: ['Consult a clinician if managing autoimmune conditions or taking immunosuppressants.'],
    practicalApplication: ['Prepared traditionally as a stem decoction (Kwatha) or mild herbal powder.'],
    references: ['Charaka Samhita, Sutrasthana Ch. 25', 'Bhavaprakasha Nighantu'],
    tags: ['guduchi', 'giloy', 'shrubs', 'amrita', 'immunity', 'tridoshic'],
    isFeatured: true
  },
  {
    title: 'Shatavari: Nourishing Climbing Shrub',
    sanskritName: 'Asparagus racemosus',
    category: 'Shrubs',
    doshaAffinity: 'Vata-Pitta',
    description: 'A thorny, climbing under-shrub whose tuberous roots are sweet, bitter, and deeply cooling. Shatavari is the premier rejuvenating tonic for cooling Pitta heat and hydrating dry Vata tissues.',
    traditionalUses: [
      'Cooling Pitta digestive acidity and soothing mucosal linings',
      'Nourishing bodily fluids (Rasa Dhatu) and reproductive vitality',
      'Supporting emotional calm and hormonal equilibrium'
    ],
    modernContext: 'Contains steroidal saponins (shatavarins) studied for gastroprotective and adaptogenic effects.',
    contraindications: ['Use sparingly in high Kapha congestion or sluggish digestion.'],
    practicalApplication: ['Blended into warm milk with a pinch of cardamom.'],
    references: ['Ashtanga Hridaya, Uttarasthana Ch. 39'],
    tags: ['shatavari', 'shrubs', 'cooling', 'rasayana', 'vata-pitta'],
    isFeatured: false
  },
  {
    title: 'Yashtimadhu (Licorice): Soothing Perennial Shrub',
    sanskritName: 'Glycyrrhiza glabra',
    category: 'Shrubs',
    doshaAffinity: 'Vata-Pitta',
    description: 'A perennial shrub whose sweet roots act as a gentle demulcent and throat soother. Balances Vata dryness and cools Pitta inflammation while harmonizing herbal formulas.',
    traditionalUses: [
      'Soothing throat irritation and dry cough',
      'Protecting gastric mucosal comfort',
      'Supporting vocal clarity (Kanthya)'
    ],
    modernContext: 'Glycyrrhizin and flavonoids are studied for soothing gastric and respiratory epithelia.',
    contraindications: ['Avoid prolonged high intake in hypertension, edema, or low potassium states.'],
    practicalApplication: ['Small pinch steeped in warm herbal tea for throat comfort.'],
    references: ['Charaka Samhita, Sutrasthana Ch. 4'],
    tags: ['yashtimadhu', 'licorice', 'shrubs', 'throat', 'soothing'],
    isFeatured: false
  },
  {
    title: 'Bala: Strength-Giving Perennial Shrub',
    sanskritName: 'Sida cordifolia',
    category: 'Shrubs',
    doshaAffinity: 'Vata-Pitta',
    description: 'Literally meaning "strength," Bala is a perennial shrub prized in classical Ayurveda for nourishing neuromuscular tissues, easing Vata stiffness, and supporting joint vitality.',
    traditionalUses: [
      'External herbal oil preparations (Bala Taila) for Abhyanga massage',
      'Supporting muscular strength and joint flexibility',
      'Calming Vata-driven fatigue'
    ],
    modernContext: 'Traditionally used primarily externally in modern practice as infused massage oils.',
    contraindications: ['Internal use should only be under qualified practitioner guidance.'],
    practicalApplication: ['Warm Bala-infused sesame oil applied gently to joints before a warm bath.'],
    references: ['Charaka Samhita, Sutrasthana Ch. 4'],
    tags: ['bala', 'shrubs', 'abhyanga', 'joints', 'strength'],
    isFeatured: false
  },

  // ================= RECIPES =================
  {
    title: 'Tridoshic Kitchari: Classical Healing Meal',
    sanskritName: 'Mudga Yusha / Krushara',
    category: 'Recipes',
    doshaAffinity: 'Tridoshic',
    description: 'The quintessential Ayurvedic one-pot meal combining split yellow mung dal and basmati rice simmered with ghee, cumin, turmeric, ginger, and coriander. Easy to digest, deeply nourishing, and kindles gentle Agni.',
    traditionalUses: [
      'Resting and resetting sluggish digestion (Agni)',
      'Nourishing recovery meal adaptable to Vata, Pitta, or Kapha',
      'Core staple of mindful Ayurvedic nutrition'
    ],
    modernContext: 'Provides a complete amino acid profile from legumes and rice paired with gentle carminative spices.',
    contraindications: ['Adjust spice warmth for Pitta (use coriander/fennel, less ginger).'],
    practicalApplication: [
      'Rinse 1/2 cup basmati rice and 1/2 cup split yellow mung dal.',
      'Sauté 1 tsp cumin, 1/2 tsp turmeric, and grated ginger in 1 tbsp ghee.',
      'Add grains, 4–5 cups warm water, and seasonal veggies; simmer 25 minutes until soft.'
    ],
    references: ['Charaka Samhita, Sutrasthana Ch. 27'],
    tags: ['kitchari', 'recipes', 'nutrition', 'mung dal', 'digestion', 'comfort food'],
    isFeatured: true
  },
  {
    title: 'Haldi Doodh (Ayurvedic Golden Milk)',
    sanskritName: 'Haridra Kshira',
    category: 'Recipes',
    doshaAffinity: 'Vata-Kapha',
    description: 'A comforting evening elixir of warm milk (or almond/oat milk) gently simmered with turmeric, crushed cardamom, cinnamon, a pinch of black pepper, and a touch of ghee or raw honey (added after cooling slightly).',
    traditionalUses: [
      'Promoting restful evening wind-down and deep sleep',
      'Soothing throat and joint comfort after physical exertion',
      'Warming nourishment during cooler seasons'
    ],
    modernContext: 'Black pepper piperine enhances curcumin bioavailability while warm milk provides soothing tryptophan.',
    contraindications: ['Never heat honey; stir in raw honey only once the drink cools to warm sipping temperature.'],
    practicalApplication: [
      'Simmer 1 cup milk with 1/2 tsp turmeric, 1/4 tsp cinnamon, and a pinch of black pepper for 5 minutes.',
      'Pour into a mug and enjoy warm 45 minutes before bed.'
    ],
    references: ['Classical Household Ayurvedic Tradition'],
    tags: ['golden milk', 'haldi doodh', 'recipes', 'turmeric', 'sleep', 'evening'],
    isFeatured: true
  },
  {
    title: 'CCF Tea: Cumin, Coriander & Fennel Infusion',
    sanskritName: 'Jeeraka-Dhanyaka-Mishreya Kwatha',
    category: 'Recipes',
    doshaAffinity: 'Tridoshic',
    description: 'A gentle, caffeine-free tridoshic digestive tea brewed from equal parts whole cumin, coriander, and fennel seeds. Supports smooth digestion, reduces post-meal bloating, and clears mild sluggishness without overheating Pitta.',
    traditionalUses: [
      'Kindling balanced Agni before or after meals',
      'Soothing mild gas, bloating, and digestive heaviness',
      'Gentle daily hydration across all seasons'
    ],
    modernContext: 'Volatile essential oils in Apiaceae seeds act as natural carminatives relaxing smooth GI muscle.',
    contraindications: ['Safe for daily culinary use for most constitutions.'],
    practicalApplication: [
      'Boil 2 cups water with 1/2 tsp each of cumin, coriander, and fennel seeds.',
      'Steep 5–8 minutes, strain, and sip warm throughout the day.'
    ],
    references: ['Bhavaprakasha Nighantu, Haritakyadi Varga'],
    tags: ['ccf tea', 'recipes', 'digestion', 'cumin', 'coriander', 'fennel'],
    isFeatured: false
  },
  {
    title: 'Cooling Rose & Fennel Summer Elixir',
    sanskritName: 'Shatapatri-Mishreya Peya',
    category: 'Recipes',
    doshaAffinity: 'Pitta',
    description: 'A fragrant, Pitta-pacifying infusion made from dried organic rose petals, crushed fennel seeds, and fresh mint leaves. Cools internal heat and refreshes the mind during hot summer afternoons.',
    traditionalUses: [
      'Soothing Pitta heat, acidity, and summer fatigue',
      'Uplifting mood and calming mental intensity'
    ],
    modernContext: 'Hydrating botanical infusion free of refined sugars and artificial additives.',
    contraindications: ['Avoid serving ice-cold; enjoy at cool room temperature to protect Agni.'],
    practicalApplication: [
      'Steep 1 tbsp dried rose petals, 1 tsp fennel seeds, and 4 mint leaves in warm water; let cool to room temperature before sipping.'
    ],
    references: ['Ritucharya Summer Hydration Principles'],
    tags: ['rose', 'fennel', 'recipes', 'pitta', 'cooling', 'summer'],
    isFeatured: false
  },

  // ================= DINACHARYA, RITUCHARYA, NUTRITION, YOGA =================
  {
    title: 'Dinacharya: Classical Daily Wellness Cycle',
    sanskritName: 'Dinacharya',
    category: 'Dinacharya',
    doshaAffinity: 'Tridoshic',
    description: 'Dinacharya is the Ayurvedic art of synchronizing daily habits with solar and circadian rhythms. Awakening before sunrise, warm water hydration (Ushapan), tongue scraping, Abhyanga oil massage, and mindful movement nurture Ojas.',
    traditionalUses: [
      'Brahma Muhurta awakening before sunrise',
      'Sense organ purification: Ushapan, Jihwa Nirlekhana, Gandusha (oil pulling)',
      'Abhyanga (warm oil self-massage) to calm Vata'
    ],
    modernContext: 'Aligns with circadian rhythm biology regulating cortisol, melatonin, and metabolic timing.',
    contraindications: ['Skip Abhyanga during acute fever or active indigestion.'],
    practicalApplication: ['Start with warm water upon waking and a consistent bedtime before 10:30 PM.'],
    references: ['Charaka Samhita, Sutrasthana Ch. 5'],
    tags: ['dinacharya', 'routine', 'circadian', 'morning', 'abhyanga'],
    isFeatured: true
  },
  {
    title: 'Ritucharya: Seasonal Harmony & Adaptation',
    sanskritName: 'Ritucharya',
    category: 'Ritucharya',
    doshaAffinity: 'Tridoshic',
    description: 'Ayurveda divides the year into six seasons (Ritus), adjusting diet and activity proactively to prevent seasonal dosha accumulation—warm grounding foods in winter, cooling hydration in summer, and light spiced meals in spring.',
    traditionalUses: [
      'Winter (Hemanta/Shishira): Warming, nourishing meals',
      'Summer (Grishma): Cooling, hydrating, sweet fruits',
      'Spring (Vasanta): Light, bitter, pungent greens to clear Kapha'
    ],
    modernContext: 'Mirrors seasonal eating and climate-adapted hydration.',
    contraindications: ['Transition gradually over 7–10 days between seasons (Ritusandhi).'],
    practicalApplication: ['Select locally in-season produce and adjust spice warmth with weather shifts.'],
    references: ['Ashtanga Hridaya, Sutrasthana Ch. 3'],
    tags: ['ritucharya', 'seasons', 'seasonal eating', 'climate'],
    isFeatured: false
  },
  {
    title: 'Ahara: Mindful Ayurvedic Nutrition & Agni',
    sanskritName: 'Ahara Vidhi Visheshayatana',
    category: 'Nutrition',
    doshaAffinity: 'Tridoshic',
    description: 'Ayurveda places digestive fire (Agni) at the center of nourishment. Freshly cooked, warm meals containing all six tastes (Sweet, Sour, Salty, Pungent, Bitter, Astringent) eaten calmly yield Ojas rather than Ama.',
    traditionalUses: [
      'Including all Six Tastes (Shad Rasa) in balanced proportions',
      'Eating only when previous meal has digested (4–5 hours apart)',
      'Leaving 1/4 stomach space empty for comfortable digestion'
    ],
    modernContext: 'Resonates with mindful eating, gut motility (MMC), and whole-food nutrition.',
    contraindications: ['Avoid iced beverages during meals as cold dampens digestive enzymes.'],
    practicalApplication: ['Sip warm water or CCF tea with meals; eat without screens.'],
    references: ['Charaka Samhita, Vimanasthana Ch. 1'],
    tags: ['nutrition', 'ahara', 'agni', 'six tastes', 'diet'],
    isFeatured: false
  },
  {
    title: 'Yoga Asana: The Doshic Biomechanics of Posture',
    sanskritName: 'Yoga Asana & Sthira Sukham',
    category: 'YogaTherapy',
    doshaAffinity: 'Tridoshic',
    description: 'Yoga and Ayurveda are sister Vedic sciences. Asanas cultivate steady ease (Sthira-Sukha), balancing energy flow: grounding poses like Tadasana & Tree calm Vata; cooling flows soothe Pitta; dynamic Warrior sequences invigorate Kapha.',
    traditionalUses: [
      'Vata: Grounding holds, Tadasana, Vrikshasana',
      'Pitta: Cooling, heart-opening postures, Warrior II',
      'Kapha: Dynamic standing sequences and energizing breathwork'
    ],
    modernContext: 'Improves proprioception, joint stability, and vagal tone—enhanced by real-time computer vision alignment.',
    contraindications: ['Respect joint comfort; never force sharp pain or hyperextension.'],
    practicalApplication: ['Practice daily in HitAyu YogaAI Studio with live skeletal feedback.'],
    references: ['Patanjali Yoga Sutras Ch. 2:46', 'Hatha Yoga Pradipika'],
    tags: ['yoga', 'asana', 'alignment', 'warrior', 'tree', 'tadasana'],
    isFeatured: true
  }
];

const categoryImageMap = {
  Doshas: '/images/sacred-lotus-om.jpg',
  Herbs: '/images/knowledge-herbs.jpg',
  Shrubs: '/images/knowledge-shrubs.jpg',
  Recipes: '/images/knowledge-recipes.jpg',
  Dinacharya: '/images/hero-ayurveda.jpg',
  Ritucharya: '/images/hero-indian-ayurveda.jpg',
  Nutrition: '/images/botanical-apothecary.jpg',
  YogaTherapy: '/images/yoga-heritage.jpg',
};

const enrichedKnowledge = curatedKnowledge.map((item) => ({
  ...item,
  imageUrl: item.imageUrl || categoryImageMap[item.category] || '/images/botanical-apothecary.jpg',
}));

const seedDB = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB Atlas (hitayu_db)...');
    await connectDB();

    console.log('[Seed] Clearing existing knowledge entries in hitayu_db...');
    await Knowledge.deleteMany({});

    console.log(`[Seed] Inserting ${enrichedKnowledge.length} curated Doshas, Herbs, Shrubs, Recipes & Wellness articles...`);
    const inserted = await Knowledge.insertMany(enrichedKnowledge);
    console.log(`[Seed] Successfully seeded ${inserted.length} entries into hitayu_db.knowledges!`);

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDB();
}

module.exports = { curatedKnowledge: enrichedKnowledge, seedDB };
