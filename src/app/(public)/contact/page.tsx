'use client';
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import ContactForm from '@/components/forms/ContactRequestForm';

export default function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (formData: any) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Liên Hệ</h1>
          {submitStatus === 'success' ? (
            <div className="bg-green-100 text-green-700 p-4 rounded mb-8">
              Cảm ơn bạn đã gửi tin nhắn. Chúng tôi sẽ phản hồi sớm nhất có thể!
            </div>
          ) : submitStatus === 'error' ? (
            <div className="bg-red-100 text-red-700 p-4 rounded mb-8">
              Đã xảy ra lỗi khi gửi tin nhắn. Vui lòng thử lại.
            </div>
          ) : null}
          <ContactForm onSubmit={handleSubmit} disabled={submitting} />
        </div>
      </div>
    </Layout>
  );
}