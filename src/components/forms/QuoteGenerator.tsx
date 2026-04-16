'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface ServicePackage {
  id: number;
  name: string;
  description: string;
  base_price: number;
  features: string[];
}

interface Quote {
  id: number;
  quote_number: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  service_package_id: number;
  base_price: number;
  total_price: number;
  discount_percent: number;
  final_price: number;
  status: string;
}

interface GenerateQuoteResponse {
  success: boolean;
  data?: Quote;
  error?: string;
}

export default function QuoteGenerator() {
  const t = useTranslations();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatedQuote, setGeneratedQuote] = useState<Quote | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    additional_requirements: '',
    discount_percent: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load packages on mount
  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quotes/packages');
      const result = await response.json();
      if (result.success) {
        setPackages(result.data);
        if (result.data.length > 0) {
          setSelectedPackage(result.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.client_name.trim()) {
      newErrors.client_name = 'Name is required';
    }
    if (!formData.client_email.trim()) {
      newErrors.client_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.client_email)) {
      newErrors.client_email = 'Invalid email format';
    }
    if (formData.discount_percent < 0 || formData.discount_percent > 100) {
      newErrors.discount_percent = 'Discount must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateQuote = async () => {
    if (!selectedPackage || !validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: formData.client_name,
          client_email: formData.client_email,
          client_phone: formData.client_phone || undefined,
          service_package_id: selectedPackage.id,
          additional_requirements: formData.additional_requirements || undefined,
          discount_percent: formData.discount_percent
        })
      });

      const result: GenerateQuoteResponse = await response.json();
      if (result.success && result.data) {
        setGeneratedQuote(result.data);
        setShowForm(false);
      } else {
        alert('Failed to generate quote: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating quote:', error);
      alert('Failed to generate quote');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!generatedQuote) return;

    try {
      setPdfLoading(true);
      const response = await fetch(`/api/quotes/${generatedQuote.id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Quote-${generatedQuote.quote_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const resetForm = () => {
    setGeneratedQuote(null);
    setShowForm(false);
    setFormData({
      client_name: '',
      client_email: '',
      client_phone: '',
      additional_requirements: '',
      discount_percent: 0
    });
    setErrors({});
  };

  if (loading && packages.length === 0) {
    return (
      <div className="py-8 text-center">
        <p>Loading packages...</p>
      </div>
    );
  }

  // Show generated quote
  if (generatedQuote) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">✓ Quote Generated Successfully</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Quote Number</p>
              <p className="font-mono text-lg font-semibold">{generatedQuote.quote_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-lg font-semibold text-green-600">${generatedQuote.final_price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Client</p>
              <p>{generatedQuote.client_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-sm">{generatedQuote.client_email}</p>
            </div>
          </div>

          {generatedQuote.discount_percent > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm">
                <span className="font-semibold">Discount:</span> {generatedQuote.discount_percent}% 
                ({' '}
                <span className="text-blue-600">-${(generatedQuote.total_price - generatedQuote.final_price).toFixed(2)}</span>
                {' '}
                )
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={downloadPDF}
              disabled={pdfLoading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
            >
              {pdfLoading ? 'Generating PDF...' : '📥 Download PDF'}
            </button>
            <button
              onClick={resetForm}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Generate New Quote
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Quote is valid for 30 days. A confirmation email has been sent to {generatedQuote.client_email}
          </p>
        </div>
      </div>
    );
  }

  // Show package selection or form
  return (
    <div className="space-y-6">
      {!showForm ? (
        <>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Service Package</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map(pkg => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-4 border rounded-lg cursor-pointer transition ${
                    selectedPackage?.id === pkg.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <h4 className="font-semibold mb-2">{pkg.name}</h4>
                  <p className="text-2xl font-bold text-blue-600 mb-2">
                    ${pkg.base_price.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                  {pkg.features && pkg.features.length > 0 && (
                    <ul className="text-sm space-y-1">
                      {pkg.features.slice(0, 3).map((feature, i) => (
                        <li key={i} className="text-gray-700">
                          • {feature}
                        </li>
                      ))}
                      {pkg.features.length > 3 && (
                        <li className="text-gray-500 italic">+{pkg.features.length - 3} more</li>
                      )}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowForm(true)}
            disabled={!selectedPackage || loading}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
          >
            Continue with Selected Package
          </button>
        </>
      ) : (
        <>
          <div className="mb-4">
            <button
              onClick={() => setShowForm(false)}
              className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
            >
              ← Back to Packages
            </button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="font-semibold mb-2">Selected Package:</p>
            <p className="text-lg">{selectedPackage?.name}</p>
            <p className="text-2xl font-bold text-blue-600">${selectedPackage?.base_price.toFixed(2)}</p>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.client_name}
                onChange={e => setFormData({...formData, client_name: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                  errors.client_name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.client_name && <p className="text-red-500 text-sm mt-1">{errors.client_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                value={formData.client_email}
                onChange={e => setFormData({...formData, client_email: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                  errors.client_email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.client_email && <p className="text-red-500 text-sm mt-1">{errors.client_email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.client_phone}
                onChange={e => setFormData({...formData, client_phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Additional Requirements</label>
              <textarea
                value={formData.additional_requirements}
                onChange={e => setFormData({...formData, additional_requirements: e.target.value})}
                placeholder="Describe any additional requirements for your project..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.discount_percent}
                onChange={e => setFormData({...formData, discount_percent: parseFloat(e.target.value) || 0})}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none ${
                  errors.discount_percent ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.discount_percent && <p className="text-red-500 text-sm mt-1">{errors.discount_percent}</p>}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={generateQuote}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
              >
                {loading ? 'Generating...' : 'Generate Quote'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
