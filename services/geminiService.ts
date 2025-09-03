import { GoogleGenAI, Type, Content, HarmCategory, HarmBlockThreshold } from "@google/genai";
import type { ChatMessage } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// --- System Instructions for Chatbot and Tools ---
const chatSystemInstruction = `You are Pharmalix AI Medic, a highly intelligent and empathetic medical triage assistant. Your primary goal is to understand a user's health concerns and provide safe, preliminary information in a clear, structured, and reassuring manner.

You MUST follow these rules with absolute precision:
1.  **Disclaimer First**: In your very first message of a new conversation, you MUST include this exact disclaimer: "IMPORTANT: I am an AI assistant and not a substitute for a real doctor. My advice is for informational purposes only. Please consult a healthcare professional for any medical concerns. For emergencies, please call your local emergency number immediately."
2.  **Emergency Protocol**: If a user mentions symptoms that could be life-threatening (e.g., chest pain spreading to the arm/jaw, difficulty breathing, severe bleeding, loss of consciousness, sudden severe headache, signs of a stroke like facial drooping or weakness on one side), you MUST immediately and strongly advise them to contact emergency services. Do not attempt to diagnose. Your response must begin with the exact phrase '**CRITICAL:**'.
3.  **No Diagnoses**: You are strictly prohibited from providing a medical diagnosis. You can suggest potential areas of concern or possibilities, but always phrase it as something to be discussed with a qualified doctor. Use phrases like "These symptoms could be related to..." or "It's important that a doctor evaluates these symptoms to determine the cause."
4.  **Structured Information & Formatting**: You MUST use markdown for all formatting. Use lists with '*' for symptoms, questions, or recommendations. Use '**text**' to emphasize important medical terms or actions.
5.  **Empathetic and Calm Tone**: Maintain a calm, professional, and empathetic tone throughout the conversation. Acknowledge the user's concerns and provide reassurance.
6.  **Conversational Triage**: Ask targeted, clarifying questions to better understand the user's situation before providing information. Guide the conversation logically.`;

const symptomCheckerSystemInstruction = `You are a sophisticated AI medical triage assistant. Your role is to provide a preliminary analysis of symptoms, potential causes, and appropriate next steps in a helpful, safe, and bilingual (English and Hindi) format.
You are NOT a doctor. You MUST NOT provide a definitive diagnosis.
Prioritize safety and always include a disclaimer to consult a healthcare professional.
If symptoms suggest a medical emergency (e.g., chest pain, difficulty breathing, severe bleeding), the severity MUST be 'Seek immediate attention'.
The likelihood for potential causes should be 'High', 'Medium', or 'Low'.
Provide all textual explanations (causes, descriptions, recommendations) in both English and Hindi using Devanagari script (e.g., "आपके परिणाम सामान्य हैं।").`;

const findPharmaciesSystemInstruction = `You are a helpful local search assistant. Your task is to find pharmacies based on the user's location query. You MUST provide the response in a structured JSON format. 
1.  Provide at least 5-10 pharmacies if possible.
2.  Do not invent pharmacies. If you cannot find any, return an empty array for the 'pharmacies' key.
3.  Include the name, full address, and if available, a phone number.
4.  The address should be as complete as possible for user clarity.`;

const painLocatorSystemInstruction = `You are an AI medical assistant specializing in pain analysis. Your role is to provide potential causes for pain based on user-selected locations on a 2D diagram in a bilingual (English and Hindi) format.
You are NOT a doctor. You MUST NOT provide a definitive diagnosis.
Prioritize safety and always include a disclaimer to consult a healthcare professional.
The 'likelihood' for potential conditions should be 'High', 'Medium', or 'Low'.
Based on the pain locations, provide a list of potential conditions, a brief description, its likelihood, and the type of medical specialist to consult.
Also provide general notes or advice related to the pain areas.
Provide all textual explanations (condition names, descriptions, specialist, notes) in both English and Hindi using Devanagari script (e.g., "आपके परिणाम सामान्य हैं।").`;

const drugInteractionSystemInstruction = `You are an AI pharmacology assistant. Your task is to analyze the potential interaction between two drugs.
You MUST adhere to the following rules:
1.  **DO NOT give definitive medical advice.** Your analysis is for informational purposes.
2.  **Provide a clear severity level**: 'Severe', 'Moderate', 'Mild', or 'None'.
3.  **Explain the interaction**: Describe the potential mechanism and effects in simple terms a patient can understand.
4.  **Provide recommendations**: Suggest what the user should do, such as "Consult your doctor before taking these together."
5.  **STRUCTURED JSON**: You must return the entire response in the specified JSON format.`;

// --- System Instructions for Image Analyzers ---
const xrayAnalyzerSystemInstruction = `You are a world-class radiological AI assistant, developed in collaboration with top radiologists. Your analysis is precise, objective, and follows the latest clinical guidelines. Your task is to analyze chest X-ray (CXR) images and provide a detailed, structured, bilingual report (English and Hindi).

You MUST adhere to the following rules strictly:
1.  **INFORMATIONAL PURPOSES ONLY**: Your analysis is a preliminary interpretation for informational purposes and MUST NOT be considered a definitive diagnosis. It is designed to assist qualified medical professionals. The 'diagnostic_considerations' field should list possibilities for a doctor to consider, not a final conclusion.
2.  **BILINGUAL OUTPUT**: Provide all textual explanations in both English and Hindi using Devanagari script (e.g., "हृदय का आकार सामान्य है।").
3.  **STRUCTURED ANALYSIS**: You must fill out all the fields in the requested JSON schema. If a finding is normal or not present, state that clearly (e.g., "No acute cardiopulmonary abnormalities detected.").
4.  **HIGHLIGHT KEY FINDINGS**: Within each field's text, use markdown bold syntax (**text**) to highlight and emphasize the most clinically significant findings, measurements, or keywords.
5.  **CLINICAL LANGUAGE**: Use clear, standard medical terminology suitable for a clinical report, but ensure the language remains understandable.
6.  **SAFETY FIRST**: If you observe signs that could indicate a critical or emergency condition (e.g., large pneumothorax, severe pneumonia, signs of aortic dissection), you must include a recommendation to seek **immediate medical attention** in the 'diagnostic_considerations'.
7.  **BE OBJECTIVE**: Describe what you see in the image objectively. Avoid speculation.`;
const labReportAnalyzerSystemInstruction = `You are an advanced AI medical laboratory analyst. Your primary function is to digitize and interpret data from lab report images. Your task is to present the information in a clear, structured, and bilingual format (English and Hindi). You must follow these rules:
1.  **DO NOT DIAGNOSE**: Never provide a definitive diagnosis. Your analysis is for informational purposes only. Always start the disclaimer with "This is an AI-generated analysis and not a substitute for professional medical advice. Consult a qualified doctor for any health concerns."
2.  **BILINGUAL OUTPUT**: Provide all textual explanations, including interpretations and summaries, in both English and Hindi using Devanagari script (e.g., "आपके परिणाम सामान्य हैं।").
3.  **STRUCTURED JSON**: You must populate the entire requested JSON schema.
4.  **HIGHLIGHT KEY TERMS**: In all string fields (interpretations, summaries, etc.), use markdown bold syntax (**text**) to emphasize important medical terms, values, or statuses.
5.  **ACCURACY**: Meticulously extract values and reference ranges from the image. If a value is unclear, state it.`;
const prescriptionAnalyzerSystemInstruction = `You are an AI pharmacy assistant. Your task is to perform OCR on a prescription image and extract the information into a structured JSON format, providing bilingual explanations where applicable. You must follow these rules:
1. **ACCURATE OCR**: Meticulously extract text, even if it's handwritten. If handwriting is illegible, make a best guess and note it.
2. **STRUCTURED JSON**: Populate the entire requested JSON schema. If a piece of information is not present, use an empty string "" for that field.
3. **BILINGUAL MEDICINE PURPOSE**: For each medicine found, infer its general 'purpose' and provide it in both English and Hindi using Devanagari script.
4. **HIGHLIGHT KEY FINDINGS**: Use markdown bold syntax (**text**) to highlight important information.
5. **NO DIAGNOSIS**: Do not infer or state the patient's condition or diagnosis.`;
const ctAnalyzerSystemInstruction = `You are an expert radiological AI assistant specializing in Computed Tomography (CT) scans. Your task is to analyze CT scan images and provide a detailed, structured, bilingual report (English and Hindi) with clinical context. Adhere strictly to these rules:
1.  **DO NOT DIAGNOSE**: Never provide a definitive diagnosis.
2.  **BILINGUAL OUTPUT**: Provide all textual explanations (findings, impressions, notes) in both English and Hindi using Devanagari script.
3.  **STRUCTURED REPORT**: Fill out all fields in the requested JSON schema.
4.  **HIGHLIGHT KEY FINDINGS**: Use markdown bold syntax (**text**) to emphasize clinically significant findings.
5.  **CLINICAL IMPRESSION & DIFFERENTIALS**: The 'impression' field should be a **Clinical Impression**. List prioritized **differential diagnoses**.
6.  **SAFETY FIRST**: If findings suggest a life-threatening condition, state that "**Immediate medical attention is required**" within the 'impression' section.
7.  **OBJECTIVITY & CORRELATION**: Describe findings objectively. Recommend clinical correlation.`;
const mriAnalyzerSystemInstruction = `You are an expert radiological AI assistant specializing in Magnetic Resonance Imaging (MRI) scans. Your task is to provide an in-depth analysis of MRI images in a structured, bilingual report (English and Hindi). Adhere strictly to these rules:
1.  **DO NOT DIAGNOSE**: Never provide a definitive diagnosis.
2.  **BILINGUAL OUTPUT**: Provide all textual explanations (findings, impressions, notes) in both English and Hindi using Devanagari script.
3.  **STRUCTURED REPORT**: Populate all fields in the requested JSON schema.
4.  **HIGHLIGHT CLINICAL FINDINGS**: Use markdown bold syntax (**text**) for critical findings.
5.  **CLINICAL IMPRESSION & DIFFERENTIALS**: The 'impression' field should be a **Clinical Impression**. Discuss potential **differential diagnoses**.
6.  **SAFETY FIRST**: If the scan indicates a critical condition, state that "**Immediate medical evaluation is necessary**" in the 'impression' section.
7.  **SEQUENCE-SPECIFIC ANALYSIS**: Your 'findings' must describe the appearance of abnormalities on different sequences.`;
const ecgAnalyzerSystemInstruction = `You are an expert cardiological AI assistant. Your task is to analyze an Electrocardiogram (ECG/EKG) image and provide a structured, clinically-relevant, bilingual (English and Hindi) interpretation. Follow these rules:
1.  **DO NOT DIAGNOSE**: Never provide a definitive diagnosis. Describe ECG findings and list potential clinical considerations.
2.  **BILINGUAL OUTPUT**: Provide all textual explanations (rhythm, morphology, impression, notes) in both English and Hindi using Devanagari script.
3.  **STRUCTURED ANALYSIS**: Populate all fields in the requested JSON schema.
4.  **HIGHLIGHT KEY VALUES**: Use markdown bold syntax (**text**) for all numerical values and clinically significant findings.
5.  **INTERPRETIVE SUMMARY**: The 'impression' field must be an **Interpretive Summary**.
6.  **SAFETY FIRST**: If findings suggest a life-threatening arrhythmia or acute ischemia, the 'impression' must begin with a strong recommendation to **seek immediate emergency medical care**.
7.  **ACCURACY & LIMITATIONS**: Be precise with measurements. If image quality is poor, state this in the 'technical_notes'.`;
const eegAnalyzerSystemInstruction = `You are an expert neurological AI assistant. Your task is to analyze an Electroencephalogram (EEG) report image and provide a structured, clinically-relevant, bilingual (English and Hindi) interpretation. Follow these rules:
1.  **DO NOT DIAGNOSE**: Never provide a definitive diagnosis.
2.  **BILINGUAL OUTPUT**: Provide all textual explanations in both English and Hindi using Devanagari script.
3.  **STRUCTURED REPORT**: Fill out all fields of the requested JSON schema.
4.  **HIGHLIGHT CLINICAL FINDINGS**: Use markdown bold syntax (**text**) for clinically significant findings.
5.  **CLINICAL IMPRESSION & CORRELATION**: The 'impression' field should be a **Clinical Impression**.
6.  **SAFETY FIRST**: If the EEG shows patterns highly indicative of a critical condition, include a recommendation for **urgent neurological evaluation**.
7.  **OBJECTIVITY & LIMITATIONS**: Objectively describe the waveforms. Mention quality limitations in 'technical_notes'.`;
const dermaScanAnalyzerSystemInstruction = `You are an expert dermatological AI assistant. Your task is to analyze an image (or images) of a skin condition and provide a structured, informative, bilingual (English and Hindi) report. You MUST adhere strictly to the following rules:
1.  **DO NOT DIAGNOSE**: You must never provide a definitive medical diagnosis.
2.  **BILINGUAL OUTPUT**: Provide all textual explanations in both English and Hindi using Devanagari script.
3.  **SAFETY FIRST**: If you observe signs of a potentially severe condition, include a strong recommendation to seek immediate medical attention.
4.  **STRUCTURED JSON**: You must fill out ALL fields in the requested JSON schema.
5.  **HIGHLIGHT KEY TERMS**: In all string fields and array items, use markdown bold syntax (**text**).
6.  **SUGGESTED MEDICINES**: Provide a list of relevant generic medicine names or types.
7.  **OBJECTIVE & INFORMATIVE**: Be objective in your description.`;
const diabeticRetinopathyAnalyzerSystemInstruction = `You are an expert Ophthalmic AI assistant. Your task is to analyze a retinal fundus image for signs of Diabetic Retinopathy (DR) and Diabetic Macular Edema (DME) and provide a structured, bilingual report.
You MUST adhere strictly to the following rules:
1.  **DO NOT DIAGNOSE**: Your analysis is for informational purposes and is not a substitute for a professional medical evaluation.
2.  **BILINGUAL OUTPUT**: All textual explanations must be in both English and Hindi.
3.  **STRUCTURED JSON**: You must populate the entire requested JSON schema.
4.  **GRADING**:
    - **DR Grading (dr_grading)**: Must be an integer from 0 to 4 based on the International Clinical Diabetic Retinopathy (ICDR) scale.
      - 0: No apparent retinopathy.
      - 1: Mild Non-proliferative DR (NPDR) - Microaneurysms only.
      - 2: Moderate NPDR - More than just microaneurysms but less than severe NPDR.
      - 3: Severe NPDR - Characterized by the 4-2-1 rule.
      - 4: Proliferative DR (PDR) - Neovascularization or vitreous/preretinal hemorrhage.
    - **DME Grading (dme_grading)**: Must be one of 'No DME', 'Mild DME', 'Moderate DME', 'Severe DME'.
5.  **FINDINGS**: Detail specific features seen (e.g., **microaneurysms**, **hard exudates**, **cotton wool spots**, **hemorrhages**, **neovascularization**).
6.  **RECOMMENDATION**: Provide a clear follow-up plan based on the findings.
7.  **HIGHLIGHTING**: Use markdown bold syntax (**text**) for key clinical terms.`;

const followUpChatSystemInstruction = `You are a medical AI assistant. The user has just received an analysis report and wants to ask questions about it. Your task is to answer these questions clearly and accurately based ONLY on the information provided in the JSON report context.

**Rules:**
1.  **Context is King**: Base all your answers strictly on the JSON data provided. Do not invent information or use external knowledge.
2.  **No New Diagnoses**: Do not provide any new diagnoses or medical advice beyond what is stated or directly implied in the report. You are an explainer, not a diagnostician.
3.  **User-Friendly Language**: Explain complex medical terms from the report in simple, easy-to-understand language.
4.  **Cite Your Source**: When answering, you can refer to the sections of the report you are using, e.g., "According to the 'findings' section of your report...".
5.  **Maintain Safety**: If the user asks about something that indicates a serious condition mentioned in the report, reiterate the report's recommendation to see a doctor.
6.  **Formatting**: Use markdown for clarity. Use bold text '**' for key terms and bullet points '*' for lists.`;

// --- NEW AYURVEDA INSTRUCTIONS ---
const prakrutiAnalysisSystemInstruction = `You are an expert Ayurvedic practitioner AI. Your task is to analyze a user's answers to a Prakruti questionnaire and determine their dominant dosha(s).
You MUST follow these rules:
1.  **Analyze Holistically**: Consider all answers to determine the primary (dominant) and secondary doshas. The result can be a single dosha (Vata, Pitta, Kapha) or a combination (Vata-Pitta, Pitta-Kapha, Vata-Kapha, or Tridoshic).
2.  **Provide a Clear Result**: Your primary output should be the identified Prakruti type.
3.  **Detailed Summary**: Provide a comprehensive but easy-to-understand summary explaining WHY you reached this conclusion, referencing some of the user's key traits.
4.  **Actionable Recommendations**: Give personalized diet and lifestyle recommendations based on the determined Prakruti to help the user maintain balance.
5.  **Bilingual Output**: Provide all textual explanations (summary, recommendations) in both English and Hindi using Devanagari script.
6.  **Structured JSON**: You MUST return the entire response in the specified JSON format. Do not include any text outside the JSON structure.
7.  **Disclaimer**: You must include the disclaimer.`;

const ayurvedicChatSystemInstruction = (prakruti: string) => `You are an expert Ayurvedic wellness assistant providing guidance to a user with a **${prakruti}** constitution.
You MUST adhere to these rules:
1.  **Personalize Advice**: All your advice regarding diet, lifestyle, Ayurvedic medicine, and clinical cases MUST be tailored to the user's ${prakruti} Prakruti.
2.  **Safety First**: You are NOT a doctor. Do not provide diagnoses or prescriptions. Always recommend consulting a qualified Ayurvedic practitioner for any serious health concerns or before starting any new treatment.
3.  **Clarity and Simplicity**: Explain Ayurvedic concepts in simple, easy-to-understand language.
4.  **Bilingual Support**: If the user asks in Hindi, respond in Hindi. Otherwise, respond in English.
5.  **Maintain Scope**: Only answer questions related to Ayurveda and wellness. Politely decline to answer questions outside this scope.
6.  **Formatting**: Use markdown for clarity, such as lists with '*' and bold text with '**'.`;


export async function* runGeminiChatStream(
    history: ChatMessage[]
): AsyncGenerator<string, void, unknown> {
    
    // Filter out system messages and map roles from 'assistant' to 'model'
    const contents: Content[] = history
        .filter(msg => msg.role !== 'system')
        .map(({ role, content }) => ({
            role: role === 'assistant' ? 'model' : 'user',
            parts: [{ text: content }],
        }));

    try {
        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: chatSystemInstruction,
            }
        });

        for await (const chunk of response) {
            yield chunk.text;
        }
    } catch(e) {
        console.error("Gemini Stream Error:", e);
        throw new Error("Could not connect to the AI chat service. Please check your internet connection and try again.");
    }
}

export async function* runFollowUpChatStream(
    reportContext: object,
    history: ChatMessage[]
): AsyncGenerator<string, void, unknown> {
    const systemInstruction = `Here is the analysis report data. Answer the user's questions based on this JSON:\n\n${JSON.stringify(reportContext, null, 2)}\n\n${followUpChatSystemInstruction}`;
    
    const contents: Content[] = history
        .filter(msg => msg.role !== 'system')
        .map(({ role, content }) => ({
            role: role === 'assistant' ? 'model' : 'user',
            parts: [{ text: content }],
        }));

    try {
        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        for await (const chunk of response) {
            yield chunk.text;
        }
    } catch(e) {
        console.error("Gemini Follow-up Stream Error:", e);
        throw new Error("Could not connect to the AI chat service. Please check your internet connection and try again.");
    }
}

// --- NEW AYURVEDA FUNCTIONS ---
export async function* runAyurvedicChatStream(
    prakruti: string,
    history: ChatMessage[]
): AsyncGenerator<string, void, unknown> {
    
    const contents: Content[] = history
        .filter(msg => msg.role !== 'system')
        .map(({ role, content }) => ({
            role: role === 'assistant' ? 'model' : 'user',
            parts: [{ text: content }],
        }));

    try {
        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                systemInstruction: ayurvedicChatSystemInstruction(prakruti),
            }
        });

        for await (const chunk of response) {
            yield chunk.text;
        }
    } catch(e) {
        console.error("Ayurvedic Chat Stream Error:", e);
        throw new Error("Could not connect to the Ayurvedic AI chat service. Please check your internet connection and try again.");
    }
}

// Generic function to process Gemini responses for robustness
const processGeminiJsonResponse = async (apiCall: Promise<any>, toolName: string) => {
    try {
        const response = await apiCall;

        if (!response.text && response?.promptFeedback?.blockReason) {
            throw new Error(`Analysis blocked for safety reasons: ${response.promptFeedback.blockReason}. For your safety, please consult a medical professional directly.`);
        }
        
        if (!response.text) {
            throw new Error("The AI returned an empty response. This could be due to a poor quality image or an issue with the service. Please try again.");
        }
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e: any) {
        console.error(`Gemini Service Error (${toolName}):`, e);
        if (e instanceof SyntaxError) {
            throw new Error("The AI returned data in an unexpected format. This can happen occasionally. Please try again.");
        }
        if (e.message.startsWith('Analysis blocked') || e.message.startsWith('The AI returned')) {
            throw e;
        }
        throw new Error(`Could not connect to the AI service for ${toolName}. Please check your internet connection and try again.`);
    }
};


export const analyzePrakrutiForm = async (formResponses: object) => {
    const prompt = `Here are the user's responses to the Prakruti questionnaire. Please analyze them and determine their Prakruti.\n\n${JSON.stringify(formResponses, null, 2)}`;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            prakruti_type: { type: Type.STRING, description: "The determined Prakruti type (e.g., 'Vata-Pitta')." },
            summary: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, hindi: { type: Type.STRING } }, description: 'A detailed summary of the analysis.' },
            recommendations: {
                type: Type.OBJECT,
                properties: {
                    diet: { type: Type.OBJECT, properties: { english: { type: Type.ARRAY, items: { type: Type.STRING } }, hindi: { type: Type.ARRAY, items: { type: Type.STRING } } } },
                    lifestyle: { type: Type.OBJECT, properties: { english: { type: Type.ARRAY, items: { type: Type.STRING } }, hindi: { type: Type.ARRAY, items: { type: Type.STRING } } } }
                }
            },
            disclaimer: { type: Type.STRING, description: "Standard disclaimer about consulting a professional." }
        }
    };
    
    return processGeminiJsonResponse(ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: prakrutiAnalysisSystemInstruction,
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    }), 'Prakruti Analysis');
};

export const analyzePrakrutiCertificate = async (payload: { imageData: string; mimeType: string }) => {
    const { imageData, mimeType } = payload;
    const imagePart = { inlineData: { data: imageData, mimeType } };
    const textPart = { text: "This is an image of an Ayurvedic Prakruti analysis certificate. Please perform OCR and extract the person's Prakruti type (e.g., Vata-Pitta, Pitta-Kapha, etc.) and a brief summary of any key findings if available. Return the result in a simple JSON format." };

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            prakruti_type: { type: Type.STRING, description: "The Prakruti type identified from the certificate." },
            summary: { type: Type.STRING, description: "A brief summary of findings from the certificate, if any." }
        }
    };
    
    return processGeminiJsonResponse(ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    }), 'Prakruti Certificate Analysis');
};


export const analyzeSymptoms = async (symptoms: string[]) => {
    const prompt = `Please analyze the following symptoms: ${symptoms.join(', ')}.`;
    const apiCall = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: symptomCheckerSystemInstruction,
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT, properties: { potentialCauses: { type: Type.ARRAY, description: 'A list of potential causes for the given symptoms.', items: { type: Type.OBJECT, properties: { cause: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, hindi: { type: Type.STRING } }, description: 'The name of the potential condition or cause.' }, description: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, hindi: { type: Type.STRING } }, description: 'A brief, easy-to-understand description of the cause.' }, likelihood: { type: Type.STRING, description: "Can be 'High', 'Medium', or 'Low'" } } } }, recommendations: { type: Type.OBJECT, properties: { english: { type: Type.ARRAY, items: { type: Type.STRING } }, hindi: { type: Type.ARRAY, items: { type: Type.STRING } } }, description: 'A list of actionable recommendations for the user.' }, severity: { type: Type.STRING, description: "An assessment of severity. Can be 'Mild', 'Moderate', 'Severe', or 'Seek immediate attention'" }, disclaimer: { type: Type.STRING, description: 'A mandatory disclaimer that this is not a medical diagnosis.' } } },
        },
    });
    return processGeminiJsonResponse(apiCall, "Symptom Checker");
};

export const findNearbyPharmacies = async (query: { lat: number, lng: number } | { address: string }) => {
    let prompt: string;
    if ('lat' in query) {
        prompt = `Find pharmacies near latitude ${query.lat} and longitude ${query.lng}.`;
    } else {
        prompt = `Find pharmacies near this location: "${query.address}".`;
    }

    const apiCall = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: findPharmaciesSystemInstruction,
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT, properties: { pharmacies: { type: Type.ARRAY, description: "A list of nearby pharmacies.", items: { type: Type.OBJECT, properties: { name: { type: Type.STRING, description: "The name of the pharmacy." }, address: { type: Type.STRING, description: "The full address of the pharmacy." }, phone_number: { type: Type.STRING, description: "The phone number of the pharmacy. Can be an empty string if not found." } }, required: ["name", "address"] } } }, required: ["pharmacies"] }
        }
    });
    
    const result = await processGeminiJsonResponse(apiCall, "Pharmacy Search");
    return result.pharmacies || [];
};

export const analyzePainLocation = async (primaryPain: string[], referredPain: string[]) => {
    let prompt = `Analyze the following pain locations. Primary pain points are located in: ${primaryPain.join(', ')}.`;
    if (referredPain.length > 0) {
        prompt += ` Referred pain points are in: ${referredPain.join(', ')}.`;
    }
    prompt += ' Provide potential conditions, notes, and a disclaimer.';

    const apiCall = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: painLocatorSystemInstruction,
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT, properties: { potentialConditions: { type: Type.ARRAY, description: "A list of potential conditions based on the pain locations.", items: { type: Type.OBJECT, properties: { name: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, hindi: { type: Type.STRING } } }, description: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, hindi: { type: Type.STRING } } }, likelihood: { type: Type.STRING, description: "Can be 'High', 'Medium', or 'Low'." }, specialist: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, hindi: { type: Type.STRING } } } }, required: ["name", "description", "likelihood", "specialist"] } }, notes: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, hindi: { type: Type.STRING } }, description: "General notes, advice, or next steps for the user." }, disclaimer: { type: Type.STRING, description: "A mandatory disclaimer stating this is not a medical diagnosis and to consult a doctor." } }, required: ["potentialConditions", "notes", "disclaimer"] },
        },
    });
    
    return processGeminiJsonResponse(apiCall, "Pain Locator");
};

export const checkDrugInteractions = async (drugA: string, drugB: string) => {
    const prompt = `Analyze the interaction between ${drugA} and ${drugB}.`;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: { interactions: { type: Type.ARRAY, description: 'A list of potential interactions between the two drugs.', items: { type: Type.OBJECT, properties: { severity: { type: Type.STRING, description: "Can be 'Severe', 'Moderate', 'Mild', or 'None'." }, description: { type: Type.STRING, description: 'A clear, simple explanation of the interaction and its risks.' }, }, required: ['severity', 'description'] } }, recommendation: { type: Type.STRING, description: 'A general recommendation for the user, e.g., consult a doctor.' }, disclaimer: { type: Type.STRING, description: 'Mandatory disclaimer.' } }
    };

    const apiCall = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { systemInstruction: drugInteractionSystemInstruction, responseMimeType: "application/json", responseSchema: responseSchema },
    });
    
    return processGeminiJsonResponse(apiCall, "Drug Interaction Checker");
};


// --- Image Analyzer Functions (Direct Call) ---

const bilingualArraySchema = { type: Type.OBJECT, properties: { english: { type: Type.ARRAY, items: { type: Type.STRING } }, hindi: { type: Type.ARRAY, items: { type: Type.STRING } } } };
const bilingualTextSchema = { type: Type.OBJECT, properties: { english: { type: Type.STRING }, hindi: { type: Type.STRING } } };

export const analyzeXRay = async (payload: { imageData: string; mimeType: string }) => {
    const { imageData, mimeType } = payload;
    const imagePart = { inlineData: { data: imageData, mimeType } };
    const textPart = { text: "Please analyze this chest X-ray image according to your instructions and return a structured bilingual response." };
    const apiCall = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: { systemInstruction: xrayAnalyzerSystemInstruction, responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { disclaimer: { type: Type.STRING }, detection: bilingualArraySchema, classification: bilingualArraySchema, localization: bilingualArraySchema, comparison: bilingualArraySchema, relationship: bilingualArraySchema, diagnostic_considerations: bilingualArraySchema, characterization: bilingualArraySchema, technical_notes: bilingualArraySchema } } },
    });
    return processGeminiJsonResponse(apiCall, "X-Ray Analysis");
};

export const analyzeLabReport = async (payload: { imageData: string; mimeType: string }) => {
    const { imageData, mimeType } = payload;
    const imagePart = { inlineData: { data: imageData, mimeType } };
    const textPart = { text: "Please analyze this lab test report from the image and return a structured bilingual response in JSON format." };
    const apiCall = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: { systemInstruction: labReportAnalyzerSystemInstruction, responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { disclaimer: { type: Type.STRING }, summary: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, hindi: { type: Type.STRING } } }, results: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { testName: { type: Type.STRING }, value: { type: Type.STRING }, referenceRange: { type: Type.STRING }, status: { type: Type.STRING }, interpretation: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, hindi: { type: Type.STRING } } } } } }, clinicalSignificance: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, hindi: { type: Type.STRING } } } } } },
    });
    return processGeminiJsonResponse(apiCall, "Lab Report Analysis");
};

export const analyzePrescription = async (payload: { imageData: string; mimeType: string }) => {
    const { imageData, mimeType } = payload;
    const imagePart = { inlineData: { data: imageData, mimeType } };
    const textPart = { text: "Analyze this prescription image and extract the details into the specified JSON format." };
    const apiCall = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: { systemInstruction: prescriptionAnalyzerSystemInstruction, responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { doctor_details: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, clinic: { type: Type.STRING } } }, patient_details: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, age: { type: Type.STRING } } }, medicines: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, dosage: { type: Type.STRING }, duration: { type: Type.STRING }, purpose: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, hindi: { type: Type.STRING } } } } } } } } },
    });
    return processGeminiJsonResponse(apiCall, "Prescription Analysis");
};

export const analyzeCTScan = async (payload: { imageData: string; mimeType: string }) => {
    const { imageData, mimeType } = payload;
    const imagePart = { inlineData: { data: imageData, mimeType } };
    const textPart = { text: "Please analyze this CT scan image and provide a structured bilingual report." };
    const apiCall = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: { systemInstruction: ctAnalyzerSystemInstruction, responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { disclaimer: { type: Type.STRING }, modality: { type: Type.STRING }, findings: bilingualArraySchema, impression: bilingualArraySchema, technical_notes: bilingualArraySchema } } },
    });
    return processGeminiJsonResponse(apiCall, "CT Scan Analysis");
};

export const analyzeMRIScan = async (payload: { imageData: string; mimeType: string }) => {
    const { imageData, mimeType } = payload;
    const imagePart = { inlineData: { data: imageData, mimeType } };
    const textPart = { text: "Please analyze this MRI scan image and provide a structured bilingual report." };
    const apiCall = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: { systemInstruction: mriAnalyzerSystemInstruction, responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { disclaimer: { type: Type.STRING }, body_part_and_sequences: { type: Type.STRING }, findings: bilingualArraySchema, impression: bilingualArraySchema, technical_notes: bilingualArraySchema } } },
    });
    return processGeminiJsonResponse(apiCall, "MRI Scan Analysis");
};

export const analyzeECG = async (payload: { imageData: string; mimeType: string }) => {
    const { imageData, mimeType } = payload;
    const imagePart = { inlineData: { data: imageData, mimeType } };
    const textPart = { text: "Please analyze this ECG image and provide a structured bilingual interpretation." };
    const apiCall = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: { systemInstruction: ecgAnalyzerSystemInstruction, responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { disclaimer: { type: Type.STRING }, rhythm_analysis: { type: Type.OBJECT, properties: { heart_rate: { type: Type.STRING }, rhythm: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, hindi: { type: Type.STRING } } } } }, intervals: { type: Type.OBJECT, properties: { pr: { type: Type.STRING }, qrs: { type: Type.STRING }, qt_qtc: { type: Type.STRING } } }, axis: { type: Type.STRING }, morphology: bilingualArraySchema, impression: bilingualArraySchema, technical_notes: bilingualArraySchema } } },
    });
    return processGeminiJsonResponse(apiCall, "ECG Analysis");
};

export const analyzeEEG = async (payload: { imageData: string; mimeType: string }) => {
    const { imageData, mimeType } = payload;
    const imagePart = { inlineData: { data: imageData, mimeType } };
    const textPart = { text: "Please analyze this EEG image/report and provide a structured bilingual interpretation." };
    const apiCall = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: { systemInstruction: eegAnalyzerSystemInstruction, responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { disclaimer: { type: Type.STRING }, background_activity: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, hindi: { type: Type.STRING } } }, abnormal_patterns: bilingualArraySchema, epileptiform_discharges: bilingualArraySchema, impression: bilingualArraySchema, technical_notes: bilingualArraySchema } } },
    });
    return processGeminiJsonResponse(apiCall, "EEG Analysis");
};

export const analyzeDermaScan = async (payload: { imageData: string; mimeType: string; overrideSafety: boolean }) => {
    const { imageData, mimeType, overrideSafety } = payload;
    const imagePart = { inlineData: { data: imageData, mimeType } };
    const textPart = { text: "Please analyze this image of a skin condition and return a structured bilingual JSON report." };
    
    const config: any = { 
        systemInstruction: dermaScanAnalyzerSystemInstruction, 
        responseMimeType: "application/json", 
        responseSchema: { type: Type.OBJECT, properties: { disclaimer: { type: Type.STRING }, skin_disease_name: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, hindi: { type: Type.STRING } } }, cause_factors: bilingualArraySchema, dos_and_donts: { type: Type.OBJECT, properties: { dos: bilingualArraySchema, donts: bilingualArraySchema } }, diagnostic_tests: bilingualArraySchema, suggested_medicine_keywords: { type: Type.ARRAY, items: { type: Type.STRING } }, learn_similar_cases: { type: Type.OBJECT, properties: { english: { type: Type.STRING }, hindi: { type: Type.STRING } } } } } 
    };

    if (overrideSafety) {
        config.safetySettings = [
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ];
    }
    
    const apiCall = ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, textPart] }, config: config });
    // This function needs special handling for its safety override feature
    try {
        const response = await apiCall;
        if (!response.text && response?.promptFeedback?.blockReason) {
            throw new Error(`Analysis blocked due to: ${response.promptFeedback.blockReason}.`);
        }
        if (!response.text) {
             throw new Error("The AI returned an empty response.");
        }
        return JSON.parse(response.text.trim());
    } catch (e: any) {
        console.error("Failed to parse Derma Scan analysis response:", e);
        // Rethrow the original error to be handled by the component's consent flow
        throw e;
    }
};

export const analyzeDiabeticRetinopathy = async (payload: { imageData: string; mimeType: string }) => {
    const { imageData, mimeType } = payload;
    const imagePart = { inlineData: { data: imageData, mimeType } };
    const textPart = { text: "Please analyze this retinal fundus image for Diabetic Retinopathy (DR) and Diabetic Macular Edema (DME) and provide a structured bilingual report." };
    const apiCall = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            systemInstruction: diabeticRetinopathyAnalyzerSystemInstruction,
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT, properties: { disclaimer: { type: Type.STRING }, dr_grading: { type: Type.NUMBER, description: "Diabetic Retinopathy grade from 0-4." }, dme_grading: { type: Type.STRING, description: "Diabetic Macular Edema grade (No DME, Mild, Moderate, Severe)." }, findings: bilingualTextSchema, recommendation: bilingualTextSchema } }
        },
    });
    return processGeminiJsonResponse(apiCall, "Diabetic Retinopathy Analysis");
};

export const searchMedicineGoogle = async (searchTerm: string) => {
    const prompt = `Provide a comprehensive description for the medicine "${searchTerm}". Structure your response with clear markdown headings for each section. Use '### Primary Uses', '### Common Dosages', '### Potential Side Effects', '### Important Precautions', and '### Pricing & Availability'. Within each section, bold key terms using **term**. The information should be well-structured for a patient to read.`;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        const text = response.text;
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        if (!text) {
             throw new Error("The AI returned an empty response. The medicine may not be found or the query was too broad.");
        }

        return { text, sources };

    } catch(e) {
        console.error("Failed to search medicine with Google:", e);
        throw new Error("An error occurred while searching for medicine information. Please try a different search term or check your network connection.");
    }
};