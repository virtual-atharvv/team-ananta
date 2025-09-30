import { motion } from 'framer-motion';
import { Brain, Scan, CheckCircle2, Zap } from 'lucide-react';

export const AISolution = () => {
  const steps = [
    {
      number: '01',
      title: 'Frame Extraction',
      description: 'Advanced computer vision extracts key frames from uploaded videos using intelligent sampling techniques.',
      icon: Scan,
    },
    {
      number: '02',
      title: 'Deep Neural Analysis',
      description: 'Ensemble detector evaluates artifacts, facial landmarks, and temporal inconsistencies using state-of-the-art deep learning models.',
      icon: Brain,
    },
    {
      number: '03',
      title: 'Temporal Smoothing',
      description: 'Frame-level scores are aggregated using temporal smoothing algorithms to produce a robust video-level confidence metric.',
      icon: Zap,
    },
    {
      number: '04',
      title: 'Confidence Report',
      description: 'Detailed analysis report with confidence scores, suspicious patterns, and visual explanations for transparency.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="solution" className="py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Our AI Solution</h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          DeepFakeDetector combines cutting-edge machine learning with advanced computer vision to detect even the most sophisticated face-swap deepfakes.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-gradient-card backdrop-blur-md rounded-2xl p-8 border border-border shadow-card-3d relative overflow-hidden group hover:scale-[1.02] transition-transform"
            >
              <div className="absolute top-0 right-0 text-[120px] font-bold text-primary/5 leading-none">
                {step.number}
              </div>
              <Icon className="w-12 h-12 text-primary mb-4 relative z-10" />
              <h3 className="text-2xl font-bold mb-3 relative z-10">{step.title}</h3>
              <p className="text-muted-foreground relative z-10">{step.description}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
