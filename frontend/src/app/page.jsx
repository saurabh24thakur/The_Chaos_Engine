import Navbar from "@/components/Navbar";
import AnimatedBackground from "@/components/AnimatedBackground";
import Hero from "@/components/Hero";
import Container from "@/components/Container";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col w-full">
      <AnimatedBackground />
      <Navbar />
      <Hero />
      <Container />
    </div>
  );
}
