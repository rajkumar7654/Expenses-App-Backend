const { GoogleGenerativeAI } = require('@google/generative-ai');

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'];

const KEYWORDS = {
    'Food': ['food', 'lunch', 'dinner', 'breakfast', 'restaurant', 'cafe', 'pizza', 'burger', 'grocery', 'meal', 'snack'],
    'Transport': ['taxi', 'uber', 'bus', 'train', 'metro', 'fuel', 'petrol', 'gas', 'parking', 'travel', 'flight', 'go to'],
    'Shopping': ['shopping', 'clothes', 'shoes', 'amazon', 'flipkart', 'mall', 'store', 'buy', 'purchase'],
    'Bills': ['bill', 'electricity', 'water', 'internet', 'phone', 'rent', 'insurance', 'subscription', 'emi', 'pay'],
    'Entertainment': ['movie', 'netflix', 'spotify', 'game', 'concert', 'party', 'fun', 'entertainment'],
    'Health': ['medicine', 'doctor', 'hospital', 'pharmacy', 'health', 'gym', 'fitness', 'medical']
};

async function suggestCategory(description) {
    // Try AI first if API key is available
    if (process.env.GOOGLE_AI_API_KEY) {
        try {
            console.log('AI Category Suggestion - Description:', description);
            
            const ai = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
            const model = ai.getGenerativeModel({ model: 'gemini-pro' });

            const prompt = `Categorize this expense: "${description}". Choose from: ${CATEGORIES.join(', ')}. Return only the category name.`;

            const result = await model.generateContent(prompt);
            const category = result.response.text().trim();

            console.log('AI suggested category:', category);

            if (CATEGORIES.includes(category)) {
                return category;
            }
        } catch (error) {
            console.log('AI failed, using keyword matching');
        }
    }

    // Fallback to keyword-based categorization
    const desc = description.toLowerCase();

    for (const [category, keywords] of Object.entries(KEYWORDS)) {
        for (const keyword of keywords) {
            if (desc.includes(keyword)) {
                console.log('Keyword matched:', category);
                return category;
            }
        }
    }

    return 'Other';
}

module.exports = { suggestCategory };
