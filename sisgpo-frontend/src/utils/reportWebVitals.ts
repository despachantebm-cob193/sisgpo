import { onCLS, onFID, onLCP, onINP, onTTFB, Metric } from 'web-vitals';
import api from '../services/api';

const getVisitId = () => {
  const key = 'wv-visit-id';
  let v = localStorage.getItem(key);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(key, v);
  }
  return v;
};

const sendMetric = async (metric: Metric) => {
  try {
    await api.post('/api/public/vitals', {
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      id_visita: getVisitId(),
      url: window.location.href,
    });
  } catch (err) {
    // Evita ruído; apenas loga em dev
    if (import.meta.env.DEV) {
      console.warn('[web-vitals] Falha ao enviar métrica', metric.name, err);
    }
  }
};

export const initWebVitalsReporting = () => {
  onCLS(sendMetric);
  onFID(sendMetric);
  onLCP(sendMetric);
  onINP(sendMetric);
  onTTFB(sendMetric);
};

export default initWebVitalsReporting;
