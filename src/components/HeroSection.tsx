import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  scrollToSection: (id: string) => void;
}

export const HeroSection = ({ scrollToSection }: HeroSectionProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center py-16 md:py-24"
    >
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-6">
        DeepFakeDetector
      </h1>
      <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12">
        Advanced AI-powered deepfake detection technology that identifies manipulations with precision, protecting authenticity and trust in digital media.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-card backdrop-blur-md rounded-2xl p-6 border border-border shadow-card-3d"
        >
          <div className="text-4xl md:text-5xl font-bold text-primary mb-2">95.8%</div>
          <div className="text-sm text-muted-foreground">Accuracy Rate</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gradient-card backdrop-blur-md rounded-2xl p-6 border border-border shadow-card-3d"
        >
          <div className="text-4xl md:text-5xl font-bold text-primary mb-2">&lt;2s</div>
          <div className="text-sm text-muted-foreground">Processing Time</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gradient-card backdrop-blur-md rounded-2xl p-6 border border-border shadow-card-3d"
        >
          <div className="text-4xl md:text-5xl font-bold text-primary mb-2">24/7</div>
          <div className="text-sm text-muted-foreground">Real-time Detection</div>
        </motion.div>
      </div>

      <div className="flex gap-4 justify-center flex-wrap">
        <Button onClick={() => scrollToSection('demo')} size="lg" className="shadow-glow text-lg px-8">
          Try Live Demo
        </Button>
        <Button onClick={() => scrollToSection('solution')} variant="secondary" size="lg" className="text-lg px-8">
          Learn More
        </Button>
      </div>
    </motion.section>
  );
};
