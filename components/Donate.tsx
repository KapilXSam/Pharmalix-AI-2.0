import React, { useState } from 'react';
import { HeartHandshake } from 'lucide-react';

const StatPill: React.FC<{ value: string; label: string }> = ({ value, label }) => (
    <div className="bg-sky-100 dark:bg-sky-900/50 p-4 rounded-lg text-center">
        <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">{value}</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
    </div>
);

// Base64 encoded QR Code provided by the user
const GPayQrCode = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAEAAQADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigA...';

const Donate: React.FC = () => {
    const [copied, setCopied] = useState(false);

    const handleCopyUpi = () => {
        const upiId = 'kapilmishra0272000@okaxis';
        navigator.clipboard.writeText(upiId).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        });
    };

    return (
        <div className="max-w-4xl mx-auto animate-slide-in space-y-8">
            {/* Medical Aid Donation Card */}
            <div className="bg-[hsl(var(--card))] rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 md:p-12">
                    <div className="text-center">
                        <HeartHandshake className="h-16 w-16 mx-auto text-sky-500 mb-4" />
                        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3">Support Medical Aid</h2>
                        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                            Your contribution can make a significant difference. By donating, you help us provide essential medical services, connect patients with doctors, and deliver aid to underserved communities.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
                        <StatPill value="12,000+" label="Patients Helped" />
                        <StatPill value="500+" label="Doctors Connected" />
                        <StatPill value="25+" label="Communities Served" />
                    </div>

                    <div className="mt-8 text-center">
                         <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Make a Donation</h3>
                         <div className="flex justify-center flex-wrap gap-4 mb-6">
                            {[25, 50, 100, 250].map((amount) => (
                                <button key={amount} className="px-8 py-3 bg-white dark:bg-slate-700 border-2 border-sky-500 text-sky-500 font-bold rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/50 transition-colors">
                                    ${amount}
                                </button>
                            ))}
                             <button className="px-8 py-3 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                                Other
                            </button>
                         </div>
                         <button className="w-full max-w-xs bg-sky-600 text-white font-bold py-4 px-6 rounded-xl text-lg hover:bg-sky-700 transition-transform transform hover:scale-105 shadow-lg">
                            Donate Now
                        </button>
                    </div>
                </div>
                 <div className="bg-slate-50 dark:bg-slate-800/50 p-8 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-3">How Your Donation Helps</h4>
                    <ul className="space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside">
                        <li><span className="font-semibold">Subsidized Consultations:</span> Cover the cost of a virtual doctor's visit for someone in need.</li>
                        <li><span className="font-semibold">Medicine Access:</span> Provide essential medications to patients who cannot afford them.</li>
                        <li><span className="font-semibold">Technology Improvement:</span> Help us maintain and improve the AI-powered tools that provide instant assistance.</li>
                        <li><span className="font-semibold">Community Outreach:</span> Support our efforts to bring healthcare services to remote and rural areas.</li>
                    </ul>
                </div>
            </div>

            {/* Support the Dev Card */}
            <div className="bg-[hsl(var(--card))] rounded-2xl shadow-xl p-8 md:p-12">
                 <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Buy the Dev a Coffee ☕</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        If you enjoy using Pharmalix AI, consider supporting the developer's work with a small donation via UPI. Your support helps in maintaining and improving the app.
                    </p>
                </div>
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg">
                    <div className="bg-white p-3 rounded-lg shadow-md">
                        <img src={GPayQrCode} alt="GPay QR Code for kapilmishra0272000@okaxis" className="h-32 w-32" />
                    </div>
                    <div className="text-center md:text-left">
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Scan to Pay with any UPI App</p>
                        <p className="text-lg font-mono text-slate-800 dark:text-slate-200 my-2">kapilmishra0272000@okaxis</p>
                        <button
                            onClick={handleCopyUpi}
                            className="w-full md:w-auto px-4 py-2 text-sm font-semibold bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors disabled:bg-green-500 disabled:hover:bg-green-500"
                            disabled={copied}
                        >
                            {copied ? 'UPI ID Copied!' : 'Copy UPI ID'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Donate;