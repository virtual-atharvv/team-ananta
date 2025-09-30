import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Upload, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnalysisResult {
  is_deepfake: boolean;
  confidence: number;
  details: {
    frames_checked: number;
    suspicious_patterns: string[];
    analysis_time: number;
  };
}

export const LiveDemo = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

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

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(progressInterval);
      setProgress(100);

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

  return (
    <section id="demo" className="py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Live Demo</h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Test our deepfake detection system in real-time. Upload a video and get instant analysis results.
        </p>
      </motion.div>

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-card backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-card-3d border border-border"
        >
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
        </motion.div>
      </div>
    </section>
  );
};
