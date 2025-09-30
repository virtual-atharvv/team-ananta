import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { HeroSection } from '@/components/HeroSection';
import { DeepfakeCrisis } from '@/components/DeepfakeCrisis';
import { AISolution } from '@/components/AISolution';
import { KeyFeatures } from '@/components/KeyFeatures';
import { TechStack } from '@/components/TechStack';
import { LiveDemo } from '@/components/LiveDemo';
import { RealWorldImpact } from '@/components/RealWorldImpact';
import { TrustSection } from '@/components/TrustSection';
import { TeamSection } from '@/components/TeamSection';
import { useState } from 'react';

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const navItems = [
    { label: 'Crisis', id: 'crisis' },
    { label: 'Solution', id: 'solution' },
    { label: 'Features', id: 'features' },
    { label: 'Demo', id: 'demo' },
    { label: 'Impact', id: 'impact' },
    { label: 'Team', id: 'team' },
  ];

  return (
    <div className="min-h-screen bg-gradient-primary text-foreground">
      {/* Fixed Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
            >
              DeepFakeDetector
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-2 items-center">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => scrollToSection(item.id)}
                  className="text-sm"
                >
                  {item.label}
                </Button>
              ))}
              <Button onClick={() => scrollToSection('demo')} className="shadow-glow ml-2">
                Try Demo
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden pt-4 pb-2 space-y-2"
            >
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => scrollToSection(item.id)}
                  className="w-full justify-start"
                >
                  {item.label}
                </Button>
              ))}
              <Button onClick={() => scrollToSection('demo')} className="w-full shadow-glow">
                Try Demo
              </Button>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6">
        <HeroSection scrollToSection={scrollToSection} />
        <DeepfakeCrisis />
        <AISolution />
        <KeyFeatures />
        <TechStack />
        <LiveDemo />
        <RealWorldImpact />
        <TrustSection />
        <TeamSection />

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="py-12 text-center border-t border-border mt-16"
        >
          <p className="text-muted-foreground mb-4">
            © {new Date().getFullYear()} DeepFakeDetector — Built with ❤️ for the hackathon
          </p>
          <div className="flex gap-4 justify-center flex-wrap text-sm">
            <button onClick={() => scrollToSection('crisis')} className="text-muted-foreground hover:text-primary transition">
              Crisis
            </button>
            <button onClick={() => scrollToSection('solution')} className="text-muted-foreground hover:text-primary transition">
              Solution
            </button>
            <button onClick={() => scrollToSection('features')} className="text-muted-foreground hover:text-primary transition">
              Features
            </button>
            <button onClick={() => scrollToSection('demo')} className="text-muted-foreground hover:text-primary transition">
              Demo
            </button>
            <button onClick={() => scrollToSection('team')} className="text-muted-foreground hover:text-primary transition">
              Team
            </button>
          </div>
        </motion.footer>
      </div>
    </div>
  );
};

export default Index;
