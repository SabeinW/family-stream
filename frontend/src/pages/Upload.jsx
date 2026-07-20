import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, CheckCircle2, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { api } from '../lib/api';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [status, setStatus] = useState('idle'); // idle | uploading | done | error
  const [dragOver, setDragOver] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setStatus('uploading');
    const form = new FormData();
    form.append('file', file);
    form.append('title', title || file.name);
    form.append('category', category || 'Uncategorized');
    form.append('tags', tags);
    form.append('visibility', visibility);
    try {
      await api.upload(form);
      setStatus('done');
      setFile(null);
      setTitle('');
      setCategory('');
      setTags('');
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-base-950 pb-20">
      <Navbar />
      <div className="pt-28 px-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Add a family memory</h1>

        <form onSubmit={submit} className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
              dragOver ? 'border-accent bg-accent/5' : 'border-white/20'
            }`}
          >
            <UploadCloud className="w-10 h-10 mx-auto mb-3 text-white/50" />
            <p className="text-white/70 mb-2">{file ? file.name : 'Drag & drop a photo or video, or browse'}</p>
            <input
              type="file"
              accept="video/*,image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="inline-block mt-1 text-accent hover:underline cursor-pointer text-sm">
              Choose file
            </label>
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-base-800 rounded-md px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-accent"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (e.g. Vacations, Birthdays)"
            className="w-full bg-base-800 rounded-md px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-accent"
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags, comma-separated"
            className="w-full bg-base-800 rounded-md px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-accent"
          />
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full bg-base-800 rounded-md px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-accent"
          >
            <option value="private">Private — only me</option>
            <option value="friends">Shared with friends</option>
          </select>
          <p className="text-white/40 text-xs -mt-2">
            You can fine-tune sharing (including specific friends) anytime from a memory's Details view.
          </p>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={!file || status === 'uploading'}
            className="w-full bg-accent hover:bg-accent-dim transition-colors rounded-md py-3 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === 'done' && <CheckCircle2 className="w-4 h-4" />}
            {status === 'uploading' ? 'Uploading…' : status === 'done' ? 'Uploaded!' : 'Upload'}
          </motion.button>

          {status === 'done' && (
            <p className="text-white/50 text-sm text-center">
              Videos are transcoded for streaming in the background — they'll appear once ready.
            </p>
          )}
          {status === 'error' && <p className="text-accent text-sm text-center">Upload failed. Please try again.</p>}
        </form>
      </div>
    </div>
  );
}
