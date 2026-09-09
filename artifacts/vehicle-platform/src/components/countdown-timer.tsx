import { useState, useEffect } from "react";

interface CountdownTimerProps {
  endTime: string;
  onEnd?: () => void;
  className?: string;
}

export function CountdownTimer({ endTime, onEnd, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isEnded: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: false });

  useEffect(() => {
    const end = new Date(endTime).getTime();

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = end - now;

      if (difference <= 0) {
        if (!timeLeft.isEnded && onEnd) {
          onEnd();
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isEnded: true };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        isEnded: false,
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, onEnd, timeLeft.isEnded]);

  if (timeLeft.isEnded) {
    return (
      <div className={`font-mono font-bold text-destructive ${className}`}>
        AUCTION ENDED
      </div>
    );
  }

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 1;

  return (
    <div className={`font-mono flex items-center gap-1.5 ${isUrgent ? 'text-primary animate-pulse' : 'text-foreground'} ${className}`}>
      {timeLeft.days > 0 && (
        <div className="flex flex-col items-center">
          <span className="text-lg leading-none">{timeLeft.days.toString().padStart(2, '0')}</span>
          <span className="text-[10px] text-muted-foreground uppercase">D</span>
        </div>
      )}
      {timeLeft.days > 0 && <span className="text-muted-foreground mb-3">:</span>}
      
      <div className="flex flex-col items-center">
        <span className="text-lg leading-none">{timeLeft.hours.toString().padStart(2, '0')}</span>
        <span className="text-[10px] text-muted-foreground uppercase">H</span>
      </div>
      <span className="text-muted-foreground mb-3">:</span>
      
      <div className="flex flex-col items-center">
        <span className="text-lg leading-none">{timeLeft.minutes.toString().padStart(2, '0')}</span>
        <span className="text-[10px] text-muted-foreground uppercase">M</span>
      </div>
      <span className="text-muted-foreground mb-3">:</span>
      
      <div className="flex flex-col items-center">
        <span className="text-lg leading-none">{timeLeft.seconds.toString().padStart(2, '0')}</span>
        <span className="text-[10px] text-muted-foreground uppercase">S</span>
      </div>
    </div>
  );
}
