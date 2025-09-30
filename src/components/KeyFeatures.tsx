import { motion } from 'framer-motion';
import { Shield, Zap, Eye, LineChart, Lock, Cpu } from 'lucide-react';

export const KeyFeatures = () => {
  const features = [
    {
      icon: Shield,
      title: 'High Accuracy Detection',
      description: '95.8% accuracy rate with ensemble learning models trained on diverse datasets.',
    },
    {
      icon: Zap,
      title: 'Real-time Processing',
      description: 'Lightning-fast analysis with results in under 2 seconds per video.',
    },
    {
      icon: Eye,
      title: 'Explainable AI',
      description: 'Clear confidence metrics and detailed explanations for every detection.',
    },
    {
      icon: LineChart,
      title: 'Continuous Learning',
      description: 'Models continuously improve with new data and emerging deepfake techniques.',
    },
    {
      icon: Lock,
      title: 'Privacy First',
      description: 'Secure processing with no video storage and encrypted data transmission.',
    },
    {
      icon: Cpu,
      title: 'Scalable Architecture',
      description: 'Cloud-native infrastructure that scales to handle millions of requests.',
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Key Features</h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Built with cutting-edge technology to provide the most reliable deepfake detection available.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-gradient-card backdrop-blur-md rounded-2xl p-6 border border-border shadow-card-3d hover:shadow-glow transition-shadow group"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
