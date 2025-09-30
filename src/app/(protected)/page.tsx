"use client";

import { useEffect, useRef } from "react";

interface DataParticle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  targetIndex: number;
  size: number;
  speed: number;
  color: string;
  type: "csv" | "json" | "xml" | "postgres";
  trail: Array<{ x: number; y: number; alpha: number }>;
  rotation: number;
  offset: number;
  waveAmplitude: number;
  waveFrequency: number;
}

interface PathNode {
  x: number;
  y: number;
  label: string;
  pulse: number;
  processing: number;
  particleCount: number;
}

interface DataBurst {
  x: number;
  y: number;
  particles: Array<{
    angle: number;
    speed: number;
    life: number;
    color: string;
  }>;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = container.clientWidth;
    let height = container.clientHeight;

    const resizeCanvas = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width;
      canvas.height = height;
    };

    resizeCanvas();

    // Используем ResizeObserver для отслеживания изменений размера контейнера
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      initializeParticles();
    });
    resizeObserver.observe(container);

    const particles: DataParticle[] = [];
    const bursts: DataBurst[] = [];
    const particleCount = 80;
    
    const particleTypes = [
      { type: "csv" as const, color: "#3b82f6", label: "CSV" },
      { type: "json" as const, color: "#8b5cf6", label: "JSON" },
      { type: "xml" as const, color: "#06b6d4", label: "XML" },
      { type: "postgres" as const, color: "#10b981", label: "PG" },
    ];

    // Создание узлов пайплайна
    const pathNodes: PathNode[] = [
      { x: 0.15, y: 0.5, label: "Source", pulse: 0, processing: 0, particleCount: 0 },
      { x: 0.35, y: 0.3, label: "Extract", pulse: 0, processing: 0, particleCount: 0 },
      { x: 0.5, y: 0.5, label: "Transform", pulse: 0, processing: 0, particleCount: 0 },
      { x: 0.65, y: 0.7, label: "Load", pulse: 0, processing: 0, particleCount: 0 },
      { x: 0.85, y: 0.5, label: "Target", pulse: 0, processing: 0, particleCount: 0 },
    ];

    const initializeParticles = () => {
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        const particleType = particleTypes[Math.floor(Math.random() * particleTypes.length)];
        const startNode = pathNodes[0];
        particles.push({
          x: startNode.x * width,
          y: startNode.y * height + (Math.random() - 0.5) * 20,
          targetX: startNode.x * width,
          targetY: startNode.y * height,
          targetIndex: Math.floor(Math.random() * pathNodes.length),
          size: Math.random() * 3 + 2,
          speed: Math.random() * 0.6 + 0.3, // Замедлили с 1.5+1 до 0.6+0.3
          color: particleType.color,
          type: particleType.type,
          trail: [],
          rotation: Math.random() * Math.PI * 2,
          offset: Math.random() * Math.PI * 2,
          waveAmplitude: Math.random() * 15 + 10,
          waveFrequency: Math.random() * 0.015 + 0.005, // Замедлили волны
        });
      }
    };

    initializeParticles();

    let time = 0;

    const drawParticle = (particle: DataParticle) => {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);

      // Разные формы для разных типов данных
      ctx.fillStyle = particle.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = particle.color;

      switch (particle.type) {
        case "csv":
          // Квадрат для CSV
          ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
          break;
        case "json":
          // Фигурные скобки для JSON
          ctx.beginPath();
          ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "xml":
          // Треугольник для XML
          ctx.beginPath();
          ctx.moveTo(0, -particle.size);
          ctx.lineTo(particle.size, particle.size);
          ctx.lineTo(-particle.size, particle.size);
          ctx.closePath();
          ctx.fill();
          break;
        case "postgres":
          // Ромб для PostgreSQL
          ctx.beginPath();
          ctx.moveTo(0, -particle.size);
          ctx.lineTo(particle.size, 0);
          ctx.lineTo(0, particle.size);
          ctx.lineTo(-particle.size, 0);
          ctx.closePath();
          ctx.fill();
          break;
      }

      ctx.shadowBlur = 0;
      ctx.restore();
    };

    const drawNode = (node: PathNode) => {
      const x = node.x * width;
      const y = node.y * height;
      const baseRadius = 30;
      const pulseRadius = baseRadius + Math.sin(node.pulse) * 5;

      // Эффект обработки - многослойное свечение
      if (node.processing > 0) {
        for (let i = 0; i < 3; i++) {
          ctx.strokeStyle = `rgba(100, 200, 255, ${node.processing * (0.3 - i * 0.1)})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, pulseRadius + 15 + i * 8, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Вращающееся кольцо вокруг активных узлов
      if (node.particleCount > 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(time * 0.2); // Замедлили вращение кольца
        ctx.strokeStyle = `rgba(100, 200, 255, ${Math.min(node.particleCount / 10, 0.6)})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, pulseRadius + 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Основной круг узла с градиентом
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, pulseRadius);
      const intensity = Math.min(node.particleCount / 5, 1);
      gradient.addColorStop(0, `rgba(${80 + intensity * 50}, ${80 + intensity * 50}, ${80 + intensity * 100}, 0.9)`);
      gradient.addColorStop(1, "rgba(40, 40, 40, 0.7)");
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
      ctx.fill();

      // Внешняя обводка
      ctx.strokeStyle = `rgba(120, 120, 120, ${0.8 + intensity * 0.2})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const animate = () => {
      time += 0.016;

      // Очистка с эффектом следа
      ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
      ctx.fillRect(0, 0, width, height);

      // Рисуем соединительные линии между узлами - анимированные
      ctx.strokeStyle = "rgba(80, 80, 80, 0.3)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = -time * 50;
      
      ctx.beginPath();
      pathNodes.forEach((node, i) => {
        const x = node.x * width;
        const y = node.y * height;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Рисуем энергетические потоки между узлами
      for (let i = 0; i < pathNodes.length - 1; i++) {
        const node1 = pathNodes[i];
        const node2 = pathNodes[i + 1];
        const x1 = node1.x * width;
        const y1 = node1.y * height;
        const x2 = node2.x * width;
        const y2 = node2.y * height;

        // Волнообразный энергетический поток (замедлили)
        const flowProgress = (time * 0.15 + i) % 1;
        const flowX = x1 + (x2 - x1) * flowProgress;
        const flowY = y1 + (y2 - y1) * flowProgress;

        const gradient = ctx.createRadialGradient(flowX, flowY, 0, flowX, flowY, 15);
        gradient.addColorStop(0, "rgba(100, 200, 255, 0.4)");
        gradient.addColorStop(1, "rgba(100, 200, 255, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(flowX, flowY, 15, 0, Math.PI * 2);
        ctx.fill();
      }

      // Обновляем пульсацию узлов и сбрасываем счётчики
      pathNodes.forEach((node) => {
        node.pulse += 0.03; // Замедлили пульсацию
        if (node.processing > 0) {
          node.processing -= 0.01; // Медленнее затухание
        }
        node.particleCount = 0;
      });

      // Обновляем и рисуем частицы
      particles.forEach((particle) => {
        // Добавляем в след
        particle.trail.push({
          x: particle.x,
          y: particle.y,
          alpha: 1,
        });

        if (particle.trail.length > 25) {
          particle.trail.shift();
        }

        // Рисуем след с градиентом
        particle.trail.forEach((point, i) => {
          const alpha = (i / particle.trail.length) * 0.5;
          const trailSize = particle.size * (i / particle.trail.length) * 0.9;
          ctx.fillStyle = particle.color.replace(")", `, ${alpha})`).replace("rgb", "rgba").replace("#", "rgba(") || `rgba(100, 100, 100, ${alpha})`;
          ctx.beginPath();
          ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2);
          ctx.fill();
        });

        // Движение к целевой точке с волновым эффектом
        const targetNode = pathNodes[particle.targetIndex];
        particle.targetX = targetNode.x * width;
        particle.targetY = targetNode.y * height;

        const dxTarget = particle.targetX - particle.x;
        const dyTarget = particle.targetY - particle.y;
        const distance = Math.sqrt(dxTarget * dxTarget + dyTarget * dyTarget);

        if (distance < 15) {
          // Достигли узла - активируем обработку
          targetNode.processing = 1;
          targetNode.particleCount++;
          
          // Создаём взрыв данных на узле Transform
          if (particle.targetIndex === 2 && Math.random() < 0.15) {
            bursts.push({
              x: particle.x,
              y: particle.y,
              particles: Array.from({ length: 8 }, (_, i) => ({
                angle: (i / 8) * Math.PI * 2,
                speed: Math.random() * 3 + 2,
                life: 1,
                color: particle.color,
              })),
            });
          }
          
          // Переходим к следующему узлу
          particle.targetIndex = (particle.targetIndex + 1) % pathNodes.length;
          
          // Меняем цвет и тип при трансформации
          if (particle.targetIndex === 2) {
            const newType = particleTypes[Math.floor(Math.random() * particleTypes.length)];
            particle.color = newType.color;
            particle.type = newType.type;
          }
        } else {
          // Основное движение с добавлением волнового эффекта
          const dirX = dxTarget / distance;
          const dirY = dyTarget / distance;
          
          // Перпендикулярное направление для волн
          const perpX = -dirY;
          const perpY = dirX;
          
          // Волновое смещение
          const waveOffset = Math.sin(time * particle.waveFrequency + particle.offset) * particle.waveAmplitude;
          
          particle.x += dirX * particle.speed + perpX * waveOffset * 0.05;
          particle.y += dirY * particle.speed + perpY * waveOffset * 0.05;
        }

        // Вращение зависит от скорости (замедлили)
        particle.rotation += particle.speed * 0.015;

        drawParticle(particle);
      });

      // Обновляем и рисуем взрывы данных
      bursts.forEach((burst, burstIdx) => {
        burst.particles.forEach((bp) => {
          bp.life -= 0.02;
          
          if (bp.life > 0) {
            const burstX = burst.x + Math.cos(bp.angle) * bp.speed * (1 - bp.life) * 20;
            const burstY = burst.y + Math.sin(bp.angle) * bp.speed * (1 - bp.life) * 20;
            
            ctx.fillStyle = bp.color.replace(")", `, ${bp.life * 0.6})`).replace("rgb", "rgba").replace("#", "rgba(") || `rgba(100, 100, 100, ${bp.life})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = bp.color;
            ctx.beginPath();
            ctx.arc(burstX, burstY, 3 * bp.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });
        
        // Удаляем завершённые взрывы
        if (burst.particles.every(bp => bp.life <= 0)) {
          bursts.splice(burstIdx, 1);
        }
      });

      // Рисуем узлы
      pathNodes.forEach((node) => {
        drawNode(node);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
      />
      <div className="absolute top-0 left-0 right-0 pt-12 flex justify-center pointer-events-none">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-3 opacity-70 drop-shadow-lg">
            Data Pipelines
          </h1>
          <p className="text-xl text-gray-400 opacity-50">
            Визуализация ETL-процессов
          </p>
        </div>
      </div>
    </div>
  );
}
