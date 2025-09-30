import { motion } from 'framer-motion';

export const TechStack = () => {
  const technologies = [
    {
      category: 'Deep Learning',
      items: ['PyTorch', 'TensorFlow', 'XceptionNet', 'EfficientNet', 'Vision Transformers'],
      color: 'from-blue-500/20 to-cyan-500/20',
    },
    {
      category: 'Computer Vision',
      items: ['OpenCV', 'MediaPipe', 'MTCNN', 'Dlib', 'Face Recognition'],
      color: 'from-purple-500/20 to-pink-500/20',
    },
    {
      category: 'Backend',
      items: ['Python Flask', 'Node.js', 'Express', 'Redis', 'WebSockets'],
      color: 'from-green-500/20 to-emerald-500/20',
    },
    {
      category: 'Frontend',
      items: ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Vite'],
      color: 'from-orange-500/20 to-amber-500/20',
    },
    {
      category: 'Datasets',
      items: ['FaceForensics++', 'Celeb-DF', 'DFDC', 'DeepFake Detection Challenge'],
      color: 'from-red-500/20 to-rose-500/20',
    },
    {
      category: 'Infrastructure',
      items: ['AWS/GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Load Balancing'],
      color: 'from-indigo-500/20 to-violet-500/20',
    },
  ];

  return (
    <section id="tech-stack" className="py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Technology Stack</h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Built with industry-leading technologies and state-of-the-art machine learning frameworks.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {technologies.map((tech, idx) => (
          <motion.div
            key={tech.category}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className={`bg-gradient-to-br ${tech.color} backdrop-blur-md rounded-2xl p-6 border border-border shadow-card-3d`}
          >
            <h3 className="text-xl font-bold mb-4 text-primary">{tech.category}</h3>
            <div className="flex flex-wrap gap-2">
              {tech.items.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1.5 bg-background/50 rounded-lg text-sm font-medium border border-border"
                >
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
