import { useState, useRef, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { PortalPopover } from './PortalPopover'

interface CustomTimePickerProps {
  value: string
  onChange: (time: string) => void
  className?: string
  placeholder?: string
}

export default function CustomTimePicker({ value, onChange, className = '', placeholder = '选择时间' }: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLButtonElement>(null)
  
  const initialHour = value ? value.split(':')[0] : '09'
  const initialMinute = value ? value.split(':')[1] : '00'
  const [hour, setHour] = useState(initialHour)
  const [minute, setMinute] = useState(initialMinute)

  useEffect(() => {
    if (value) {
      setHour(value.split(':')[0] || '09')
      setMinute(value.split(':')[1] || '00')
    }
  }, [value])

  // Removing the click-outside useEffect since PortalPopover handles it


  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

  const handleHourSelect = (h: string) => {
    setHour(h)
    onChange(`${h}:${minute}`)
  }

  const handleMinuteSelect = (m: string) => {
    setMinute(m)
    onChange(`${hour}:${m}`)
  }

  const ScrollColumn = ({ items, value, onSelect }: { items: string[], value: string, onSelect: (val: string) => void }) => {
    const itemHeight = 32;
    
    // Circular Linked List implementation
    const [headNode] = useState(() => {
      class ListNode {
        value: string;
        next: ListNode | null = null;
        prev: ListNode | null = null;
        constructor(val: string) { this.value = val; }
      }
      const head = new ListNode(items[0]);
      let curr = head;
      for (let i = 1; i < items.length; i++) {
        const n = new ListNode(items[i]);
        curr.next = n;
        n.prev = curr;
        curr = n;
      }
      curr.next = head;
      head.prev = curr;
      return head;
    });

    const [currentNode, setCurrentNode] = useState(() => {
      let curr = headNode;
      while (curr.value !== value) {
        curr = curr.next!;
        if (curr === headNode) break;
      }
      return curr;
    });

    const [offsetY, setOffsetY] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    
    const offsetRef = useRef(0);
    const startY = useRef(0);
    const currentY = useRef(0);
    const isDragging = useRef(false);
    const velocity = useRef(0);
    const lastTime = useRef(0);
    const animationRef = useRef<number>(0);
    const wheelTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const updateOffset = (newOffset: number) => {
      offsetRef.current = newOffset;
      setOffsetY(newOffset);
    };

    useEffect(() => {
      if (isDragging.current || isAnimating) return;
      let curr = headNode;
      while (curr.value !== value) {
        curr = curr.next!;
        if (curr === headNode) break;
      }
      setCurrentNode(curr);
    }, [value, headNode, isAnimating]);

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
      isDragging.current = true;
      setIsAnimating(false);
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
      startY.current = y - offsetRef.current;
      currentY.current = y;
      velocity.current = 0;
      lastTime.current = performance.now();
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDragging.current) return;
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaY = y - startY.current;
      
      const now = performance.now();
      const dt = now - lastTime.current;
      if (dt > 0) {
        velocity.current = (y - currentY.current) / dt;
      }
      lastTime.current = now;
      currentY.current = y;
      
      updateOffset(deltaY);
    };

    const commitOffset = (finalOffset: number) => {
      const steps = Math.round(finalOffset / itemHeight);
      let node = currentNode;
      if (steps > 0) {
        for (let i = 0; i < steps; i++) node = node.prev!;
      } else {
        for (let i = 0; i < Math.abs(steps); i++) node = node.next!;
      }
      setCurrentNode(node);
      updateOffset(0);
      onSelect(node.value);
    };

    const handleTouchEnd = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      setIsAnimating(true);
      
      let currentOffset = offsetRef.current;
      let vel = velocity.current * 16; 

      const animate = () => {
        if (Math.abs(vel) > 0.5) {
          currentOffset += vel;
          vel *= 0.95; 
          updateOffset(currentOffset);
          animationRef.current = requestAnimationFrame(animate);
        } else {
          const remainder = currentOffset % itemHeight;
          const targetOffset = currentOffset - remainder + (Math.abs(remainder) > itemHeight / 2 ? Math.sign(currentOffset) * itemHeight : 0);
          
          const snapAnimate = () => {
            currentOffset += (targetOffset - currentOffset) * 0.2;
            updateOffset(currentOffset);
            if (Math.abs(targetOffset - currentOffset) > 0.5) {
              animationRef.current = requestAnimationFrame(snapAnimate);
            } else {
              commitOffset(targetOffset);
              setIsAnimating(false);
            }
          };
          snapAnimate();
        }
      };
      animate();
    };

    const handleWheel = (e: React.WheelEvent) => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      updateOffset(offsetRef.current - e.deltaY * 0.5);
      
      if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
      wheelTimeout.current = setTimeout(() => {
        setIsAnimating(true);
        let currentOffset = offsetRef.current;
        const remainder = currentOffset % itemHeight;
        const targetOffset = currentOffset - remainder + (Math.abs(remainder) > itemHeight / 2 ? Math.sign(currentOffset) * itemHeight : 0);
        
        const snapAnimate = () => {
          currentOffset += (targetOffset - currentOffset) * 0.2;
          updateOffset(currentOffset);
          if (Math.abs(targetOffset - currentOffset) > 0.5) {
            animationRef.current = requestAnimationFrame(snapAnimate);
          } else {
            commitOffset(targetOffset);
            setIsAnimating(false);
          }
        };
        snapAnimate();
      }, 150);
    };

    // Calculate dynamic visual center based on how far we have dragged
    const stepOffset = Math.round(offsetY / itemHeight);
    let visualCenterNode = currentNode;
    if (stepOffset > 0) {
      for (let i = 0; i < stepOffset; i++) visualCenterNode = visualCenterNode.prev!;
    } else {
      for (let i = 0; i < Math.abs(stepOffset); i++) visualCenterNode = visualCenterNode.next!;
    }
    const visualOffsetY = offsetY - stepOffset * itemHeight;

    const renderNodes = [
      visualCenterNode.prev!.prev!.prev!,
      visualCenterNode.prev!.prev!,
      visualCenterNode.prev!,
      visualCenterNode,
      visualCenterNode.next!,
      visualCenterNode.next!.next!,
      visualCenterNode.next!.next!.next!
    ];

    return (
      <div 
        className="relative h-full w-full flex-1 overflow-hidden touch-none select-none cursor-grab active:cursor-grabbing"
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <div className="absolute top-1/2 left-0 right-0 h-8 -translate-y-1/2 bg-brand/10 border-y border-brand/20 pointer-events-none rounded-lg z-0" />
        
        <div 
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
          style={{ transform: `translateY(${visualOffsetY}px)` }}
        >
          {renderNodes.map((node, i) => {
            const exactIndex = 3 - visualOffsetY / itemHeight;
            const diff = Math.abs(i - exactIndex);
            
            const opacity = Math.max(0.1, 1 - diff * 0.4);
            const scale = Math.max(0.8, 1.1 - diff * 0.15);
            
            return (
              <div key={i} className="h-8 flex items-center justify-center w-full">
                 <span 
                   className={`transition-none font-medium ${diff < 0.5 ? 'text-brand font-bold' : 'text-text-primary'}`}
                   style={{ opacity, transform: `scale(${scale})` }}
                 >
                   {node.value}
                 </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <>
      <button
        ref={containerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-3 py-2 bg-bg-secondary text-text-primary border border-border-default rounded-xl outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all duration-200 text-left ${className}`}
      >
        <Clock size={16} className="text-text-secondary shrink-0" />
        <span className="truncate text-sm font-medium flex-1">
          {value || <span className="text-text-secondary">{placeholder}</span>}
        </span>
      </button>

      <PortalPopover 
        isOpen={isOpen} 
        onClose={() => {
          onChange(`${hour}:${minute}`)
          setIsOpen(false)
        }} 
        triggerRef={containerRef} 
        width={140} 
        height={200}
      >
        <div className="glass bg-bg-secondary/95 backdrop-blur-xl rounded-2xl border border-border-subtle shadow-xl overflow-hidden p-2 flex gap-2 h-48 min-w-[140px]">
          {/* Hours */}
          <div className="flex-1 border-r border-border-subtle pr-1 flex flex-col">
            <ScrollColumn items={hours} value={hour} onSelect={handleHourSelect} />
          </div>
          {/* Minutes */}
          <div className="flex-1 pl-1 flex flex-col">
            <ScrollColumn items={minutes} value={minute} onSelect={handleMinuteSelect} />
          </div>
        </div>
      </PortalPopover>
    </>
  )
}
