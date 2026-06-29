/**
 * Rule-based AI service for complaint classification, priority prediction,
 * summary generation, and duplicate detection.
 *
 * Designed to work without any external AI API key.
 */

// ────────────────────────────────────────────────────
// Category Classification
// ────────────────────────────────────────────────────

const categoryKeywords: Record<string, string[]> = {
  Hardware: [
    'laptop', 'computer', 'monitor', 'keyboard', 'mouse', 'printer', 'scanner',
    'device', 'hardware', 'screen', 'display', 'battery', 'charger', 'cable',
    'headset', 'webcam', 'broken', 'damaged', 'physical',
  ],
  Software: [
    'software', 'application', 'app', 'install', 'crash', 'error', 'bug',
    'update', 'license', 'windows', 'macos', 'linux', 'office', 'excel', 'word',
    'teams', 'zoom', 'outlook', 'antivirus', 'virus', 'malware', 'freeze', 'slow',
  ],
  Network: [
    'network', 'internet', 'wifi', 'vpn', 'connection', 'speed', 'bandwidth',
    'ping', 'disconnected', 'router', 'switch', 'firewall', 'proxy', 'dns',
    'ip address', 'remote', 'ethernet', 'cable',
  ],
  'Access / Permissions': [
    'access', 'permission', 'login', 'password', 'reset', 'account', 'locked',
    'blocked', 'denied', 'credentials', 'two-factor', '2fa', 'mfa', 'authentication',
    'authorization', 'role', 'privilege', 'cannot open', 'forbidden',
  ],
  Facilities: [
    'facilities', 'office', 'room', 'desk', 'chair', 'ac', 'air conditioning',
    'heating', 'lights', 'power', 'electricity', 'socket', 'generator',
    'cleaning', 'maintenance', 'building',
  ],
  Others: [],
};

export function classifyCategory(text: string): string {
  const lower = text.toLowerCase();
  let bestCategory = 'Others';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (category === 'Others') continue;
    const score = keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

// ────────────────────────────────────────────────────
// Priority Prediction
// ────────────────────────────────────────────────────

const criticalKeywords = [
  'critical', 'urgent', 'emergency', 'production down', 'server down', 'outage',
  'data loss', 'security breach', 'hack', 'ransomware', 'all users', 'entire team',
  'completely broken', 'cannot work', 'office down',
];

const highKeywords = [
  'high', 'important', 'severe', 'major', 'significant', 'not working', 'blocked',
  'cannot access', 'deadline', 'affecting multiple', 'multiple users', 'team blocked',
];

const lowKeywords = [
  'minor', 'low', 'small', 'cosmetic', 'question', 'inquiry', 'when possible',
  'nice to have', 'enhancement', 'suggestion', 'whenever', 'no rush',
];

export function predictPriority(text: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const lower = text.toLowerCase();

  if (criticalKeywords.some((kw) => lower.includes(kw))) return 'CRITICAL';
  if (highKeywords.some((kw) => lower.includes(kw))) return 'HIGH';
  if (lowKeywords.some((kw) => lower.includes(kw))) return 'LOW';
  return 'MEDIUM';
}

// ────────────────────────────────────────────────────
// Summary Generation
// ────────────────────────────────────────────────────

export function generateSummary(subject: string, description: string): string {
  // Extract first meaningful sentence from description
  const sentences = description
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  const firstSentence = sentences[0] || description.slice(0, 120);

  // Count words as rough complexity metric
  const wordCount = description.split(/\s+/).length;
  const complexity = wordCount > 100 ? 'detailed' : wordCount > 40 ? 'moderate' : 'brief';

  return `Issue: "${subject}" — ${firstSentence.slice(0, 150)}${firstSentence.length > 150 ? '...' : ''}. This is a ${complexity} complaint.`;
}

// ────────────────────────────────────────────────────
// Duplicate Detection (keyword overlap)
// ────────────────────────────────────────────────────

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

export interface PotentialDuplicate {
  ticketNo: string;
  subject: string;
  similarity: number;
}

export function detectDuplicates(
  newText: string,
  existingTickets: Array<{ ticketNo: string; subject: string; description: string }>
): PotentialDuplicate[] {
  const newTokens = tokenize(newText);

  return existingTickets
    .map((ticket) => ({
      ticketNo: ticket.ticketNo,
      subject: ticket.subject,
      similarity: jaccardSimilarity(newTokens, tokenize(`${ticket.subject} ${ticket.description}`)),
    }))
    .filter((r) => r.similarity >= 0.35)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);
}

// ────────────────────────────────────────────────────
// Chat Assistant (rule-based pattern matching)
// ────────────────────────────────────────────────────

const chatResponses: Array<{ patterns: string[]; response: string }> = [
  {
    patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
    response:
      'Hello! I\'m the IT Support Assistant. I can help you with complaint submissions, ticket status inquiries, and general IT guidance. How can I assist you today?',
  },
  {
    patterns: ['status', 'ticket status', 'my ticket', 'complaint status', 'update'],
    response:
      'To check your ticket status, navigate to your Dashboard and look under "My Complaints". Each ticket shows real-time status: Open, In Progress, Waiting for User, Resolved, or Closed.',
  },
  {
    patterns: ['create', 'submit', 'new complaint', 'raise ticket', 'report issue'],
    response:
      'To create a new complaint: 1) Go to Dashboard, 2) Click "New Complaint", 3) Fill in the subject and description, 4) Our AI will auto-classify the category and priority, 5) Attach screenshots if helpful, then submit.',
  },
  {
    patterns: ['password', 'forgot password', 'reset password', 'locked out'],
    response:
      'For password issues: Submit a complaint with category "Access / Permissions". Include your employee ID and email. An IT admin will reset it within 2 hours during business hours.',
  },
  {
    patterns: ['wifi', 'internet', 'network', 'connection', 'vpn'],
    response:
      'For network issues: 1) Restart your device, 2) Disconnect and reconnect to WiFi, 3) Try VPN if remote, 4) If issues persist, submit a complaint under "Network" category with your location.',
  },
  {
    patterns: ['laptop', 'computer', 'hardware', 'broken', 'damaged'],
    response:
      'For hardware problems: Document the issue clearly and submit a complaint under "Hardware" category. Include model number, serial number if available, and photos of the damage.',
  },
  {
    patterns: ['software', 'install', 'application', 'crash'],
    response:
      'For software issues: Submit under "Software" category. Include the application name, version, and error message or screenshot. Our team typically responds within 4 hours.',
  },
  {
    patterns: ['sla', 'response time', 'how long', 'when', 'timeline'],
    response:
      'Our SLA targets: Critical issues — 1 hour. High priority — 4 hours. Medium priority — 1 business day. Low priority — 3 business days. You\'ll receive notifications at each stage.',
  },
  {
    patterns: ['escalate', 'manager', 'not resolved', 'complaint about'],
    response:
      'To escalate an issue: Reply on your ticket requesting escalation, or contact your department manager directly. All escalations are logged and handled by senior IT staff.',
  },
  {
    patterns: ['help', 'support', 'assist', 'how do i', 'what can you'],
    response:
      'I can help you with: checking ticket status, creating complaints, IT troubleshooting tips, understanding SLAs, escalation procedures, and general portal navigation. What do you need?',
  },
];

export function getChatResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  for (const entry of chatResponses) {
    if (entry.patterns.some((p) => lower.includes(p))) {
      return entry.response;
    }
  }

  return 'I understand you need assistance. For the best support, please create a complaint ticket describing your issue in detail — our IT team will respond promptly. Is there anything specific about the portal I can help you with?';
}
