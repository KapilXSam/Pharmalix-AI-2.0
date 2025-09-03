import React, { useState } from 'react';
import { prakrutiQuestions, QuestionSection } from './prakrutiQuestions';
import { Button } from '../ui/Button';
import { ArrowLeft } from 'lucide-react';

interface PrakrutiQuestionnaireProps {
    onSubmit: (responses: Record<string, 'vata' | 'pitta' | 'kapha'>, scores: { vata: number; pitta: number; kapha: number }) => void;
    onBack: () => void;
}

const PrakrutiQuestionnaire: React.FC<PrakrutiQuestionnaireProps> = ({ onSubmit, onBack }) => {
    const [answers, setAnswers] = useState<Record<string, 'vata' | 'pitta' | 'kapha'>>({});
    const totalQuestions = prakrutiQuestions.reduce((acc, section) => acc + section.questions.length, 0);

    const handleAnswerChange = (questionId: string, dosha: 'vata' | 'pitta' | 'kapha') => {
        setAnswers(prev => ({ ...prev, [questionId]: dosha }));
    };

    const handleSubmit = () => {
        if (!isComplete) return;

        const scores = { vata: 0, pitta: 0, kapha: 0 };
        Object.values(answers).forEach(dosha => {
            scores[dosha]++;
        });
        
        onSubmit(answers, scores);
    };

    const isComplete = Object.keys(answers).length === totalQuestions;

    return (
        <div className="max-w-4xl mx-auto animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl">
                <div className="flex items-center mb-6">
                    <Button variant="ghost" size="icon" onClick={onBack} className="mr-4">
                        <ArrowLeft />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Prakruti Questionnaire</h1>
                        <p className="text-slate-500 dark:text-slate-400">Answer honestly based on your long-term tendencies.</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {prakrutiQuestions.map((section: QuestionSection, sectionIndex: number) => (
                        <div key={sectionIndex}>
                            <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-4 pb-2 border-b-2 border-emerald-500/20">{section.title}</h2>
                            <div className="space-y-6">
                                {section.questions.map(q => (
                                    <div key={q.id}>
                                        <p className="font-semibold text-lg mb-3 text-slate-800 dark:text-slate-200">{q.question}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {(['vata', 'pitta', 'kapha'] as const).map(dosha => (
                                                <label
                                                    key={dosha}
                                                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                                                        answers[q.id] === dosha
                                                            ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-500 shadow-md'
                                                            : 'bg-slate-50 dark:bg-slate-900/50 border-transparent hover:border-emerald-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={q.id}
                                                        value={dosha}
                                                        checked={answers[q.id] === dosha}
                                                        onChange={() => handleAnswerChange(q.id, dosha)}
                                                        className="sr-only"
                                                    />
                                                    <p className="text-sm text-slate-600 dark:text-slate-300">{q.options[dosha]}</p>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-slate-500 dark:text-slate-400 mb-4">{Object.keys(answers).length} of {totalQuestions} questions answered.</p>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isComplete}
                        size="lg"
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        {isComplete ? 'Submit for Analysis' : 'Please complete all questions'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default PrakrutiQuestionnaire;
