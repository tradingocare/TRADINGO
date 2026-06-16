import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const chatSendTrend = new Trend('chat_send_time');
const chatLoadTrend = new Trend('chat_load_time');
const conversationTrend = new Trend('conversation_list_time');
const errorRate = new Rate('chat_errors');

export const options = {
  thresholds: {
    chat_errors: ['rate<0.02'],
    chat_send_time: ['p(95)<2000'],
    chat_load_time: ['p(95)<3000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001/api/v1';
const USER_TOKEN = __ENV.USER_TOKEN || '';

const messages = [
  'What is the lead time?',
  'Can you provide a sample?',
  'Is FOB pricing available?',
  'What are the payment terms?',
  'Do you have MoQ?',
  'Please share the technical specs.',
  'Can you ship to Dubai?',
  'What is the HS code?',
  'Are there any certifications?',
  'Please send the catalog.',
];

export default function () {
  if (!USER_TOKEN) return;

  group('list conversations', () => {
    const res = http.get(`${BASE_URL}/chat/conversations`, {
      headers: { Authorization: `Bearer ${USER_TOKEN}` },
    });
    conversationTrend.add(res.timings.duration);
    check(res, { 'conversations ok': (r) => r.status === 200 });
  });

  group('send message', () => {
    const msg = messages[Math.floor(Math.random() * messages.length)];
    const payload = {
      conversationId: `conv-${Math.floor(Math.random() * 100) + 1}`,
      content: msg,
    };

    const res = http.post(`${BASE_URL}/chat/messages`, JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${USER_TOKEN}`,
      },
    });

    chatSendTrend.add(res.timings.duration);
    errorRate.add(res.status !== 201);
    check(res, { 'message sent': (r) => r.status === 201 });
  });

  group('load messages', () => {
    const convId = `conv-${Math.floor(Math.random() * 100) + 1}`;
    const res = http.get(`${BASE_URL}/chat/conversations/${convId}/messages?page=1&limit=50`, {
      headers: { Authorization: `Bearer ${USER_TOKEN}` },
    });
    chatLoadTrend.add(res.timings.duration);
    check(res, { 'messages loaded': (r) => r.status === 200 });
  });

  sleep(Math.random() * 2 + 1);
}
