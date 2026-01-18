import Groq from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * MintSense AI Service
 * Natural language processing for expense management
 */

/**
 * Parse natural language expense input into structured data
 * Example: "Split $50 dinner with Alice and Bob" 
 * Returns: { amount: 50, description: "dinner", participants: ["Alice", "Bob"], splitMode: "equal" }
 */
async function parseExpenseFromText(text, groupParticipants = []) {
    try {
        const participantNames = groupParticipants.map(p => p.name).join(', ');

        const prompt = `You are an expense parsing assistant. Parse the following expense description into structured JSON.

Available participants: ${participantNames || 'None'}

Expense text: "${text}"

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "amount": <number>,
  "description": "<string>",
  "participantNames": ["<name1>", "<name2>"],
  "splitMode": "equal" | "custom" | "percentage",
  "category": "food" | "transport" | "entertainment" | "utilities" | "shopping" | "general"
}

Rules:
- Extract numeric amount (convert currencies if needed)
- Identify participant names from the available list
- If "split equally" or similar, use "equal" mode
- If specific amounts mentioned, use "custom" mode
- If percentages mentioned, use "percentage" mode
- Categorize based on keywords (dinner/lunch=food, uber/taxi=transport, movie=entertainment)
- If no participants mentioned, return empty array
- Description should be concise (max 50 chars)`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            max_tokens: 500
        });

        const response = completion.choices[0]?.message?.content?.trim();

        // Remove markdown code blocks if present
        const jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(jsonStr);

        return {
            success: true,
            data: parsed
        };
    } catch (error) {
        console.error('MintSense parse error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Auto-categorize an expense based on description
 */
async function categorizeExpense(description) {
    try {
        const prompt = `Categorize this expense into ONE category: food, transport, entertainment, utilities, shopping, or general.

Expense: "${description}"

Return ONLY the category name, nothing else.`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2,
            max_tokens: 20
        });

        const category = completion.choices[0]?.message?.content?.trim().toLowerCase();

        const validCategories = ['food', 'transport', 'entertainment', 'utilities', 'shopping', 'general'];
        return validCategories.includes(category) ? category : 'general';
    } catch (error) {
        console.error('MintSense categorize error:', error);
        return 'general';
    }
}

/**
 * Generate a readable summary of group expenses
 */
async function generateGroupSummary(groupData) {
    try {
        const { name, expenses, participants, balances } = groupData;

        const expenseList = expenses.slice(0, 10).map(e =>
            `- ${e.description}: ₹${e.amount} (paid by ${e.payer?.name})`
        ).join('\n');

        const balanceList = balances.map(b =>
            `- ${b.participant.name}: ${b.balance >= 0 ? '+' : ''}₹${b.balance.toFixed(2)}`
        ).join('\n');

        const prompt = `Generate a friendly, concise summary of this expense group.

Group: ${name}
Participants: ${participants.map(p => p.name).join(', ')}
Total Expenses: ${expenses.length}

Recent Expenses:
${expenseList}

Current Balances:
${balanceList}

Write a 2-3 sentence summary highlighting:
1. Total spending and main expense categories
2. Who owes/is owed the most
3. A friendly suggestion or observation

Keep it casual and helpful.`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 200
        });

        return completion.choices[0]?.message?.content?.trim();
    } catch (error) {
        console.error('MintSense summary error:', error);
        return 'Unable to generate summary at this time.';
    }
}

/**
 * Suggest optimal settlement strategy with explanation
 */
async function explainSettlements(settlements, balances) {
    try {
        if (settlements.length === 0) {
            return "Great news! Everyone is settled up. No payments needed! 🎉";
        }

        const settlementList = settlements.map(s =>
            `- ${s.from.name} pays ${s.to.name} ₹${s.amount.toFixed(2)}`
        ).join('\n');

        const prompt = `Explain these settlement suggestions in a friendly, clear way:

${settlementList}

Write 1-2 sentences explaining:
1. How many transactions are needed
2. Why this is the optimal way to settle up

Keep it simple and encouraging.`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.6,
            max_tokens: 150
        });

        return completion.choices[0]?.message?.content?.trim();
    } catch (error) {
        console.error('MintSense settlement explanation error:', error);
        return 'Complete these transactions to settle all balances.';
    }
}

export default {
    parseExpenseFromText,
    categorizeExpense,
    generateGroupSummary,
    explainSettlements
};
