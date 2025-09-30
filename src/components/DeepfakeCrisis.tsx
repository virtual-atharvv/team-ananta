import { motion } from 'framer-motion';
import { AlertCircle, Shield, Users, TrendingDown } from 'lucide-react';

export const DeepfakeCrisis = () => {
  const stats = [
    { value: '127%', label: 'Increase in deepfakes (2023)', icon: TrendingDown },
    { value: '₹2.1L Cr', label: 'Annual fraud losses', icon: AlertCircle },
    { value: '45M', label: 'Videos analyzed daily', icon: Users },
    { value: '89%', label: 'Go undetected', icon: Shield },
  ];

  const threats = [
    {
      title: 'Identity Theft & Fraud',
      description: 'Deepfakes enable sophisticated identity fraud, allowing criminals to impersonate others in video calls and authentication systems.',
      icon: '🎭',
    },
    {
      title: 'Misinformation Campaigns',
      description: 'Fake videos of public figures can spread false information rapidly, undermining democratic processes and public trust.',
      icon: '📰',
    },
    {
      title: 'Personal Harassment',
      description: 'Non-consensual deepfake content causes emotional harm and reputation damage to innocent individuals.',
      icon: '⚠️',
    },
    {
      title: 'Erosion of Truth',
      description: 'As deepfakes become more realistic, society loses its ability to distinguish between authentic and manipulated content.',
      icon: '🔍',
    },
  ];

  return (
    <section id="crisis" className="py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4">The Deepfake Crisis</h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Deepfake technology has reached a tipping point. What once required Hollywood-level resources can now be created by anyone with a smartphone. The implications are staggering.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-gradient-card backdrop-blur-md rounded-2xl p-6 border border-border text-center"
            >
              <Icon className="w-8 h-8 text-primary mx-auto mb-3" />
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {threats.map((threat, idx) => (
          <motion.div
            key={threat.title}
            initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="bg-gradient-card backdrop-blur-md rounded-2xl p-6 border border-border shadow-card-3d"
          >
            <div className="text-4xl mb-3">{threat.icon}</div>
            <h3 className="text-xl font-bold mb-3">{threat.title}</h3>
            <p className="text-muted-foreground">{threat.description}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-12 bg-gradient-to-br from-accent/20 to-primary/20 rounded-3xl p-8 border border-primary/30 text-center"
      >
        <h3 className="text-2xl md:text-3xl font-bold mb-3">The Time for Action is Now</h3>
        <p className="text-lg text-foreground/90 max-w-3xl mx-auto">
          As deepfake technology evolves, so must our detection capabilities. DeepFakeDetector represents the next generation of digital authenticity verification.
        </p>
      </motion.div>
    </section>
  );
};
