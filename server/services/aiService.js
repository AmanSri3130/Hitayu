const Groq = require('groq-sdk');
const Knowledge = require('../models/Knowledge');

class AIService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.client = null;

    if (this.apiKey && this.apiKey.trim().length > 0) {
      try {
        this.client = new Groq({ apiKey: this.apiKey });
        console.log(`[AI Service] Groq client initialized with model: ${this.model}`);
      } catch (err) {
        console.warn(`[AI Service] Failed to initialize Groq client: ${err.message}. Fallback mode active.`);
      }
    } else {
      console.log('[AI Service] No GROQ_API_KEY provided. Operating in high-fidelity Ayurvedic knowledge fallback mode.');
    }
  }

  async generateResponse({ userMessage, userContext = {}, conversationHistory = [] }) {
    // 1. Retrieve relevant curated Knowledge from MongoDB
    const relevantKnowledge = await this.retrieveRelevantKnowledge(userMessage);

    // 2. Build system prompt adhering to HitAyu guidelines
    const systemPrompt = `You are Ayu AI, an educational assistant specializing in traditional Ayurvedic wellness concepts and general lifestyle education for the HitAyu platform.

Core Principles:
- Explain traditional Ayurvedic knowledge clearly, respectfully, and responsibly.
- Distinguish traditional beliefs and practices from scientifically established evidence.
- Never diagnose diseases or prescribe medicines, herbs, supplements, or clinical dosages.
- Never advise users to stop or alter prescribed medical treatments.
- Do not make unsupported medical or curative claims.
- If a user reports severe symptoms, clinical conditions, or emergencies, warmly and firmly recommend appropriate qualified healthcare professionals.
- Provide concise, structured, readable, and personalized responses.
- Respect the user's personal context and Prakriti constitution.

User Context:
${userContext.dominantDosha ? `- User Prakriti: ${userContext.dominantDosha} (Vata: ${userContext.vataPercent || 0}%, Pitta: ${userContext.pittaPercent || 0}%, Kapha: ${userContext.kaphaPercent || 0}%)` : '- User Prakriti: Not yet assessed.'}
${userContext.dietaryPreference ? `- Dietary Preference: ${userContext.dietaryPreference}` : ''}
${userContext.allergies && userContext.allergies.length ? `- Allergies: ${userContext.allergies.join(', ')}` : ''}

Curated Knowledge References:
${relevantKnowledge.length > 0 ? relevantKnowledge.map((k) => `• ${k.title} (${k.category}): ${k.description.slice(0, 220)}...`).join('\n') : 'General classical Ayurvedic principles apply.'}`;

    // 3. Attempt live generation via Groq
    if (this.client) {
      try {
        const messages = [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-6).map((m) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          })),
          { role: 'user', content: userMessage }
        ];

        const completion = await this.client.chat.completions.create({
          messages,
          model: this.model,
          temperature: 0.6,
          max_tokens: 800
        });

        const reply = completion.choices[0]?.message?.content;
        if (reply) {
          return {
            content: reply,
            isFallback: false,
            references: relevantKnowledge.map((k) => ({ title: k.title, category: k.category }))
          };
        }
      } catch (groqError) {
        console.warn(`[AI Service] Groq call failed (${groqError.message}). Executing transparent Ayurvedic fallback.`);
      }
    }

    // 4. Transparent, high-fidelity fallback response when Groq is unavailable
    return this.generateFallbackResponse(userMessage, relevantKnowledge, userContext);
  }

  async retrieveRelevantKnowledge(query) {
    try {
      const keywords = query
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3);

      if (keywords.length === 0) {
        return await Knowledge.find({ isFeatured: true }).limit(3);
      }

      // Keyword search in title, tags, or description
      const regexPatterns = keywords.map((kw) => new RegExp(kw, 'i'));
      const entries = await Knowledge.find({
        $or: [
          { title: { $in: regexPatterns } },
          { tags: { $in: regexPatterns } },
          { category: { $in: regexPatterns } }
        ]
      }).limit(3);

      return entries.length > 0 ? entries : await Knowledge.find({ isFeatured: true }).limit(2);
    } catch (err) {
      console.warn('[AI Service] Knowledge retrieval error:', err.message);
      return [];
    }
  }

  generateFallbackResponse(query, knowledgeList, userContext) {
    const qLower = query.toLowerCase();
    let body = '';
    const refs = knowledgeList.map((k) => ({ title: k.title, category: k.category }));

    // Tailored guidance based on common Ayurvedic queries
    if (qLower.includes('vata') || qLower.includes('pitta') || qLower.includes('kapha') || qLower.includes('dosha')) {
      body = `### Classical Tridosha Understanding

In traditional Ayurvedic philosophy, physical constitution (*Prakriti*) and functional dynamics (*Doshas*) consist of three primary bio-energetic forces:

1. **Vata (Air & Space):** Governs movement, respiration, circulation, and nervous system impulses. When balanced, it fosters creativity and lightness; when aggravated, it manifests as dryness, restlessness, and digestive irregularity.
2. **Pitta (Fire & Water):** Governs digestion, metabolic transformations, body temperature, and intellect. Balanced Pitta brings clarity, focus, and warmth; excess Pitta leads to acidity, heat sensitivity, and irritability.
3. **Kapha (Earth & Water):** Governs structural integrity, lubrication, joint cohesion, and emotional stability. Balanced Kapha yields endurance and grounded calmness; excess Kapha results in heaviness, lethargy, and congestion.

${userContext.dominantDosha ? `*Personalized Note:* Your current assessment indicates **${userContext.dominantDosha}** predominance. Maintaining seasonal routines and balanced nourishment helps preserve equilibrium.` : '*Suggestion:* You can complete your interactive assessment in the **My Prakriti** section to discover your constitutional tendencies.'}

*Disclaimer: This information is traditional educational wisdom and not a medical diagnosis.*`;
    } else if (qLower.includes('dinacharya') || qLower.includes('routine') || qLower.includes('morning')) {
      body = `### Dinacharya: The Ayurvedic Daily Cycle

*Dinacharya* represents the alignment of daily rhythms with natural solar and circadian cycles:

- **Brahma Muhurta (Dawn Awakening):** Awakening before sunrise when the atmosphere carries pure, tranquil Sattvic energy.
- **Ushapan (Hydration):** Drinking lukewarm water first thing to gently awaken the gastrointestinal tract (*Agni*).
- **Jihwa Nirlekhana (Tongue Scraping):** Removing overnight oral deposits (*Ama*) to stimulate digestive enzymes.
- **Abhyanga (Self-Massage):** Applying warm sesame or herbal oil to nourish tissues, calm the nervous system, and improve peripheral circulation.
- **Pranayama & Asana:** Gentle conscious breathing and yoga postures suited to your constitution before meals.

Integrating even two of these practices creates profound daily consistency and mindful awareness.`;
    } else if (qLower.includes('diet') || qLower.includes('food') || qLower.includes('eat') || qLower.includes('nutrition')) {
      body = `### Ayurvedic Nutritional Principles (Ahara)

Traditional Ayurveda views food as foundational medicine (*Mahabheshaja*), prioritizing not only what you eat, but how you digest (*Agni*):

1. **Eat According to Your Constitution:** Warm, unctuous, grounding foods pacify Vata; cooling, moderately spiced foods pacify Pitta; light, warm, stimulating foods pacify Kapha.
2. **Seasonal Harmony (Ritucharya):** Align meal choices with the ambient climate—nourishing soups in winter, cooling salads and fruits during peak summer.
3. **Mindful Eating:** Eat in a calm environment without digital distractions, chewing thoroughly until half-full with solids, one quarter with liquids, leaving one quarter empty for digestive movement.

${userContext.dietaryPreference ? `*Adapted to your profile:* Your preference for **${userContext.dietaryPreference}** aligns beautifully with mindful whole-food eating.` : ''}`;
    } else if (knowledgeList.length > 0) {
      const top = knowledgeList[0];
      body = `### Curated Ayurvedic Guidance: ${top.title}

${top.description}

**Traditional Applications:**
${top.traditionalUses ? top.traditionalUses.map((u) => `- ${u}`).join('\n') : '- Used traditionally for promoting holistic vitality and doshic equilibrium.'}

**Modern Lifestyle Context:**
${top.modernContext || 'Contemporary wellness practices emphasize consistent stress management, regular circadian rhythms, and conscious hydration alongside these traditional concepts.'}

${top.contraindications && top.contraindications.length ? `**Precautions:** ${top.contraindications.join(', ')}` : ''}`;
    } else {
      body = `### Ayurvedic Wellness Guidance

Traditional Ayurveda teaches that radiant health (*Swastha*) is achieved when digestive fire (*Agni*) is balanced, the three bodily humors (*Doshas*) are in equilibrium, bodily tissues (*Dhatus*) are nourished, and the mind and senses dwell in serene contentment.

Key mindful practices for everyday wellness:
- **Consistent Sleep Schedule:** Retiring by 10:00 PM when Kapha energy aids deep restorative sleep.
- **Warm Nourishment:** Favoring freshly cooked, warm meals over cold, processed foods.
- **Breath Awareness:** 5–10 minutes of alternate nostril breathing (*Nadi Shodhana*) to soothe the nervous system.

Please feel free to ask about specific doshas, herbal wisdom, morning routines, or yoga alignment!`;
    }

    return {
      content: body,
      isFallback: true,
      references: refs
    };
  }
}

module.exports = new AIService();
