export interface PrakrutiQuestion {
    id: string;
    question: string;
    options: {
        vata: string;
        pitta: string;
        kapha: string;
    };
}

export interface QuestionSection {
    title: string;
    questions: PrakrutiQuestion[];
}

export const prakrutiQuestions: QuestionSection[] = [
    {
        title: "Physical Frame",
        questions: [
            {
                id: "bodyFrame",
                question: "Describe your body frame.",
                options: {
                    vata: "Thin, light frame, small bones, find it hard to gain weight.",
                    pitta: "Medium, athletic build, good muscle tone, gain/lose weight easily.",
                    kapha: "Large, sturdy frame, heavy bones, tend to gain weight easily.",
                },
            },
            {
                id: "weight",
                question: "How is your weight?",
                options: {
                    vata: "Low, underweight, find it difficult to put on pounds.",
                    pitta: "Moderate, stays stable, can manage it with some effort.",
                    kapha: "Heavy, tend to be overweight, find it hard to lose.",
                },
            },
        ],
    },
    {
        title: "Skin & Hair",
        questions: [
            {
                id: "skin",
                question: "What is your skin type?",
                options: {
                    vata: "Dry, rough, thin, cool to the touch, prone to fine lines.",
                    pitta: "Fair, sensitive, soft, warm, prone to rashes, acne, or moles.",
                    kapha: "Thick, oily, smooth, cool, pale, prone to enlarged pores.",
                },
            },
            {
                id: "hair",
                question: "Describe your hair.",
                options: {
                    vata: "Dry, thin, frizzy, or curly.",
                    pitta: "Fine, straight, soft, may be reddish or prone to early graying/balding.",
                    kapha: "Thick, oily, wavy, and lustrous.",
                },
            },
        ],
    },
    {
        title: "Digestion & Appetite",
        questions: [
            {
                id: "appetite",
                question: "How is your appetite?",
                options: {
                    vata: "Irregular, variable. Sometimes very hungry, other times forget to eat.",
                    pitta: "Strong, sharp. Get irritable or 'hangry' if I miss a meal.",
                    kapha: "Steady, moderate. Can skip meals easily without much discomfort.",
                },
            },
            {
                id: "digestion",
                question: "How would you describe your digestion?",
                options: {
                    vata: "Variable, tends towards gas and bloating.",
                    pitta: "Efficient, strong, tends towards acidity or loose stools when imbalanced.",
                    kapha: "Slow, heavy after meals, tends towards sluggishness.",
                },
            },
        ],
    },
    {
        title: "Mental & Emotional Traits",
        questions: [
            {
                id: "temperament",
                question: "How do you react under stress?",
                options: {
                    vata: "Become anxious, worried, or fearful.",
                    pitta: "Become irritable, angry, or critical.",
                    kapha: "Become withdrawn, lethargic, or avoid confrontation.",
                },
            },
            {
                id: "memory",
                question: "What is your memory like?",
                options: {
                    vata: "Quick to learn, but also quick to forget (good short-term, poor long-term).",
                    pitta: "Sharp, clear, and focused. Good memory for details.",
                    kapha: "Slower to learn, but excellent long-term memory.",
                },
            },
            {
                id: "sleep",
                question: "Describe your sleep pattern.",
                options: {
                    vata: "Light, interrupted sleep. Tendency towards insomnia.",
                    pitta: "Moderate but sound sleep. May wake up feeling hot.",
                    kapha: "Deep, heavy, and long sleep. Can feel groggy upon waking.",
                },
            },
        ],
    },
    {
        title: "Energy & Activity",
        questions: [
            {
                id: "energy",
                question: "How are your energy levels?",
                options: {
                    vata: "Comes in bursts, variable. Can feel very energetic then suddenly crash.",
                    pitta: "Strong and consistent. Very focused and driven.",
                    kapha: "Steady and sustained. Slow to start but have great stamina.",
                },
            },
            {
                id: "weather",
                question: "Which weather do you dislike?",
                options: {
                    vata: "Cold, dry, and windy weather.",
                    pitta: "Hot and sunny weather.",
                    kapha: "Cold, damp, and cloudy weather.",
                },
            },
        ],
    },
];
