import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import newsApi from '../api/news';
import uploadApi from '../api/upload';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const createEmptyForm = () => ({ title: '', excerpt: '', content: '', images: [] });

export default function EmployeeNews() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>(createEmptyForm());
  // Track whether user has interacted with images for the current edit session.
  // If true, we will include images (even empty array) in update payload to
  // intentionally clear images on server. If false, we won't send images
  // so server preserves existing images.
  const [imagesTouched, setImagesTouched] = useState(false);
  const [uploading, setUploading] = useState(false);
  // preview state removed — previews are read from form.images
  const [saving, setSaving] = useState(false);

  const load = (opts: { showArchived?: boolean } = {}) => {
    setLoading(true);
    const status = opts.showArchived ? 'archived' : 'published';
    newsApi.fetchNewsList({ limit: 50, status }).then((res) => setItems(res.items || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load({ showArchived }); }, [showArchived]);

  // show editing state clearly and ensure form contains _id
  const handleEdit = async (item: any) => {
    // fetch the full detail from API to ensure we have images/content not trimmed by list endpoint
    try {
      const res = await newsApi.fetchNewsDetail(item._id || item.id);
      const full = res?.news || res;
      const withId = { ...full, _id: full._id || full.id };
      // Deep copy images and content to avoid accidental shared references
      const safeForm = {
        ...withId,
        images: Array.isArray(withId.images) ? [...withId.images] : [],
        content: withId.content || '',
      };
      setEditing(withId);
      setForm(safeForm);
      setImagesTouched(false);
    } catch (err) {
      console.error('Failed to load full news for edit', err);
      // fallback to shallow item so user can still edit
      const withId = { ...item, _id: item._id || item.id };
      const safeForm = {
        ...withId,
        images: Array.isArray(withId.images) ? [...withId.images] : [],
        content: withId.content || '',
      };
      setEditing(withId);
      setForm(safeForm);
      setImagesTouched(false);
    }
  };
  const handleNew = () => { setEditing(null); setForm(createEmptyForm()); setImagesTouched(false); };

  // tags removed — form will only handle title, excerpt, content, images

  // Extract first images and first paragraph (excerpt) from HTML content.
  const extractMetadataFromContent = (htmlContent: string) => {
    if (!htmlContent) return { images: [], excerpt: '' , contentWithoutImages: '' };
    try {
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      const imgEls = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
      const images = imgEls.map(i => i.src).filter(Boolean);
      // remove images from content to avoid duplication in article body when we also store images separately
      imgEls.forEach(i => i.remove());
      // find first paragraph text for excerpt
      let excerpt = '';
      const p = container.querySelector('p');
      if (p && p.textContent) excerpt = p.textContent.trim();
      const contentWithoutImages = container.innerHTML;
      return { images, excerpt, contentWithoutImages };
    } catch (err) {
      console.error('extractMetadataFromContent error', err);
      return { images: [], excerpt: '', contentWithoutImages: htmlContent };
    }
  };

  // handle multiple files and single file
  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      // if multiple, use uploadMultiple; otherwise uploadSingle
      if (files.length > 1) {
        const arr = Array.from(files);
        const res = await uploadApi.uploadMultiple(arr as File[]);
        const images = res?.data?.images || res?.images || [];
        setForm((prev: any) => ({ ...prev, images }));
        setImagesTouched(true);
      } else {
        const file = files[0];
        const res = await uploadApi.uploadSingle(file);
        const imageUrl = res?.data?.image || res?.image || null;
        if (imageUrl) {
          setForm((prev: any) => ({ ...prev, images: [imageUrl] }));
          setImagesTouched(true);
        }
      }
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImageAt = (index: number) => {
    setForm((prev: any) => {
      const images = (prev.images || []).slice();
      images.splice(index, 1);
      return { ...prev, images };
    });
    setImagesTouched(true);
  };

  const save = async () => {
    // simple validation
    if (!form.title || !form.excerpt) {
      alert('Please enter title and excerpt');
      return;
    }
    setSaving(true);
    try {
      // Determine id to update: prefer editing._id, then form._id or form.id
      const targetId = editing && (editing._id || editing.id) ? (editing._id || editing.id) : (form._id || form.id || null);
      console.log('Saving news, targetId:', targetId, 'form images length:', (form.images || []).length);
      // Before saving, if excerpt or images are missing, try to extract from content
      // Work on a copy to avoid mutating React state directly
      let payloadForm: any = { ...form };
      if ((!payloadForm.excerpt || String(payloadForm.excerpt).trim() === '') || !(payloadForm.images && payloadForm.images.length)) {
        const extracted = extractMetadataFromContent(payloadForm.content || '');
        if ((!payloadForm.excerpt || String(payloadForm.excerpt).trim() === '') && extracted.excerpt) {
          payloadForm.excerpt = extracted.excerpt;
        }
        if (!(payloadForm.images && payloadForm.images.length) && extracted.images && extracted.images.length) {
          payloadForm.images = extracted.images;
        }
        // prefer content without images to avoid duplication in the stored content
        if (extracted.contentWithoutImages) {
          payloadForm.content = extracted.contentWithoutImages;
        }
      }

      if (targetId) {
        // When updating, include images only if user has interacted with images (imagesTouched=true).
        // This allows preserving server images unless the user explicitly changed them.
        const payload: any = { ...payloadForm };
        if (!imagesTouched) {
          // user did not touch images for this edit, so don't send images key (preserve server copy)
          if (!payload.images || (Array.isArray(payload.images) && payload.images.length === 0)) {
            delete payload.images;
          }
        } else {
          // user touched images: include images even if empty to clear them on server
          payload.images = Array.isArray(payload.images) ? payload.images : [];
        }
        // remove tags and highlight fields from payload (we no longer use tags/highlight in form)
        if (payload.tags) delete payload.tags;
        if (payload.isHighlighted !== undefined) delete payload.isHighlighted;
        await newsApi.updateNews(targetId, payload);
      } else {
        // when creating, only send the minimal fields (avoid sending tags/isHighlighted)
        const createPayload: any = { ...payloadForm };
        if (createPayload.tags) delete createPayload.tags;
        if (createPayload.isHighlighted !== undefined) delete createPayload.isHighlighted;
        await newsApi.createNews(createPayload);
      }
      load();
  setEditing(null);
  setForm(createEmptyForm());
  setImagesTouched(false);
    } catch (err) {
      console.error('Save failed', err);
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this news?')) return;
    try {
      await newsApi.deleteNews(id);
      load();
    } catch (err: any) {
      console.error('Delete failed', err);
      // show helpful message to user
      const msg = err?.message || err?.toString() || 'Delete failed';
      alert(`Unable to delete news: ${msg}`);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h2 className="m-0">Manage News</h2>
        <button className="btn btn-link" onClick={() => navigate(-1)}>&larr; Back</button>
      </div>
            <div className="mb-3 d-flex align-items-center gap-2">
        <button className="btn btn-primary me-2" onClick={handleNew}>New</button>
        <button className="btn btn-secondary" onClick={() => load({ showArchived })}>Refresh</button>
        <div className="form-check ms-3">
          <input className="form-check-input" type="checkbox" value="" id="showArchived" checked={showArchived} onChange={(e) => setShowArchived(e.currentTarget.checked)} />
          <label className="form-check-label" htmlFor="showArchived">Show archived</label>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div style={{maxHeight: '70vh', overflowY: 'auto'}}>
            {loading ? <div>Loading...</div> : items.map(it => (
              <div key={it._id} className="card mb-2 p-2 d-flex flex-row align-items-start">
                <div style={{width: 110, height: 80, flex: '0 0 110px', marginRight: 12}}>
                  {it.images && it.images[0] ? (
                    <img src={it.images[0]} alt="thumb" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                  ) : (
                    <div className="bg-light d-flex align-items-center justify-content-center" style={{width: '100%', height: '100%'}}>No Image</div>
                  )}
                </div>
                <div style={{flex: 1}}>
                  <h6 className="mb-1">{it.title} {it.status === 'archived' && <span className="badge bg-warning ms-2">Archived</span>}</h6>
                  <div className="mb-1 text-muted small">{new Date(it.createdAt).toLocaleString()} · {it.views || 0} views</div>
                  <p className="mb-1 text-truncate" style={{maxWidth: '100%'}}>{it.excerpt}</p>
                        {/* tags removed from list view */}
                        <div>
                                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(it)}>Edit</button>
                                        <button
                                          className={`btn btn-sm ${it.isHighlighted ? 'btn-warning' : 'btn-outline-secondary'} me-2`}
                                          onClick={async () => {
                                            try {
                                              await newsApi.updateNews(it._id, { isHighlighted: !it.isHighlighted });
                                              load({ showArchived });
                                            } catch (e) {
                                              console.error('Toggle highlight failed', e);
                                              alert('Unable to change highlight status');
                                            }
                                          }}
                                        >
                                          {it.isHighlighted ? 'Unhighlight' : 'Highlight'}
                                        </button>
                          {it.status === 'archived' ? (
                            <button className="btn btn-sm btn-success me-2" onClick={async () => { try { await newsApi.restoreNews(it._id); load({ showArchived }); alert('Restored'); } catch (e) { alert('Restore failed'); } }}>Restore</button>
                          ) : (
                            <button className="btn btn-sm btn-outline-danger" onClick={() => remove(it._id)}>Delete</button>
                          )}
                        </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-md-6">
          <div className="card p-3">
            <h5>{editing ? `Editing: ${editing.title || ''}` : 'Create News'}</h5>
            <div className="mb-2">
              <label>Title</label>
              <input className="form-control" value={form.title} onChange={e => setForm((prev: any) => ({...prev, title: e.target.value}))} />
            </div>
            {/* Created At removed: DB will set createdAt automatically on create */}
            <div className="mb-2">
              <label>Excerpt</label>
              <input className="form-control" value={form.excerpt} onChange={e => setForm((prev: any) => ({...prev, excerpt: e.target.value}))} />
            </div>
            <div className="mb-2">
              <label>Content (HTML)</label>
              <ReactQuill theme="snow" value={form.content} onChange={(val: any) => setForm((prev: any) => ({...prev, content: val}))} />
            </div>
            {/* Tags and highlight removed — form only contains title, excerpt, content, images */}
            <div className="mb-2">
              <label>Images</label>
              <input type="file" accept="image/*" className="form-control" multiple onChange={handleFiles} />
              {uploading && <div className="text-muted">Uploading...</div>}
              <div className="d-flex flex-wrap gap-2 mt-2">
                {(form.images || []).map((img: string, i: number) => (
                  <div key={i} style={{position: 'relative'}}>
                    <img src={img} alt={`img-${i}`} style={{width: 120, height: 80, objectFit: 'cover', borderRadius: 4}} />
                    <button type="button" className="btn btn-sm btn-danger" style={{position: 'absolute', right: 6, top: 6}} onClick={() => removeImageAt(i)}>×</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-2 d-flex gap-2">
              <button className="btn btn-success" onClick={save} disabled={saving || uploading}>{saving ? 'Saving...' : (editing ? 'Update' : 'Create')}</button>
              <button className="btn btn-outline-secondary" onClick={() => { setForm(createEmptyForm()); setEditing(null); setImagesTouched(false); }}>Reset</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
