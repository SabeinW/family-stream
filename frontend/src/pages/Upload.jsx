import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, CheckCircle2, Loader2, X, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { api } from '../lib/api';

export default function Upload() {
  const [files, setFiles] = useState([]); // [{ file, status: 'pending'|'uploading'|'done'|'error', error? }]
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const addFiles = (fileList) => {
    const incoming = [...fileList].map((file) => ({ file, status: 'pending' }));
    setFiles((prev) => [...prev, ...incoming]);
  };

  const removeFile = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    if (!files.length || submitting) return;
    setSubmitting(true);

    // Sequential, not parallel — a VPS shouldn't get hit with several large
    // video uploads (each kicking off ffmpeg transcoding) all at once.
    for (let i = 0; i < files.length; i++) {
      setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' } : f)));
      const { file } = files[i];
      const form = new FormData();
      form.append('file', file);
      form.append('title', files.length === 1 && title ? title : file.name);
      form.append('category', category || 'Uncategorized');
      form.append('tags', tags);
      form.append('visibility', visibility);
      try {
        await api.upload(form);
        setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: 'done' } : f)));
      } catch (err) {
        setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: 'error', error: err.message } : f)));
      }
    }
    setSubmitting(false);
  };

  const allDone = files.length > 0 && files.every((f) => f.status === 'done');
  const reset = () => {
    setFiles([]);
    setTitle('');
    setCategory('');
    setTags('');
  };

  return (
    <div className="min-h-screen bg-base-950 pb-20">
      <Navbar />
      <div className="pt-28 px-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Add family memories</h1>

        <form onSubmit={submit} className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
            }}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragOver ? 'border-accent bg-accent/5' : 'border-white/20'
            }`}
          >
            <UploadCloud className="w-10 h-10 mx-auto mb-3 text-white/50" />
            <p className="text-white/70 mb-2">
              {files.length ? `${files.length} file${files.length === 1 ? '' : 's'} selected` : 'Drag & drop photos or videos, or browse'}
            </p>
            <input
              type="file"
              accept="video/*,image/*"
              multiple
              onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="inline-block mt-1 text-accent hover:underline cursor-pointer text-sm">
              Choose files
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-hidden">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-base-800 rounded-md px-3 py-2 text-sm">
                  <span className="truncate flex-1 mr-2">{f.file.name}</span>
                  {f.status === 'pending' && (
                    <button type="button" onClick={() => removeFile(i)} aria-label="Remove" className="p-0.5 hover:text-accent">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {f.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-white/50" />}
                  {f.status === 'done' && <CheckCircle2 className="w-4 h-4 text-accent" />}
                  {f.status === 'error' && <AlertCircle className="w-4 h-4 text-accent" aria-label={f.error} />}
                </div>
              ))}
            </div>
          )}

          {files.length === 1 && (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="w-full bg-base-800 rounded-md px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-accent"
            />
          )}
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
            {files.length > 1 ? 'Category, tags, and sharing apply to all selected files. ' : ''}
            You can fine-tune sharing (including specific friends) anytime after uploading.
          </p>

          {!allDone ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={!files.length || submitting}
              className="w-full bg-accent hover:bg-accent-dim transition-colors rounded-md py-3 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Uploading…' : `Upload ${files.length || ''}`.trim()}
            </motion.button>
          ) : (
            <button
              type="button"
              onClick={reset}
              className="w-full bg-white/10 hover:bg-white/20 transition-colors rounded-md py-3 font-semibold"
            >
              Upload more
            </button>
          )}

          {allDone && (
            <p className="text-white/50 text-sm text-center">
              Uploaded! Videos are transcoded for streaming in the background — they'll appear once ready.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
