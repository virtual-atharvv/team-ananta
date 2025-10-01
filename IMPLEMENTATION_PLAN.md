# Production-Ready Deepfake Detection Implementation Plan

## Developer Prompt (Copy & Paste to ChatGPT/Claude)

---

**ROLE**: You are an expert ML engineer specializing in computer vision, deepfake detection, and production ML systems. Your task is to upgrade a naive deepfake detector prototype into a robust, production-ready detection pipeline.

**CONTEXT**: 
- Existing project structure: `frontend/` (React), `server/` (Express proxy), `ml_service/` (Flask API with placeholder detector)
- Current endpoint: POST `/analyze` accepts video, returns `{is_deepfake: bool, confidence: float, details: {}}`
- Must maintain API compatibility; only upgrade `ml_service/app.py` internals and add training/model code

**CONSTRAINTS**:
- Training: Single GPU (T4/V100 tier), 200MB max model size
- Inference: ≤3s per 5-second clip on GPU
- Datasets: FaceForensics++, DFDC, Celeb-DF (public)
- No breaking changes to existing API contract

---

## STEP-BY-STEP IMPLEMENTATION PLAN

### 1. Project Structure & Dependencies

Create new directories:
```bash
mkdir -p ml_service/model
mkdir -p ml_service/train
mkdir -p ml_service/utils
mkdir -p ml_service/checkpoints
mkdir -p ml_service/data
```

**File: `ml_service/requirements.txt`** (replace existing)
```txt
flask==3.0.0
werkzeug==3.0.1
numpy==1.24.3
opencv-python==4.8.1.78
torch==2.1.0
torchvision==0.16.0
timm==0.9.12
facenet-pytorch==2.5.3
ffmpeg-python==0.2.0
scikit-learn==1.3.2
scikit-image==0.22.0
albumentations==1.3.1
tqdm==4.66.1
pytorch-lightning==2.1.2
tensorboard==2.15.1
Pillow==10.1.0
pandas==2.1.3
matplotlib==3.8.2
seaborn==0.13.0
```

Install command:
```bash
cd ml_service
pip install -r requirements.txt
```

---

### 2. Data Pipeline & Preprocessing

**File: `ml_service/train/prepare_dataset.py`**

```python
"""
Dataset preparation for deepfake detection.
Downloads FaceForensics++, DFDC, and preprocesses videos into face crops.
"""

import os
import cv2
import json
import ffmpeg
import numpy as np
from pathlib import Path
from tqdm import tqdm
from facenet_pytorch import MTCNN
import torch
from torch.utils.data import Dataset
import albumentations as A

class VideoFaceExtractor:
    def __init__(self, device='cuda', frame_rate=3, face_size=224):
        self.device = device
        self.frame_rate = frame_rate
        self.face_size = face_size
        self.mtcnn = MTCNN(
            keep_all=False, 
            device=device,
            post_process=False,
            select_largest=True
        )
    
    def extract_frames(self, video_path, max_frames=32):
        """Extract frames at specified FPS using ffmpeg"""
        try:
            probe = ffmpeg.probe(video_path)
            video_info = next(s for s in probe['streams'] if s['codec_type'] == 'video')
            duration = float(video_info['duration'])
            
            # Calculate frame indices to extract
            total_frames = int(duration * self.frame_rate)
            if total_frames > max_frames:
                indices = np.linspace(0, total_frames-1, max_frames, dtype=int)
            else:
                indices = list(range(total_frames))
            
            frames = []
            cap = cv2.VideoCapture(video_path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            
            for idx in indices:
                frame_time = idx / self.frame_rate
                cap.set(cv2.CAP_PROP_POS_MSEC, frame_time * 1000)
                ret, frame = cap.read()
                if ret:
                    frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frames.append(frame)
            
            cap.release()
            return frames, indices
            
        except Exception as e:
            print(f"Error extracting frames from {video_path}: {e}")
            return [], []
    
    def detect_and_crop_faces(self, frames):
        """Detect and crop faces from frames"""
        face_crops = []
        face_boxes = []
        
        for frame in frames:
            try:
                # Detect face
                boxes, probs = self.mtcnn.detect(frame)
                
                if boxes is not None and len(boxes) > 0:
                    # Take first/largest face
                    box = boxes[0].astype(int)
                    x1, y1, x2, y2 = box
                    
                    # Add margin
                    margin = 20
                    h, w = frame.shape[:2]
                    x1 = max(0, x1 - margin)
                    y1 = max(0, y1 - margin)
                    x2 = min(w, x2 + margin)
                    y2 = min(h, y2 + margin)
                    
                    face = frame[y1:y2, x1:x2]
                    face = cv2.resize(face, (self.face_size, self.face_size))
                    face_crops.append(face)
                    face_boxes.append(box)
                else:
                    # No face detected - use None
                    face_crops.append(None)
                    face_boxes.append(None)
                    
            except Exception as e:
                face_crops.append(None)
                face_boxes.append(None)
        
        return face_crops, face_boxes
    
    def process_video(self, video_path, max_frames=32):
        """Full pipeline: extract frames -> detect faces -> crop"""
        frames, frame_indices = self.extract_frames(video_path, max_frames)
        
        if len(frames) == 0:
            return [], [], []
        
        face_crops, face_boxes = self.detect_and_crop_faces(frames)
        
        # Filter out None values
        valid_data = [(crop, box, idx) for crop, box, idx in zip(face_crops, face_boxes, frame_indices) if crop is not None]
        
        if len(valid_data) == 0:
            return [], [], []
        
        valid_crops, valid_boxes, valid_indices = zip(*valid_data)
        
        return list(valid_crops), list(valid_boxes), list(valid_indices)


class DeepfakeDataset(Dataset):
    """PyTorch dataset for deepfake detection"""
    
    def __init__(self, video_paths, labels, transform=None, cache_dir='./cache', max_frames=32):
        self.video_paths = video_paths
        self.labels = labels
        self.transform = transform
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.max_frames = max_frames
        self.extractor = VideoFaceExtractor()
    
    def __len__(self):
        return len(self.video_paths)
    
    def __getitem__(self, idx):
        video_path = self.video_paths[idx]
        label = self.labels[idx]
        
        # Check cache
        cache_file = self.cache_dir / f"{Path(video_path).stem}.npy"
        
        if cache_file.exists():
            face_crops = np.load(cache_file)
        else:
            face_crops, _, _ = self.extractor.process_video(video_path, self.max_frames)
            if len(face_crops) > 0:
                face_crops = np.array(face_crops)
                np.save(cache_file, face_crops)
            else:
                # Return empty placeholder
                face_crops = np.zeros((1, 224, 224, 3), dtype=np.uint8)
        
        # Apply transforms
        if self.transform:
            transformed = []
            for face in face_crops:
                aug = self.transform(image=face)
                transformed.append(aug['image'])
            face_crops = np.array(transformed)
        
        # Convert to tensor [T, C, H, W]
        face_crops = torch.from_numpy(face_crops).permute(0, 3, 1, 2).float() / 255.0
        
        return {
            'frames': face_crops,
            'label': torch.tensor(label, dtype=torch.float32),
            'video_path': video_path
        }


def get_augmentations(mode='train'):
    """Augmentation pipeline"""
    if mode == 'train':
        return A.Compose([
            A.HorizontalFlip(p=0.5),
            A.OneOf([
                A.GaussianBlur(blur_limit=3, p=1.0),
                A.MotionBlur(blur_limit=3, p=1.0),
            ], p=0.3),
            A.OneOf([
                A.ImageCompression(quality_lower=60, quality_upper=100, p=1.0),
                A.GaussNoise(var_limit=(10.0, 50.0), p=1.0),
            ], p=0.4),
            A.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1, p=0.5),
            A.ShiftScaleRotate(shift_limit=0.1, scale_limit=0.1, rotate_limit=10, p=0.5),
        ])
    else:
        return None


def prepare_splits(data_root, output_json='splits.json', test_size=0.15, val_size=0.15, seed=42):
    """
    Create train/val/test splits at video level.
    Expected structure:
    data_root/
        real/
            video1.mp4
            video2.mp4
        fake/
            video1.mp4
            video2.mp4
    """
    np.random.seed(seed)
    
    real_videos = list(Path(data_root).glob('real/*.mp4'))
    fake_videos = list(Path(data_root).glob('fake/*.mp4'))
    
    def split_videos(videos, test_size, val_size):
        n = len(videos)
        indices = np.random.permutation(n)
        
        n_test = int(n * test_size)
        n_val = int(n * val_size)
        
        test_idx = indices[:n_test]
        val_idx = indices[n_test:n_test+n_val]
        train_idx = indices[n_test+n_val:]
        
        return ([videos[i] for i in train_idx],
                [videos[i] for i in val_idx],
                [videos[i] for i in test_idx])
    
    real_train, real_val, real_test = split_videos(real_videos, test_size, val_size)
    fake_train, fake_val, fake_test = split_videos(fake_videos, test_size, val_size)
    
    splits = {
        'train': {
            'videos': [str(p) for p in real_train + fake_train],
            'labels': [0] * len(real_train) + [1] * len(fake_train)
        },
        'val': {
            'videos': [str(p) for p in real_val + fake_val],
            'labels': [0] * len(real_val) + [1] * len(fake_val)
        },
        'test': {
            'videos': [str(p) for p in real_test + fake_test],
            'labels': [0] * len(real_test) + [1] * len(fake_test)
        }
    }
    
    with open(output_json, 'w') as f:
        json.dump(splits, f, indent=2)
    
    print(f"Train: {len(splits['train']['videos'])} videos")
    print(f"Val: {len(splits['val']['videos'])} videos")
    print(f"Test: {len(splits['test']['videos'])} videos")
    
    return splits


if __name__ == '__main__':
    # Example usage
    prepare_splits(
        data_root='./data/ffpp',
        output_json='./data/splits.json'
    )
```

---

### 3. Model Architecture

**File: `ml_service/model/deepfake_detector.py`**

```python
"""
Production deepfake detection model.
Architecture: EfficientNet-B3 backbone + Temporal aggregation + Calibration
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import timm


class TemporalAggregator(nn.Module):
    """Aggregate frame-level features across time"""
    
    def __init__(self, feature_dim=1536, hidden_dim=512, num_layers=2):
        super().__init__()
        
        self.lstm = nn.LSTM(
            feature_dim,
            hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=0.3 if num_layers > 1 else 0
        )
        
        self.attention = nn.Sequential(
            nn.Linear(hidden_dim * 2, hidden_dim),
            nn.Tanh(),
            nn.Linear(hidden_dim, 1)
        )
        
    def forward(self, x):
        """
        x: [batch, seq_len, feature_dim]
        returns: [batch, hidden_dim * 2]
        """
        # LSTM
        lstm_out, _ = self.lstm(x)  # [batch, seq_len, hidden_dim*2]
        
        # Attention weights
        attn_weights = self.attention(lstm_out)  # [batch, seq_len, 1]
        attn_weights = F.softmax(attn_weights, dim=1)
        
        # Weighted sum
        context = torch.sum(lstm_out * attn_weights, dim=1)  # [batch, hidden_dim*2]
        
        return context, attn_weights.squeeze(-1)


class DeepfakeDetector(nn.Module):
    """
    Full deepfake detection model
    """
    
    def __init__(
        self,
        backbone='tf_efficientnetv2_s',
        pretrained=True,
        num_classes=1,
        dropout=0.5,
        temporal_hidden=512
    ):
        super().__init__()
        
        # Frame-level feature extractor
        self.backbone = timm.create_model(
            backbone,
            pretrained=pretrained,
            num_classes=0,  # Remove classification head
            global_pool=''
        )
        
        # Get feature dimension
        with torch.no_grad():
            dummy = torch.randn(1, 3, 224, 224)
            features = self.backbone(dummy)
            self.feature_dim = features.shape[1]
        
        # Global pooling
        self.global_pool = nn.AdaptiveAvgPool2d(1)
        
        # Temporal aggregation
        self.temporal = TemporalAggregator(
            feature_dim=self.feature_dim,
            hidden_dim=temporal_hidden
        )
        
        # Classification head
        self.classifier = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(temporal_hidden * 2, 512),
            nn.ReLU(),
            nn.Dropout(dropout / 2),
            nn.Linear(512, num_classes)
        )
        
        # Temperature for calibration (learned during training)
        self.temperature = nn.Parameter(torch.ones(1))
        
    def forward_frames(self, x):
        """
        Extract features from frame batch
        x: [batch, channels, height, width]
        """
        features = self.backbone(x)  # [batch, C, H, W]
        features = self.global_pool(features)  # [batch, C, 1, 1]
        features = features.flatten(1)  # [batch, C]
        return features
    
    def forward(self, x, return_attention=False):
        """
        x: [batch, seq_len, channels, height, width]
        """
        batch_size, seq_len, c, h, w = x.shape
        
        # Reshape for batch processing
        x = x.view(batch_size * seq_len, c, h, w)
        
        # Extract frame features
        frame_features = self.forward_frames(x)  # [batch*seq_len, feature_dim]
        
        # Reshape back to sequences
        frame_features = frame_features.view(batch_size, seq_len, -1)
        
        # Temporal aggregation
        temporal_features, attention_weights = self.temporal(frame_features)
        
        # Classification
        logits = self.classifier(temporal_features)
        
        if return_attention:
            return logits, attention_weights
        
        return logits
    
    def predict_proba(self, x):
        """Get calibrated probabilities"""
        logits = self.forward(x)
        # Apply temperature scaling
        calibrated_logits = logits / self.temperature
        probs = torch.sigmoid(calibrated_logits)
        return probs


class LabelSmoothingBCEWithLogitsLoss(nn.Module):
    """BCE with label smoothing"""
    
    def __init__(self, smoothing=0.05):
        super().__init__()
        self.smoothing = smoothing
    
    def forward(self, logits, targets):
        targets = targets * (1 - self.smoothing) + 0.5 * self.smoothing
        return F.binary_cross_entropy_with_logits(logits, targets)


def create_model(config=None):
    """Factory function"""
    default_config = {
        'backbone': 'tf_efficientnetv2_s',
        'pretrained': True,
        'dropout': 0.5,
        'temporal_hidden': 512
    }
    
    if config:
        default_config.update(config)
    
    return DeepfakeDetector(**default_config)


if __name__ == '__main__':
    # Test model
    model = create_model()
    dummy_video = torch.randn(2, 16, 3, 224, 224)  # batch=2, frames=16
    
    logits, attn = model(dummy_video, return_attention=True)
    print(f"Logits shape: {logits.shape}")
    print(f"Attention shape: {attn.shape}")
    
    probs = model.predict_proba(dummy_video)
    print(f"Probabilities: {probs}")
```

---

### 4. Training Script

**File: `ml_service/train/train.py`**

```python
"""
Training script for deepfake detector
"""

import os
import json
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
import numpy as np
from tqdm import tqdm
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).parent.parent))

from model.deepfake_detector import create_model, LabelSmoothingBCEWithLogitsLoss
from train.prepare_dataset import DeepfakeDataset, get_augmentations


class Trainer:
    def __init__(self, config):
        self.config = config
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Model
        self.model = create_model(config.get('model', {}))
        self.model.to(self.device)
        
        # Loss
        self.criterion = LabelSmoothingBCEWithLogitsLoss(smoothing=0.05)
        
        # Optimizer
        self.optimizer = AdamW(
            self.model.parameters(),
            lr=config.get('lr', 2e-4),
            weight_decay=config.get('weight_decay', 0.01)
        )
        
        # Scheduler
        self.scheduler = CosineAnnealingLR(
            self.optimizer,
            T_max=config.get('epochs', 30),
            eta_min=1e-6
        )
        
        # Metrics
        self.best_val_auc = 0.0
        self.patience_counter = 0
        self.patience = config.get('patience', 5)
        
    def train_epoch(self, train_loader, epoch):
        self.model.train()
        total_loss = 0.0
        correct = 0
        total = 0
        
        pbar = tqdm(train_loader, desc=f'Epoch {epoch}')
        
        for batch_idx, batch in enumerate(pbar):
            frames = batch['frames'].to(self.device)  # [B, T, C, H, W]
            labels = batch['label'].to(self.device).unsqueeze(1)  # [B, 1]
            
            # Forward
            logits = self.model(frames)
            loss = self.criterion(logits, labels)
            
            # Backward
            self.optimizer.zero_grad()
            loss.backward()
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)
            self.optimizer.step()
            
            # Metrics
            total_loss += loss.item()
            preds = (torch.sigmoid(logits) > 0.5).float()
            correct += (preds == labels).sum().item()
            total += labels.size(0)
            
            pbar.set_postfix({
                'loss': total_loss / (batch_idx + 1),
                'acc': correct / total
            })
        
        return total_loss / len(train_loader), correct / total
    
    def validate(self, val_loader):
        self.model.eval()
        total_loss = 0.0
        all_labels = []
        all_probs = []
        
        with torch.no_grad():
            for batch in tqdm(val_loader, desc='Validation'):
                frames = batch['frames'].to(self.device)
                labels = batch['label'].to(self.device).unsqueeze(1)
                
                logits = self.model(frames)
                loss = self.criterion(logits, labels)
                
                probs = torch.sigmoid(logits)
                
                total_loss += loss.item()
                all_labels.extend(labels.cpu().numpy())
                all_probs.extend(probs.cpu().numpy())
        
        all_labels = np.array(all_labels)
        all_probs = np.array(all_probs)
        
        # Compute metrics
        from sklearn.metrics import roc_auc_score, accuracy_score
        
        auc = roc_auc_score(all_labels, all_probs)
        acc = accuracy_score(all_labels, (all_probs > 0.5).astype(int))
        
        return total_loss / len(val_loader), auc, acc
    
    def train(self, train_loader, val_loader, epochs):
        for epoch in range(1, epochs + 1):
            # Train
            train_loss, train_acc = self.train_epoch(train_loader, epoch)
            
            # Validate
            val_loss, val_auc, val_acc = self.validate(val_loader)
            
            # Scheduler step
            self.scheduler.step()
            
            print(f"\nEpoch {epoch}/{epochs}")
            print(f"Train - Loss: {train_loss:.4f}, Acc: {train_acc:.4f}")
            print(f"Val   - Loss: {val_loss:.4f}, AUC: {val_auc:.4f}, Acc: {val_acc:.4f}")
            
            # Save best model
            if val_auc > self.best_val_auc:
                self.best_val_auc = val_auc
                self.patience_counter = 0
                self.save_checkpoint(epoch, val_auc)
                print(f"✓ New best model saved (AUC: {val_auc:.4f})")
            else:
                self.patience_counter += 1
                if self.patience_counter >= self.patience:
                    print(f"Early stopping triggered after {epoch} epochs")
                    break
    
    def save_checkpoint(self, epoch, val_auc):
        checkpoint_dir = Path(self.config.get('checkpoint_dir', './checkpoints'))
        checkpoint_dir.mkdir(exist_ok=True)
        
        checkpoint = {
            'epoch': epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'val_auc': val_auc,
            'config': self.config
        }
        
        path = checkpoint_dir / f'best_model.pt'
        torch.save(checkpoint, path)
        print(f"Checkpoint saved to {path}")


def main():
    # Configuration
    config = {
        'data_root': './data/ffpp',
        'splits_json': './data/splits.json',
        'batch_size': 8,
        'num_workers': 4,
        'epochs': 30,
        'lr': 2e-4,
        'weight_decay': 0.01,
        'patience': 5,
        'max_frames': 32,
        'checkpoint_dir': './checkpoints',
        'model': {
            'backbone': 'tf_efficientnetv2_s',
            'pretrained': True,
            'dropout': 0.5,
            'temporal_hidden': 512
        }
    }
    
    # Load splits
    with open(config['splits_json'], 'r') as f:
        splits = json.load(f)
    
    # Datasets
    train_dataset = DeepfakeDataset(
        video_paths=splits['train']['videos'],
        labels=splits['train']['labels'],
        transform=get_augmentations('train'),
        max_frames=config['max_frames']
    )
    
    val_dataset = DeepfakeDataset(
        video_paths=splits['val']['videos'],
        labels=splits['val']['labels'],
        transform=None,
        max_frames=config['max_frames']
    )
    
    # DataLoaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=config['batch_size'],
        shuffle=True,
        num_workers=config['num_workers'],
        pin_memory=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=config['batch_size'],
        shuffle=False,
        num_workers=config['num_workers'],
        pin_memory=True
    )
    
    # Train
    trainer = Trainer(config)
    trainer.train(train_loader, val_loader, config['epochs'])


if __name__ == '__main__':
    main()
```

---

### 5. Evaluation & Calibration

**File: `ml_service/train/evaluate.py`**

```python
"""
Comprehensive evaluation script
"""

import torch
import numpy as np
import json
from pathlib import Path
from sklearn.metrics import (
    roc_auc_score, 
    roc_curve,
    precision_recall_curve,
    average_precision_score,
    confusion_matrix,
    classification_report
)
import matplotlib.pyplot as plt
import seaborn as sns
import sys

sys.path.append(str(Path(__file__).parent.parent))

from model.deepfake_detector import create_model
from train.prepare_dataset import DeepfakeDataset
from torch.utils.data import DataLoader


class ModelEvaluator:
    def __init__(self, model, device='cuda'):
        self.model = model
        self.device = device
        self.model.eval()
    
    def predict(self, dataloader):
        """Get predictions for entire dataset"""
        all_labels = []
        all_probs = []
        all_logits = []
        all_paths = []
        
        with torch.no_grad():
            for batch in dataloader:
                frames = batch['frames'].to(self.device)
                labels = batch['label'].numpy()
                paths = batch['video_path']
                
                logits = self.model(frames).cpu().numpy()
                probs = torch.sigmoid(torch.tensor(logits)).numpy()
                
                all_labels.extend(labels)
                all_probs.extend(probs)
                all_logits.extend(logits)
                all_paths.extend(paths)
        
        return {
            'labels': np.array(all_labels),
            'probs': np.array(all_probs).flatten(),
            'logits': np.array(all_logits).flatten(),
            'paths': all_paths
        }
    
    def compute_metrics(self, results, threshold=0.5):
        """Compute comprehensive metrics"""
        labels = results['labels']
        probs = results['probs']
        preds = (probs > threshold).astype(int)
        
        # ROC-AUC
        roc_auc = roc_auc_score(labels, probs)
        
        # PR-AUC
        pr_auc = average_precision_score(labels, probs)
        
        # Confusion matrix
        cm = confusion_matrix(labels, preds)
        tn, fp, fn, tp = cm.ravel()
        
        # Rates
        tpr = tp / (tp + fn) if (tp + fn) > 0 else 0
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tpr
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        
        metrics = {
            'roc_auc': float(roc_auc),
            'pr_auc': float(pr_auc),
            'accuracy': float((tp + tn) / (tp + tn + fp + fn)),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1),
            'tpr': float(tpr),
            'fpr': float(fpr),
            'confusion_matrix': cm.tolist(),
            'threshold': float(threshold)
        }
        
        return metrics
    
    def find_optimal_threshold(self, results, target_fpr=0.01):
        """Find threshold that achieves target FPR"""
        labels = results['labels']
        probs = results['probs']
        
        fpr, tpr, thresholds = roc_curve(labels, probs)
        
        # Find threshold where FPR <= target
        idx = np.where(fpr <= target_fpr)[0]
        if len(idx) > 0:
            optimal_idx = idx[-1]
            optimal_threshold = thresholds[optimal_idx]
            optimal_tpr = tpr[optimal_idx]
        else:
            # Fallback to max F1
            precision, recall, thresholds_pr = precision_recall_curve(labels, probs)
            f1_scores = 2 * precision * recall / (precision + recall + 1e-8)
            optimal_idx = np.argmax(f1_scores)
            optimal_threshold = thresholds_pr[optimal_idx]
            optimal_tpr = recall[optimal_idx]
        
        return float(optimal_threshold), float(optimal_tpr)
    
    def calibrate_temperature(self, val_results):
        """Find optimal temperature for calibration"""
        from scipy.optimize import minimize
        
        labels = val_results['labels']
        logits = val_results['logits']
        
        def nll_loss(temperature):
            temp = temperature[0]
            scaled_probs = 1 / (1 + np.exp(-logits / temp))
            loss = -np.mean(labels * np.log(scaled_probs + 1e-8) + 
                           (1 - labels) * np.log(1 - scaled_probs + 1e-8))
            return loss
        
        result = minimize(nll_loss, x0=[1.0], bounds=[(0.1, 10.0)])
        optimal_temp = result.x[0]
        
        return float(optimal_temp)
    
    def compute_ece(self, results, n_bins=10):
        """Expected Calibration Error"""
        probs = results['probs']
        labels = results['labels']
        
        bin_boundaries = np.linspace(0, 1, n_bins + 1)
        ece = 0.0
        
        for i in range(n_bins):
            bin_lower = bin_boundaries[i]
            bin_upper = bin_boundaries[i + 1]
            
            in_bin = (probs > bin_lower) & (probs <= bin_upper)
            prop_in_bin = np.mean(in_bin)
            
            if prop_in_bin > 0:
                accuracy_in_bin = np.mean(labels[in_bin])
                avg_confidence_in_bin = np.mean(probs[in_bin])
                ece += np.abs(avg_confidence_in_bin - accuracy_in_bin) * prop_in_bin
        
        return float(ece)
    
    def plot_roc_curve(self, results, save_path='roc_curve.png'):
        """Plot ROC curve"""
        fpr, tpr, _ = roc_curve(results['labels'], results['probs'])
        auc = roc_auc_score(results['labels'], results['probs'])
        
        plt.figure(figsize=(8, 6))
        plt.plot(fpr, tpr, label=f'ROC (AUC = {auc:.3f})')
        plt.plot([0, 1], [0, 1], 'k--', label='Random')
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title('ROC Curve')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(save_path, dpi=150)
        plt.close()
    
    def plot_confusion_matrix(self, results, threshold=0.5, save_path='confusion_matrix.png'):
        """Plot confusion matrix"""
        preds = (results['probs'] > threshold).astype(int)
        cm = confusion_matrix(results['labels'], preds)
        
        plt.figure(figsize=(8, 6))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                   xticklabels=['Real', 'Fake'],
                   yticklabels=['Real', 'Fake'])
        plt.xlabel('Predicted')
        plt.ylabel('True')
        plt.title('Confusion Matrix')
        plt.tight_layout()
        plt.savefig(save_path, dpi=150)
        plt.close()


def evaluate_model(checkpoint_path, test_loader, output_dir='./eval_results'):
    """Main evaluation function"""
    output_dir = Path(output_dir)
    output_dir.mkdir(exist_ok=True)
    
    # Load model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    checkpoint = torch.load(checkpoint_path, map_location=device)
    
    model = create_model(checkpoint.get('config', {}).get('model', {}))
    model.load_state_dict(checkpoint['model_state_dict'])
    model.to(device)
    
    # Evaluate
    evaluator = ModelEvaluator(model, device)
    results = evaluator.predict(test_loader)
    
    # Find optimal threshold
    optimal_threshold, optimal_tpr = evaluator.find_optimal_threshold(results, target_fpr=0.01)
    
    # Compute metrics at optimal threshold
    metrics = evaluator.compute_metrics(results, threshold=optimal_threshold)
    metrics['optimal_threshold'] = optimal_threshold
    metrics['tpr_at_1pct_fpr'] = optimal_tpr
    
    # Calibration
    ece = evaluator.compute_ece(results)
    metrics['ece'] = ece
    
    # Save metrics
    with open(output_dir / 'metrics.json', 'w') as f:
        json.dump(metrics, f, indent=2)
    
    # Plot curves
    evaluator.plot_roc_curve(results, output_dir / 'roc_curve.png')
    evaluator.plot_confusion_matrix(results, optimal_threshold, output_dir / 'confusion_matrix.png')
    
    print("\n=== Evaluation Results ===")
    print(f"ROC-AUC: {metrics['roc_auc']:.4f}")
    print(f"PR-AUC: {metrics['pr_auc']:.4f}")
    print(f"Accuracy: {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall: {metrics['recall']:.4f}")
    print(f"F1-Score: {metrics['f1_score']:.4f}")
    print(f"Optimal Threshold: {optimal_threshold:.4f}")
    print(f"TPR @ 1% FPR: {optimal_tpr:.4f}")
    print(f"ECE: {ece:.4f}")
    
    return metrics


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python evaluate.py <checkpoint_path>")
        sys.exit(1)
    
    checkpoint_path = sys.argv[1]
    
    # Load test data (adjust paths)
    with open('./data/splits.json', 'r') as f:
        splits = json.load(f)
    
    test_dataset = DeepfakeDataset(
        video_paths=splits['test']['videos'],
        labels=splits['test']['labels'],
        transform=None,
        max_frames=32
    )
    
    test_loader = DataLoader(
        test_dataset,
        batch_size=8,
        shuffle=False,
        num_workers=4
    )
    
    evaluate_model(checkpoint_path, test_loader)
```

---

### 6. Production Inference API

**File: `ml_service/app.py`** (REPLACE EXISTING)

```python
"""
Production inference API for deepfake detection
"""

from flask import Flask, request, jsonify
import tempfile
import os
import sys
from pathlib import Path
import torch
import numpy as np
import cv2
from facenet_pytorch import MTCNN
import json
import time

# Add model directory to path
sys.path.append(str(Path(__file__).parent))

from model.deepfake_detector import create_model

app = Flask(__name__)

# Global model and config (loaded once at startup)
MODEL = None
DEVICE = None
MTCNN_DETECTOR = None
CONFIG = None


def load_model_and_config():
    """Load model checkpoint and configuration"""
    global MODEL, DEVICE, MTCNN_DETECTOR, CONFIG
    
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {DEVICE}")
    
    # Load checkpoint
    checkpoint_path = Path(__file__).parent / 'checkpoints' / 'best_model.pt'
    
    if not checkpoint_path.exists():
        print(f"WARNING: No trained model found at {checkpoint_path}")
        print("Using untrained model for demo purposes")
        CONFIG = {
            'model': {
                'backbone': 'tf_efficientnetv2_s',
                'pretrained': True
            },
            'threshold': 0.5,
            'temperature': 1.0
        }
        MODEL = create_model(CONFIG['model'])
    else:
        checkpoint = torch.load(checkpoint_path, map_location=DEVICE)
        CONFIG = checkpoint.get('config', {})
        CONFIG['threshold'] = CONFIG.get('threshold', 0.5)
        CONFIG['temperature'] = checkpoint.get('temperature', 1.0)
        
        MODEL = create_model(CONFIG.get('model', {}))
        MODEL.load_state_dict(checkpoint['model_state_dict'])
        print(f"Loaded model from {checkpoint_path}")
    
    MODEL.to(DEVICE)
    MODEL.eval()
    
    # Load face detector
    MTCNN_DETECTOR = MTCNN(
        keep_all=False,
        device=DEVICE,
        post_process=False,
        select_largest=True
    )
    print("Face detector initialized")


def extract_and_process_video(video_path, max_frames=32, target_size=224):
    """
    Extract frames, detect faces, and prepare for inference
    """
    try:
        cap = cv2.VideoCapture(video_path)
        
        # Get video info
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0
        
        # Sample frame indices uniformly
        if frame_count > max_frames:
            indices = np.linspace(0, frame_count - 1, max_frames, dtype=int)
        else:
            indices = list(range(frame_count))
        
        frames = []
        face_crops = []
        face_boxes = []
        frame_numbers = []
        
        for idx in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            
            if not ret:
                continue
            
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(frame_rgb)
            
            # Detect face
            try:
                boxes, probs = MTCNN_DETECTOR.detect(frame_rgb)
                
                if boxes is not None and len(boxes) > 0:
                    # Take first face
                    box = boxes[0].astype(int)
                    x1, y1, x2, y2 = box
                    
                    # Add margin
                    margin = 20
                    h, w = frame_rgb.shape[:2]
                    x1 = max(0, x1 - margin)
                    y1 = max(0, y1 - margin)
                    x2 = min(w, x2 + margin)
                    y2 = min(h, y2 + margin)
                    
                    # Crop and resize
                    face = frame_rgb[y1:y2, x1:x2]
                    face = cv2.resize(face, (target_size, target_size))
                    
                    face_crops.append(face)
                    face_boxes.append(box)
                    frame_numbers.append(idx)
            except Exception as e:
                print(f"Face detection error on frame {idx}: {e}")
                continue
        
        cap.release()
        
        if len(face_crops) == 0:
            return None, {
                'error': 'no_faces_detected',
                'message': 'No faces detected in video',
                'frame_count': frame_count,
                'duration': duration
            }
        
        # Convert to tensor
        face_crops = np.array(face_crops)  # [T, H, W, C]
        face_tensor = torch.from_numpy(face_crops).permute(0, 3, 1, 2).float() / 255.0
        face_tensor = face_tensor.unsqueeze(0)  # [1, T, C, H, W]
        
        metadata = {
            'frame_count': frame_count,
            'duration': duration,
            'fps': fps,
            'faces_detected': len(face_crops),
            'frame_numbers': frame_numbers,
            'face_boxes': [box.tolist() for box in face_boxes]
        }
        
        return face_tensor, metadata
        
    except Exception as e:
        return None, {
            'error': 'processing_error',
            'message': str(e)
        }


def run_inference(face_tensor, metadata):
    """
    Run model inference and generate detailed results
    """
    try:
        start_time = time.time()
        
        with torch.no_grad():
            face_tensor = face_tensor.to(DEVICE)
            
            # Get logits and attention
            logits, attention_weights = MODEL(face_tensor, return_attention=True)
            
            # Apply temperature scaling (calibration)
            temperature = CONFIG.get('temperature', 1.0)
            calibrated_logits = logits / temperature
            
            # Get probability
            prob = torch.sigmoid(calibrated_logits).item()
            
            # Get attention scores (frame importance)
            attention_scores = attention_weights[0].cpu().numpy()
            
        inference_time = time.time() - start_time
        
        # Determine prediction
        threshold = CONFIG.get('threshold', 0.5)
        is_deepfake = prob > threshold
        
        # Get top suspicious frames
        frame_numbers = metadata['frame_numbers']
        top_k = min(5, len(attention_scores))
        top_indices = np.argsort(attention_scores)[-top_k:][::-1]
        
        top_frames = [
            {
                'frame_index': int(frame_numbers[idx]),
                'attention_score': float(attention_scores[idx]),
                'timestamp': float(frame_numbers[idx] / metadata['fps']) if metadata['fps'] > 0 else 0
            }
            for idx in top_indices
        ]
        
        # Confidence level categorization
        if 0.45 <= prob <= 0.55:
            confidence_level = 'uncertain'
            recommendation = 'Human review recommended'
        elif prob < 0.45 or prob > 0.55:
            confidence_level = 'low'
            recommendation = 'Consider additional verification'
        elif prob < 0.30 or prob > 0.70:
            confidence_level = 'medium'
            recommendation = 'Moderate confidence in prediction'
        else:
            confidence_level = 'high'
            recommendation = 'High confidence in prediction'
        
        result = {
            'is_deepfake': bool(is_deepfake),
            'confidence': float(prob),
            'threshold': float(threshold),
            'confidence_level': confidence_level,
            'recommendation': recommendation,
            'details': {
                'inference_time_seconds': round(inference_time, 3),
                'frames_analyzed': len(attention_scores),
                'video_duration_seconds': round(metadata['duration'], 2),
                'fps': round(metadata['fps'], 2),
                'faces_detected': metadata['faces_detected'],
                'top_suspicious_frames': top_frames,
                'model_version': 'v1.0',
                'device': str(DEVICE)
            }
        }
        
        return result
        
    except Exception as e:
        return {
            'error': 'inference_error',
            'message': str(e)
        }


@app.route('/analyze', methods=['POST'])
def analyze():
    """Main endpoint for video analysis"""
    
    if 'video' not in request.files:
        return jsonify({'error': 'no_video', 'message': 'No video file uploaded'}), 400
    
    file = request.files['video']
    
    # Save temporary file
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
    try:
        file.save(tmp.name)
        tmp.close()
        
        # Process video
        face_tensor, metadata = extract_and_process_video(tmp.name)
        
        if face_tensor is None:
            # Error in processing
            return jsonify(metadata), 400
        
        # Run inference
        result = run_inference(face_tensor, metadata)
        
        if 'error' in result:
            return jsonify(result), 500
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'error': 'server_error',
            'message': str(e)
        }), 500
        
    finally:
        try:
            os.unlink(tmp.name)
        except:
            pass


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': MODEL is not None,
        'device': str(DEVICE),
        'version': '1.0.0'
    })


if __name__ == '__main__':
    print("Loading model...")
    load_model_and_config()
    print("Starting Flask server...")
    app.run(host='0.0.0.0', port=5000, debug=False)
```

---

### 7. CLI Commands Summary

```bash
# 1. Setup environment
cd ml_service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# 2. Prepare dataset (assumes data in ml_service/data/ffpp/)
python train/prepare_dataset.py

# 3. Train model
python train/train.py

# 4. Evaluate model
python train/evaluate.py checkpoints/best_model.pt

# 5. Start inference server
python app.py

# 6. Test inference (from another terminal)
curl -X POST -F "video=@test_video.mp4" http://localhost:5000/analyze
```

---

### 8. Rollout Checklist

✅ **10-Point Deployment Checklist:**

1. **Model Training Complete**: Train on FaceForensics++ + DFDC, achieve ROC-AUC ≥ 0.90 on held-out test set
2. **Threshold Calibrated**: Set threshold based on target FPR (≤1%) on validation set
3. **Temperature Scaling Applied**: Calibrate model output probabilities to reduce overconfidence
4. **Face Detection Fallback**: Handle "no face detected" cases gracefully (return error, not false positive)
5. **Evaluation Tests Pass**: Run `evaluate.py` and verify metrics meet targets (AUC, ECE, confusion matrix)
6. **Unit Tests Pass**: All tests in `test_*.py` pass successfully
7. **Integration Test**: Test full pipeline end-to-end with sample videos of known labels
8. **Performance Verified**: Inference time ≤ 3s per 5-second clip on target hardware
9. **Documentation Updated**: README includes setup, training, evaluation, and API usage examples
10. **Monitoring Setup**: Log inference requests, latency, error rates, and prediction distribution

---

### 9. Debugging Checklist - Top 8 Failure Modes

| # | Failure Mode | Detection | Fix |
|---|--------------|-----------|-----|
| 1 | **No faces detected** | Check `faces_detected` in metadata | Add face detection confidence threshold; return "uncertain" if no faces |
| 2 | **Model overfits to dataset** | Val AUC >> Test AUC | Add more augmentations; reduce model capacity; use cross-dataset evaluation |
| 3 | **High false positive rate** | FPR > 5% on real videos | Lower threshold; improve calibration; add ensemble |
| 4 | **Low confidence on obvious fakes** | Confidence < 0.6 on known deepfakes | Check if faces are detected; verify model is loaded correctly |
| 5 | **Slow inference** | Inference time > 3s | Reduce max_frames; use smaller backbone; batch processing |
| 6 | **Poor calibration** | ECE > 0.1 | Apply temperature scaling; re-calibrate on larger validation set |
| 7 | **Fails on compressed videos** | Low accuracy on low-bitrate videos | Add JPEG compression augmentation during training |
| 8 | **Memory errors on GPU** | OOM during inference | Reduce batch size; use gradient checkpointing; move to CPU |

---

### 10. Quick Wins - 3 Changes to Reduce Wrong Results NOW

1. **Add Face Detection Fallback**
   ```python
   if len(face_crops) == 0:
       return {
           'is_deepfake': None,
           'confidence': 0.0,
           'recommendation': 'No faces detected - cannot analyze',
           'error': 'no_faces'
       }
   ```

2. **Implement Confidence Thresholding**
   ```python
   if 0.45 <= prob <= 0.55:
       return {
           'is_deepfake': None,
           'confidence': prob,
           'recommendation': 'Uncertain - human review required'
       }
   ```

3. **Ensemble Frame-Level + Temporal Model**
   - Train separate frame-only classifier (fast, baseline)
   - Train temporal model (current architecture)
   - Average predictions: `final_prob = 0.4 * frame_prob + 0.6 * temporal_prob`
   - This reduces variance and improves robustness

---

## JSON API Schema (Final)

```json
{
  "is_deepfake": "boolean | null (null if uncertain)",
  "confidence": "float [0-1]",
  "threshold": "float [0-1]",
  "confidence_level": "string ['uncertain', 'low', 'medium', 'high']",
  "recommendation": "string (user-facing guidance)",
  "details": {
    "inference_time_seconds": "float",
    "frames_analyzed": "int",
    "video_duration_seconds": "float",
    "fps": "float",
    "faces_detected": "int",
    "top_suspicious_frames": [
      {
        "frame_index": "int",
        "attention_score": "float",
        "timestamp": "float (seconds)"
      }
    ],
    "model_version": "string",
    "device": "string"
  },
  "error": "string | null (error code if failed)"
}
```

---

**END OF IMPLEMENTATION PLAN**

Take a deep breath and work on this problem step-by-step.
