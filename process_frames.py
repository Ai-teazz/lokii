import os
import glob
import json
from concurrent.futures import ProcessPoolExecutor
from PIL import Image

seq1_dir = "C:/Users/sanjeevi/Downloads/ezgif-5de5ba15bee486e6-png-split"
seq2_dir = "C:/Users/sanjeevi/Downloads/ezgif-5670317f73b3a215-png-split2part"
seq3_dir = "C:/Users/sanjeevi/Downloads/ezgif-50199a8aeee2acf5-png-splitpart3"

out_dir = "public/frames"
os.makedirs(out_dir, exist_ok=True)

seq1_files = sorted(glob.glob(os.path.join(seq1_dir, "ezgif-frame-*.png")))
seq2_files = sorted(glob.glob(os.path.join(seq2_dir, "ezgif-frame-*.png")))
seq3_files = sorted(glob.glob(os.path.join(seq3_dir, "ezgif-frame-*.png")))

print(f"Seq1 (Part 1) frames: {len(seq1_files)}")
print(f"Seq2 (Part 2) frames: {len(seq2_files)}")
print(f"Seq3 (Part 3) frames: {len(seq3_files)}")

all_files = seq1_files + seq2_files + seq3_files
total_frames = len(all_files)
print(f"Total continuous timeline frames: {total_frames}")

def convert_single_frame(args):
    idx, src_path, total_seq1, total_seq2 = args
    frame_name = f"frame_{idx:03d}.webp"
    webp_path = os.path.join("public/frames", frame_name)
    
    with Image.open(src_path) as img:
        w, h = img.size
        # Ultra-high quality 4K WebP export (98 quality, method 4 encoding) preserving full 3840x2160 native resolution
        img.save(webp_path, "WEBP", quality=98, method=4)
        
    seq_num = 1 if idx <= total_seq1 else (2 if idx <= total_seq1 + total_seq2 else 3)
    local_idx = idx if seq_num == 1 else (idx - total_seq1 if seq_num == 2 else idx - total_seq1 - total_seq2)
    
    return {
        "global_index": idx,
        "sequence": seq_num,
        "local_index": local_idx,
        "filename": frame_name,
        "width": w,
        "height": h,
        "original_file": os.path.basename(src_path)
    }

if __name__ == '__main__':
    tasks = [(idx, path, len(seq1_files), len(seq2_files)) for idx, path in enumerate(all_files, start=1)]
    
    with ProcessPoolExecutor() as executor:
        results = list(executor.map(convert_single_frame, tasks))
    
    results.sort(key=lambda x: x["global_index"])
    
    with open("public/frames_meta.json", "w") as f:
        json.dump({"total_frames": len(results), "frames": results}, f, indent=2)

    print(f"Pristine 4K WebP conversion complete! Total frames created: {len(results)}")
