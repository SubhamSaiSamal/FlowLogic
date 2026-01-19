import { useState, useRef, useEffect, useCallback } from 'react';

export function useMLAnimation(stepFunction: () => void, speed: number = 1) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [iteration, setIteration] = useState(0);
    const frameRef = useRef<number>();

    const step = useCallback(() => {
        stepFunction();
        setIteration(i => i + 1);
    }, [stepFunction]);

    useEffect(() => {
        if (isPlaying) {
            const interval = 1000 / (speed * 2); // Speed multiplier
            const loop = setInterval(() => {
                step();
            }, interval);
            return () => clearInterval(loop);
        }
    }, [isPlaying, speed, step]);

    const togglePlay = () => setIsPlaying(!isPlaying);
    const reset = () => {
        setIsPlaying(false);
        setIteration(0);
    };

    return { isPlaying, togglePlay, reset, step, iteration };
}
