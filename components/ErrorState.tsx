import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';

interface ErrorStateProps {
    message: string;
    onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
    return (
        <Card className="w-full max-w-lg text-center border-[hsl(var(--destructive))] animate-fadeIn">
            <CardHeader>
                <div className="mx-auto bg-[hsl(var(--destructive))]/10 p-3 rounded-full w-fit">
                    <AlertTriangle className="h-8 w-8 text-[hsl(var(--destructive))]" />
                </div>
                <CardTitle className="mt-4 !text-[hsl(var(--destructive))]">An Error Occurred</CardTitle>
                <CardDescription className="text-[hsl(var(--destructive))] opacity-90">{message}</CardDescription>
            </CardHeader>
            {onRetry && (
                <CardContent>
                    <Button onClick={onRetry} variant="destructive">
                        Try Again
                    </Button>
                </CardContent>
            )}
        </Card>
    );
};

export default ErrorState;
