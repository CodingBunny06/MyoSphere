import { useEffect, useState, type FormEvent } from "react";

type PhotoRecord = { id: string; date: string; pose: string; note: string; blob: Blob; createdAt: number };
const DB_NAME = "myosphere-private-media";
const STORE = "progress-photos";

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Local photo storage is unavailable."));
  });
}
async function readPhotos(): Promise<PhotoRecord[]> {
  const db = await database();
  const records = await new Promise<PhotoRecord[]>((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as PhotoRecord[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return records.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}
async function writePhoto(photo: PhotoRecord) {
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(photo);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  db.close();
}
async function erasePhoto(id: string) {
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
async function normalizeImage(file: File): Promise<Blob> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Use a JPG, PNG or WebP image.");
  if (file.size > 12 * 1024 * 1024) throw new Error("Image must be smaller than 12 MB.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) { bitmap.close(); throw new Error("This browser could not process the image."); }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Image processing failed.")), "image/jpeg", 0.86));
}
function LocalPhoto({ photo, className = "" }: { photo: PhotoRecord; className?: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const next = URL.createObjectURL(photo.blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [photo.blob]);
  return url ? <img className={className} src={url} alt={`${photo.pose} progress photo, ${photo.date}`} loading="lazy" /> : <div className={className} />;
}
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export default function ProgressPhotoJournal() {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [date, setDate] = useState(today());
  const [pose, setPose] = useState("Front");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");

  useEffect(() => {
    let active = true;
    readPhotos().then((items) => { if (active) setPhotos(items); }).catch(() => { if (active) setError("Local photo storage could not be opened. Try a supported browser."); });
    return () => { active = false; };
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) { setError("Choose an image first."); return; }
    setSaving(true); setError(""); setMessage("");
    try {
      const photo: PhotoRecord = { id: crypto.randomUUID(), date, pose, note: note.trim(), blob: await normalizeImage(file), createdAt: Date.now() };
      await writePhoto(photo);
      setPhotos((items) => [photo, ...items].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt));
      setFile(null); setNote("");
      const input = document.getElementById("myosphere-progress-photo") as HTMLInputElement | null;
      if (input) input.value = "";
      setMessage("Saved in this browser. Nothing was uploaded.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save this image."); }
    finally { setSaving(false); }
  };
  const remove = async (id: string) => {
    try {
      await erasePhoto(id);
      setPhotos((items) => items.filter((photo) => photo.id !== id));
      if (first === id) setFirst("");
      if (second === id) setSecond("");
    } catch { setError("Could not delete this photo."); }
  };
  const a = photos.find((photo) => photo.id === first);
  const b = photos.find((photo) => photo.id === second);

  return <section className="module-panel photo-journal-panel">
    <div className="module-panel-title"><div><span className="eyebrow">PRIVATE PHOTO JOURNAL</span><h2>Visual progress</h2></div><span className="module-count">{photos.length} photos · LOCAL ONLY</span></div>
    <p className="photo-journal-intro">A dated photo timeline with side-by-side comparisons. Images are resized and re-encoded to remove embedded EXIF metadata, then stored in this browser only.</p>
    <form className="photo-upload-grid" onSubmit={submit}>
      <label className="photo-file-field">Choose image<input id="myosphere-progress-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(""); }} /><small>{file ? file.name : "JPG, PNG or WebP · max 12 MB"}</small></label>
      <label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
      <label>View<select value={pose} onChange={(event) => setPose(event.target.value)}><option>Front</option><option>Side</option><option>Back</option><option>Custom</option></select></label>
      <label>Note (optional)<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. relaxed, post-workout" maxLength={120} /></label>
      <button className="module-submit photo-save-button" disabled={!file || saving}>{saving ? "Saving…" : "Save private photo"} <span>↗</span></button>
    </form>
    {error && <p className="photo-feedback error" role="alert">{error}</p>}
    {message && <p className="photo-feedback success" role="status">{message}</p>}
    {photos.length ? <>
      <div className="photo-timeline">{photos.map((photo) => <article className="photo-tile" key={photo.id}>
        <LocalPhoto photo={photo} className="photo-tile-image" />
        <div className="photo-tile-meta"><span>{photo.pose.toUpperCase()}</span><strong>{photo.date}</strong>{photo.note && <small>{photo.note}</small>}</div>
        <button type="button" className="photo-delete" onClick={() => void remove(photo.id)} aria-label={`Delete ${photo.pose} photo from ${photo.date}`}>×</button>
      </article>)}</div>
      <div className="photo-compare">
        <div className="module-panel-title"><div><span className="eyebrow">SIDE-BY-SIDE</span><h2>Compare check-ins</h2></div></div>
        <div className="photo-compare-controls">
          <label>First photo<select value={first} onChange={(event) => setFirst(event.target.value)}><option value="">Select a photo</option>{photos.map((photo) => <option key={photo.id} value={photo.id}>{photo.date} · {photo.pose}</option>)}</select></label>
          <label>Second photo<select value={second} onChange={(event) => setSecond(event.target.value)}><option value="">Select a photo</option>{photos.map((photo) => <option key={photo.id} value={photo.id}>{photo.date} · {photo.pose}</option>)}</select></label>
        </div>
        {a && b ? <div className="photo-compare-grid"><figure><LocalPhoto photo={a} /><figcaption>{a.date} · {a.pose}</figcaption></figure><figure><LocalPhoto photo={b} /><figcaption>{b.date} · {b.pose}</figcaption></figure></div> : <p className="routine-empty">Choose two photos to compare them.</p>}
      </div>
    </> : <div className="module-empty"><span>◷</span><strong>Your visual timeline starts here.</strong><p>Add a front, side or back photo to begin.</p></div>}
    <p className="module-privacy">Photos are not encrypted by this app. They remain in this browser's site storage; clearing site data deletes them. Use device encryption and private backups for sensitive images.</p>
  </section>;
}
