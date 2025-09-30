import { motion } from 'framer-motion';
import { Newspaper, Briefcase, GraduationCap, Shield } from 'lucide-react';

export const RealWorldImpact = () => {
  const impacts = [
    {
      icon: Newspaper,
      title: 'Media & Journalism',
      description: 'Verify video authenticity before publication, protecting editorial integrity and preventing misinformation.',
      stat: '1000+',
      statLabel: 'News outlets protected',
    },
    {
      icon: Briefcase,
      title: 'Enterprise Security',
      description: 'Safeguard corporate communications and prevent deepfake-based fraud in video conferencing.',
      stat: '500+',
      statLabel: 'Companies secured',
    },
    {
      icon: GraduationCap,
      title: 'Education & Research',
      description: 'Academic institutions use our tools to study deepfakes and educate the next generation of researchers.',
      stat: '200+',
      statLabel: 'Research papers',
    },
    {
      icon: Shield,
      title: 'Law Enforcement',
      description: 'Assist investigations by verifying evidence and identifying manipulated content in criminal cases.',
      stat: '50+',
      statLabel: 'Agencies partnered',
    },
  ];

  return (
    <section id="impact" className="py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Real-World Impact</h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Our technology is actively protecting organizations and individuals across multiple sectors.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {impacts.map((impact, idx) => {
          const Icon = impact.icon;
          return (
            <motion.div
              key={impact.title}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-gradient-card backdrop-blur-md rounded-2xl p-8 border border-border shadow-card-3d"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{impact.title}</h3>
                  <p className="text-muted-foreground mb-4">{impact.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">{impact.stat}</span>
                    <span className="text-sm text-muted-foreground">{impact.statLabel}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
