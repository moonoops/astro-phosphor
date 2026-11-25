import { useEffect, useState } from 'react';

function formatClock(date: Date): string {
  const yyyy = String(date.getFullYear()).padStart(4, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

export default function Clock() {
  const [now, setNow] = useState<{ label: string; iso: string }>({
    label: '----/--/-- --:--',
    iso: '',
  });

  useEffect(() => {
    const update = () => {
      const current = new Date();
      setNow({ label: formatClock(current), iso: current.toISOString() });
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="clock-control">
      <time
        className="taskbar-clock"
        dateTime={now.iso || undefined}
        aria-label={`Local date and time ${now.label}`}
      >
        {now.label}
      </time>
    </div>
  );
}
