import { motion } from 'framer-motion';

import atharvPhoto from '@/assets/atharv.jpg';
import varunPhoto from '@/assets/varun.jpg';
import kanakPhoto from '@/assets/kanak.jpg';
import ayushPhoto from '@/assets/ayush.jpg';
import saraPhoto from '@/assets/sara.jpg';

interface TeamMember {
  name: string;
  linkedin: string;
  photo: string;
}

export const TeamSection = () => {
  const team: TeamMember[] = [
    { name: 'Atharv Maurya', linkedin: 'https://www.linkedin.com/in/atharv-maurya', photo: atharvPhoto },
    { name: 'Varun Dev Mishra', linkedin: 'https://www.linkedin.com/in/varun-dev-mishra', photo: varunPhoto },
    { name: 'Kanak Gihar', linkedin: 'https://www.linkedin.com/in/kanak-gihar', photo: kanakPhoto },
    { name: 'Ayush Katiyar', linkedin: 'https://www.linkedin.com/in/ayush-katiyar', photo: ayushPhoto },
    { name: 'Sara Khan', linkedin: 'https://www.linkedin.com/in/sara-khan', photo: saraPhoto },
  ];

  return (
    <section id="team" className="py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Team</h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Meet the passionate team behind DeepFakeDetector — dedicated to building a safer digital future.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {team.map((member, idx) => (
          <motion.a
            key={member.name}
            href={member.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center bg-gradient-card backdrop-blur-md p-6 rounded-2xl border border-border shadow-card-3d hover:shadow-glow transition-all"
          >
            <img
              src={member.photo}
              alt={member.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-primary/30 mb-4"
            />
            <div className="text-center">
              <div className="font-semibold text-lg mb-1">{member.name}</div>
              <div className="text-sm text-muted-foreground">Connect on LinkedIn →</div>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
};
