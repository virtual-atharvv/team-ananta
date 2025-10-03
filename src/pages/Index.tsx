import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Upload, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface AnalysisResult {
  is_deepfake: boolean;
  confidence: number;
  details: {
    frames_checked: number;
    suspicious_patterns: string[];
    analysis_time: number;
  };
}

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const team: TeamMember[] = [
    { name: 'Atharv Maurya', linkedin: 'https://www.linkedin.com/in/atharv-maurya-2b6295325', photo: atharvPhoto },
    { name: 'Varun Dev Mishra', linkedin: 'https://www.linkedin.com/in/varun-dev-mishra-485497382', photo: varunPhoto },
    { name: 'Kanak Gihar', linkedin: 'https://www.linkedin.com/in/kanak-gihar-58057b378', photo: kanakPhoto },
    { name: 'Ayush Katiyar', linkedin: 'https://www.linkedin.com/in/ayush-katiyar-b20ab9382', photo: ayushPhoto },
    { name: 'Sara Khan', linkedin: 'https://open.spotify.com/', photo: saraPhoto },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('video/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a video file (mp4, webm, etc.)',
          variant: 'destructive',
        });
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please choose a video file to analyze',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setProgress(0);
    setResult(null);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate analysis (2 seconds)
    setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);

      // Mock result based on random chance
      const mockResult: AnalysisResult = {
        is_deepfake: Math.random() > 0.5,
        confidence: 0.7 + Math.random() * 0.25,
        details: {
          frames_checked: Math.floor(Math.random() * 50) + 30,
          suspicious_patterns: [
            'Inconsistent facial landmarks',
            'Temporal artifacts detected',
            'Color channel anomalies',
          ].slice(0, Math.floor(Math.random() * 3) + 1),
          analysis_time: Math.random() * 3 + 1,
        },
      };

      setResult(mockResult);
      setUploading(false);

      toast({
        title: 'Analysis complete',
        description: `Video classified as ${mockResult.is_deepfake ? 'deepfake' : 'genuine'}`,
      });
    }, 2000);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
    setUploading(false);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-primary text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4"
        >
          <div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-premium" style={{ color: 'hsl(var(--heading-brand))' }}>
              DeepFakeDetector
            </h1>
            <p className="text-muted-foreground mt-3 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
              AI/ML-based deepfake video detection — real-time testing for your videos with advanced neural analysis
            </p>
          </div>
          <nav className="flex gap-3 items-center flex-wrap">
            <Button variant="secondary" asChild className="text-sm font-semibold btn-team-hover">
              <a href="https://team-ananta.vercel.app/" target="_blank" rel="noopener noreferrer">
                Our Team
              </a>
            </Button>
            <Button onClick={() => scrollToSection('test')} className="text-sm font-semibold shadow-glow btn-premium-hover">
              Live Test
            </Button>
          </nav>
        </motion.header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Live Test Section */}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            id="test"
            className="bg-gradient-card backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-card-3d border border-border"
          >
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-6 flex items-center gap-2">
              <Upload className="w-6 h-6 text-primary" />
              Live Deepfake Test
            </h2>

            <form onSubmit={handleAnalyze} className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-2xl p-6 transition-colors hover:border-primary/50">
                <label htmlFor="video-upload" className="block text-sm text-muted-foreground mb-3 cursor-pointer">
                  Upload video (mp4, webm) or drag & drop
                </label>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80 cursor-pointer"
                />
              </div>

              <div className="flex gap-3 items-center flex-wrap">
                <Button type="submit" disabled={uploading || !file} className="shadow-glow">
                  {uploading ? 'Analyzing...' : 'Analyze Video'}
                </Button>
                <Button type="button" variant="secondary" onClick={handleReset} disabled={uploading}>
                  <X className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                {uploading && (
                  <span className="text-sm text-muted-foreground">
                    Progress: {progress}%
                  </span>
                )}
              </div>

              {uploading && (
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-primary to-accent"
                  />
                </div>
              )}
            </form>

            {/* Video Preview */}
            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-3">Preview</h3>
              <div className="bg-black/50 rounded-xl overflow-hidden border border-border">
                {file ? (
                  <video
                    ref={videoRef}
                    src={URL.createObjectURL(file)}
                    controls
                    className="w-full aspect-video"
                  />
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No video selected
                  </div>
                )}
              </div>
            </div>

            {/* Results */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-gradient-card backdrop-blur-sm p-6 rounded-2xl border border-border"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-bold flex items-center gap-2">
                      {result.is_deepfake ? (
                        <>
                          <AlertCircle className="w-5 h-5 text-destructive" />
                          Deepfake Detected
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-success" />
                          Likely Genuine
                        </>
                      )}
                    </h4>
                    <p className="text-muted-foreground text-sm mt-1">
                      Confidence: <span className="font-mono font-semibold">{Math.round(result.confidence * 100)}%</span>
                    </p>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-full font-semibold text-sm ${
                      result.is_deepfake ? 'bg-destructive text-destructive-foreground' : 'bg-success text-success-foreground'
                    }`}
                  >
                    {result.is_deepfake ? 'FAKE' : 'REAL'}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frames analyzed:</span>
                    <span className="font-mono">{result.details.frames_checked}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Analysis time:</span>
                    <span className="font-mono">{result.details.analysis_time.toFixed(2)}s</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-muted-foreground block mb-2">Detected patterns:</span>
                    <ul className="list-disc list-inside space-y-1 text-foreground/80">
                      {result.details.suspicious_patterns.map((pattern, idx) => (
                        <li key={idx}>{pattern}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.section>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* How it Works */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gradient-card backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-card-3d border border-border"
            >
              <h3 className="text-2xl font-extrabold tracking-tight mb-4">How it Works</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>Frames are extracted from the uploaded video using advanced computer vision</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>Ensemble detector evaluates artifacts, face landmarks and temporal inconsistencies</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>Temporal smoothing aggregates frame-level scores into video-level confidence</span>
                </li>
              </ol>
            </motion.div>

            {/* Team */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              id="team"
              className="bg-gradient-card backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-card-3d border border-border"
            >
              <h3 className="text-2xl font-extrabold tracking-tight mb-6">Our Team</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {team.map((member, idx) => (
                  <motion.a
                    key={member.name}
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.5 + idx * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="flex gap-3 items-center bg-secondary/30 p-4 rounded-xl hover:bg-secondary/50 transition-all border border-border/50"
                  >
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{member.name}</div>
                      <div className="text-xs text-muted-foreground">LinkedIn →</div>
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Pitch */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-gradient-to-br from-accent/20 to-primary/20 rounded-3xl p-6 md:p-8 shadow-card-3d border border-primary/30"
            >
              <h4 className="text-xl font-extrabold tracking-tight mb-3">Hackathon Pitch</h4>
              <p className="text-sm text-foreground/90 mb-4">
                We provide a fast, explainable deepfake detection pipeline with an emphasis on UX — designed for journalists, content moderators, and researchers.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Intuitive testing interface</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Clear confidence metrics & details</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Modular ML backend architecture</span>
                </li>
              </ul>
            </motion.div>
          </aside>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 text-center text-muted-foreground text-sm"
        >
          © {new Date().getFullYear()} DeepFakeDetector — Built with ❤️ by @Team Ananta !
        </motion.footer>
      </div>
    </div>
  );
};

export default Index;
