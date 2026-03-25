/**
 * Trading page — redirects to chat with crypto agents.
 * No dashboard, no pipeline UI. The agents ARE the pipeline.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function CryptoPage() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/chat'); }, [navigate]);
  return null;
}
