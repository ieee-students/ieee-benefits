import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Pencil, Loader2 } from 'lucide-react';
import { fetchOUs, fetchCategories, fetchSpoInfo, submitContribution } from '../services/api';
import BenefitCard from '../components/BenefitCard';
import { useBenefits } from '../context/BenefitsContext';
import './Contribute.css';

const Contribute = () => {
  const [spos, setSpos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [spoInfo, setSpoInfo] = useState({});
  const [spoNameToId, setSpoNameToId] = useState({});
  const { benefits } = useBenefits();

  const [formData, setFormData] = useState({
    spoName: '',
    otherSpoName: '',
    category: '',
    title: '',
    description: '',
    url: '',
    date: '',
    deadline: '',
    ieeeMembershipRequired: false,
    student: false,
    annual: false,
    createdByName: localStorage.getItem('contributor_name') || '',
    createdByEmail: localStorage.getItem('contributor_email') || ''
  });

  useEffect(() => {
    Promise.all([fetchOUs(), fetchCategories(), fetchSpoInfo()]).then(([sposData, categoriesData, spoInfoData]) => {
      setSpos(sposData);
      setCategories(categoriesData);
      setSpoInfo(spoInfoData);
      
      const map = {};
      sposData.forEach(s => { map[s.spoName] = s.hiddenSpoId; });
      setSpoNameToId(map);
      
      setLoading(false);
    });
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getSlug = (text) => text?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || '';

  const generatedId = useMemo(() => {
    let hiddenSpoId = 'spoid';
    if (formData.spoName === 'Other') {
      hiddenSpoId = getSlug(formData.otherSpoName) || 'other';
    } else {
      const spo = spos.find(s => s.spoName === formData.spoName);
      if (spo) {
        hiddenSpoId = spo.hiddenSpoId;
      }
    }
    const categorySlug = getSlug(formData.category) || 'category';
    const titleSlug = getSlug(formData.title) || 'title';
    return `${hiddenSpoId}-${categorySlug}-${titleSlug}`;
  }, [formData.spoName, formData.otherSpoName, formData.category, formData.title, spos]);

  const existingBenefits = useMemo(() => {
    const targetSpoName = formData.spoName === 'Other' ? formData.otherSpoName : formData.spoName;
    if (!targetSpoName) return [];
    return benefits.filter(b => {
      if (b.spoName !== targetSpoName) return false;
      if (formData.category && b.category !== formData.category) return false;
      return true;
    });
  }, [benefits, formData.spoName, formData.otherSpoName, formData.category]);

  const formPaneRef = useRef(null);

  // Normalizes a value to YYYY-MM-DD for <input type="date">, returns '' if invalid
  const toDateInputValue = (val) => {
    if (!val) return '';
    // Already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    // Try parsing as a date
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
    return '';
  };

  const handleEditBenefit = (benefit) => {
    const exists = spos.some(s => s.spoName === benefit.spoName);
    setFormData({
      spoName: exists ? (benefit.spoName || '') : 'Other',
      otherSpoName: exists ? '' : (benefit.spoName || ''),
      category: benefit.category || '',
      title: benefit.title || '',
      description: benefit.description || '',
      url: benefit.url || '',
      date: toDateInputValue(benefit.date),
      deadline: toDateInputValue(benefit.deadline),
      ieeeMembershipRequired: !!benefit.ieeeMembershipRequired,
      student: !!benefit.student,
      annual: !!benefit.annual,
      createdByName: '',
      createdByEmail: ''
    });
    // Scroll the form into view on mobile, or just highlight it
    if (formPaneRef.current) {
      formPaneRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleResetForm = () => {
    setFormData({
      spoName: '',
      otherSpoName: '',
      category: '',
      title: '',
      description: '',
      url: '',
      date: '',
      deadline: '',
      ieeeMembershipRequired: false,
      student: false,
      annual: false,
      createdByName: localStorage.getItem('contributor_name') || '',
      createdByEmail: localStorage.getItem('contributor_email') || ''
    });
    setSubmitResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);

    // Cache contributor details
    localStorage.setItem('contributor_name', formData.createdByName || '');
    localStorage.setItem('contributor_email', formData.createdByEmail || '');

    const finalSpoName = formData.spoName === 'Other' ? formData.otherSpoName : formData.spoName;
    const payload = {
      ...formData,
      spoName: finalSpoName,
      id: generatedId
    };
    delete payload.otherSpoName;

    try {
      const result = await submitContribution(payload);

      if (result.success) {
        setSubmitResult({ type: 'success', message: 'Contribution submitted. It is now pending verification.' });
      }
    } catch (err) {
      console.error(err);
      setSubmitResult({ type: 'error', message: err.message || 'An error occurred during submission.' });
    } finally {
      setSubmitting(false);
      if (formPaneRef.current) {
        formPaneRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const getCategoryStyle = (catName) => {
    const cat = categories.find(c => c.title.toLowerCase() === (catName || '').toLowerCase());
    return cat ? { backgroundColor: cat.color, color: cat.textColor, borderColor: cat.color } : {};
  };

  const previewBenefit = {
    id: generatedId,
    status: 'pending',
    spoName: (formData.spoName === 'Other' ? formData.otherSpoName : formData.spoName) || 'Select an Organization',
    category: formData.category || 'Category',
    title: formData.title || 'Benefit Title',
    description: formData.description || 'Description of the opportunity will appear here.',
    url: formData.url,
    date: formData.date,
    deadline: formData.deadline,
    ieeeMembershipRequired: formData.ieeeMembershipRequired,
    student: formData.student,
    annual: formData.annual
  };

  return (
    <div className="contribute-page">
      <header className="page-header">
        <h1>Contribute a Benefit</h1>
        <p className="subtitle text-muted" style={{ maxWidth: 'none', width: '100%' }}>
          Help us grow the IEEE Benefits by submitting a new benefit.
        </p>
      </header>

      <div className="contribute-layout">
        {/* Left Side: Live Preview */}
        <div className="preview-pane">
          <div className="preview-sticky">
            <h3>Live Card Preview</h3>
            <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              This is how your contribution will appear on the platform once verified and approved.
            </p>
            <div className="preview-container">
              <BenefitCard benefit={previewBenefit} spoInfo={spoInfo} spoNameToId={spoNameToId} />
            </div>

            {formData.spoName && (
              <div className="existing-benefits-preview glass-panel">
                <h4>Existing Benefits</h4>
                <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.8rem' }}>
                  Review these existing entries to avoid duplicates.
                </p>
                {existingBenefits.length > 0 ? (
                  <ul className="minimal-benefit-list">
                    {existingBenefits.map(b => (
                      <li key={b.id} title={b.title}>
                        <span className="badge small-badge" style={getCategoryStyle(b.category)}>{b.category}</span>
                        <span className="benefit-title">{b.title}</span>
                        <button
                          className="edit-benefit-btn"
                          onClick={() => handleEditBenefit(b)}
                          title="Load into form for editing"
                          aria-label={`Edit ${b.title}`}
                        >
                          <Pencil size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
                    No similar benefits found.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="form-pane glass-panel" ref={formPaneRef}>
          {loading ? (
            <div className="loading-state" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--primary)' }} />
              <span>Loading form data...</span>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="contribute-form">
            {submitResult && (
              <div className={`alert alert-${submitResult.type}`} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'flex-start' }}>
                <span>{submitResult.message}</span>
                {submitResult.type === 'success' && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleResetForm} style={{ alignSelf: 'flex-start' }}>
                    Add Another Benefit
                  </button>
                )}
              </div>
            )}

            <fieldset disabled={submitResult?.type === 'success'} style={{ border: 'none', padding: 0, margin: 0, display: 'contents' }}>

            <div className="form-section">
              <h3 className="section-title">Benefit Details</h3>

              <div className="form-group grid-2">
                <div className="input-wrap">
                  <label>Organization Unit <span style={{ color: '#ef4444' }}>*</span></label>
                  <select name="spoName" value={formData.spoName} onChange={handleInputChange} required>
                    <option value="" disabled>Select Organization</option>
                    {spos.map(spo => (
                      <option key={spo.hiddenSpoId} value={spo.spoName}>{spo.spoName}</option>
                    ))}
                    <option value="Other">Other (Please specify...)</option>
                  </select>
                </div>
                <div className="input-wrap">
                  <label>Category <span style={{ color: '#ef4444' }}>*</span></label>
                  <select name="category" value={formData.category} onChange={handleInputChange} required>
                    <option value="" disabled>Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.title} value={cat.title}>{cat.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.spoName === 'Other' && (
                <div className="form-group">
                  <label>Specify Organization Unit <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    name="otherSpoName"
                    value={formData.otherSpoName || ''}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. IEEE Humanitarian Activities Committee"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Benefit Title <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required placeholder="e.g. Richard E. Merwin Student Scholarship" />
              </div>

              <div className="form-group">
                <label>System Generated ID</label>
                <input type="text" value={generatedId} readOnly className="readonly-input" />
              </div>



              <div className="form-group">
                <label>Description <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder="Provide a clear and concise description of the benefit."
                  maxLength="500"
                ></textarea>
                <div className="char-count">{formData.description.length}/500</div>
              </div>

              <div className="form-group">
                <label>Primary Link (URL) <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="url" name="url" value={formData.url} onChange={handleInputChange} required placeholder="https://..." />
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">Timeline & Eligibility</h3>
              <div className="form-group grid-2">
                <div className="input-wrap">
                  <label>Event Date (Optional)</label>
                  <input type="date" name="date" value={formData.date} onChange={handleInputChange} />
                  <p className="field-hint">Date on which the event, competition, or activity will take place.</p>
                </div>
                <div className="input-wrap">
                  <label>Application Deadline (Optional)</label>
                  <input type="date" name="deadline" value={formData.deadline} onChange={handleInputChange} />
                  <p className="field-hint">Final date for registrations or applications. This is typically before the event date.</p>
                </div>
              </div>

              <div className="form-group checkbox-grid">
                <label className="checkbox-card">
                  <input type="checkbox" name="ieeeMembershipRequired" checked={formData.ieeeMembershipRequired} onChange={handleInputChange} />
                  <span className="custom-checkmark"></span>
                  <div className="checkbox-info-group">
                    <span className="checkbox-title">IEEE Membership Required</span>
                    <span className="checkbox-desc">Check if participation or eligibility is restricted to IEEE members only. Leave unchecked if open to non-members.</span>
                  </div>
                </label>
                
                <label className="checkbox-card">
                  <input type="checkbox" name="student" checked={formData.student} onChange={handleInputChange} />
                  <span className="custom-checkmark"></span>
                  <div className="checkbox-info-group">
                    <span className="checkbox-title">Student-Only Eligibility</span>
                    <span className="checkbox-desc">Check if this opportunity is limited strictly to university students (undergraduates, postgraduates, MSc, PhD).</span>
                  </div>
                </label>
                
                <label className="checkbox-card">
                  <input type="checkbox" name="annual" checked={formData.annual} onChange={handleInputChange} />
                  <span className="custom-checkmark"></span>
                  <div className="checkbox-info-group">
                    <span className="checkbox-title">Annual Recurring Opportunity</span>
                    <span className="checkbox-desc">Check if this opportunity is offered annually. The details will be reviewed and updated each year.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">Contributor Information</h3>
              <div className="form-group grid-2">
                <div className="input-wrap">
                  <label>Your Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="createdByName" value={formData.createdByName} onChange={handleInputChange} required placeholder="Top Contributor" />
                </div>
                <div className="input-wrap">
                  <label>Your Email <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="email" name="createdByEmail" value={formData.createdByEmail} onChange={handleInputChange} required placeholder="top.contributor@ieee.org" />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary submit-btn" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Contribution'}
              </button>
            </div>
            </fieldset>
          </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contribute;
