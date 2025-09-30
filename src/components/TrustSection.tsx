import { motion } from 'framer-motion';
import { CheckCircle2, Shield, Globe, Users } from 'lucide-react';

export const TrustSection = () => {
  const values = [
    {
      icon: Shield,
      title: 'Transparency',
      description: 'Open about our methods, limitations, and continuous improvement efforts.',
    },
    {
      icon: Globe,
      title: 'Accessibility',
      description: 'Making advanced deepfake detection available to everyone, everywhere.',
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'Working with researchers, institutions, and communities worldwide.',
    },
    {
      icon: CheckCircle2,
      title: 'Ethics First',
      description: 'Committed to responsible AI development and privacy protection.',
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 rounded-3xl p-8 md:p-12 border border-primary/30 shadow-glow"
      >
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Building a Trustworthy Digital Future</h2>
          <p className="text-lg md:text-xl text-foreground/90 max-w-3xl mx-auto">
            In a world where seeing is no longer believing, we're committed to restoring trust in digital media through advanced AI detection and ethical practices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, idx) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-background/50 backdrop-blur-sm rounded-xl p-6 border border-border text-center"
              >
                <Icon className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-bold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-lg text-foreground/90 mb-6">
            Join us in the fight against deepfake manipulation. Together, we can preserve truth and authenticity in the digital age.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <span className="px-6 py-3 bg-primary/20 rounded-full font-semibold border border-primary/30">
              ✓ Open Research
            </span>
            <span className="px-6 py-3 bg-primary/20 rounded-full font-semibold border border-primary/30">
              ✓ Community Driven
            </span>
            <span className="px-6 py-3 bg-primary/20 rounded-full font-semibold border border-primary/30">
              ✓ Privacy Protected
            </span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};
