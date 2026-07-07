"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export default function AnimatedBackground() {
  const canvasRef = useRef(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let particles = [];
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = {
      x: null,
      y: null,
      targetX: null,
      targetY: null,
      radius: 180,
    };

    // Handle Resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Track Mouse
    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.targetX = null;
      mouse.targetY = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Particle Config
    const particleCount = Math.min(Math.floor((width * height) / 25000), 75);
    const connectionDistance = 120;

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.size = Math.random() * 2 + 1;
        this.alpha = Math.random() * 0.5 + 0.2;
        this.baseAlpha = this.alpha;
      }

      update(resolvedTheme) {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce walls
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mouse hover interaction
        if (mouse.x !== null && mouse.y !== null) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            // Push gently away
            this.x += (dx / dist) * force * 0.6;
            this.y += (dy / dist) * force * 0.6;
            this.alpha = Math.min(this.baseAlpha + force * 0.6, 0.9);
          } else {
            this.alpha = this.baseAlpha;
          }
        } else {
          this.alpha = this.baseAlpha;
        }
      }

      draw(ctx, resolvedTheme) {
        const isDark = resolvedTheme === "dark";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = isDark
          ? `rgba(168, 85, 247, ${this.alpha})` // Purple in dark
          : `rgba(59, 130, 246, ${this.alpha * 0.6})`; // Blue in light
        ctx.fill();
      }
    }

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation Loop
    const animate = () => {
      // Lerp mouse positions for fluid tracking
      if (mouse.targetX !== null && mouse.targetY !== null) {
        if (mouse.x === null) {
          mouse.x = mouse.targetX;
          mouse.y = mouse.targetY;
        } else {
          mouse.x += (mouse.targetX - mouse.x) * 0.08;
          mouse.y += (mouse.targetY - mouse.y) * 0.08;
        }
      } else {
        mouse.x = null;
        mouse.y = null;
      }

      ctx.clearRect(0, 0, width, height);

      const isDark = resolvedTheme === "dark";

      // Draw mouse radial glow
      if (mouse.x !== null && mouse.y !== null) {
        const glowRadius = 250;
        const gradient = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          glowRadius
        );
        if (isDark) {
          gradient.addColorStop(0, "rgba(59, 130, 246, 0.07)"); // Electric blue
          gradient.addColorStop(0.5, "rgba(168, 85, 247, 0.03)"); // Purple
          gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        } else {
          gradient.addColorStop(0, "rgba(59, 130, 246, 0.06)");
          gradient.addColorStop(0.5, "rgba(6, 182, 212, 0.02)"); // Cyan
          gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        }
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update and draw particles
      particles.forEach((p) => {
        p.update(resolvedTheme);
        p.draw(ctx, resolvedTheme);
      });

      // Draw connections (Neural network lines)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.15;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            
            if (isDark) {
              // Blend gradient lines between nodes
              const lineGradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
              lineGradient.addColorStop(0, `rgba(59, 130, 246, ${alpha})`); // Cyan/blue
              lineGradient.addColorStop(1, `rgba(168, 85, 247, ${alpha})`); // Purple
              ctx.strokeStyle = lineGradient;
            } else {
              ctx.strokeStyle = `rgba(59, 130, 246, ${alpha * 0.8})`;
            }

            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [resolvedTheme]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 h-full w-full overflow-hidden">
      <div className="grid-bg absolute inset-0 h-full w-full" />
      <div className="noise-bg absolute inset-0 h-full w-full mix-blend-overlay" />
      
      {/* Glow Effects in Corners */}
      <div className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-brand-blue/10 blur-[120px] dark:bg-brand-blue/5 pointer-events-none" />
      <div className="absolute -bottom-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-brand-purple/10 blur-[120px] dark:bg-brand-purple/5 pointer-events-none" />

      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
