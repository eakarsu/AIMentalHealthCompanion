import express from 'express';

const router = express.Router();

const requiredText = (value) => typeof value === 'string' && value.trim().length > 0;

router.post('/check', (req, res) => {
  const {
    planName = 'Personal safety plan',
    warningSigns = [],
    copingSteps = [],
    supportContacts = [],
    environmentRisks = [],
    completedSteps = [],
    moodTrend = 'stable',
    crisisSignal = false,
  } = req.body || {};

  if (!requiredText(planName)) {
    return res.status(400).json({ error: 'Plan name is required' });
  }

  const normalizedCompleted = new Set((Array.isArray(completedSteps) ? completedSteps : []).map((item) => String(item).toLowerCase()));
  const checklist = [
    ...warningSigns.map((item) => ({ type: 'warning sign', item })),
    ...copingSteps.map((item) => ({ type: 'coping step', item })),
    ...supportContacts.map((item) => ({ type: 'support contact', item })),
    ...environmentRisks.map((item) => ({ type: 'environment risk', item })),
  ].filter((entry) => requiredText(entry.item));

  const completedCount = checklist.filter((entry) => normalizedCompleted.has(String(entry.item).toLowerCase())).length;
  const adherenceScore = checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0;
  const riskAdders = [
    crisisSignal ? 35 : 0,
    moodTrend === 'declining' ? 20 : 0,
    supportContacts.length === 0 ? 15 : 0,
    environmentRisks.length > completedCount ? 10 : 0,
  ].reduce((sum, value) => sum + value, 0);
  const riskScore = Math.min(100, Math.max(0, 100 - adherenceScore + riskAdders));
  const riskBand = riskScore >= 70 ? 'urgent' : riskScore >= 45 ? 'elevated' : 'steady';

  const nextActions = [
    ...(supportContacts.length ? ['Confirm one support contact is reachable today.'] : ['Add at least one trusted support contact to the plan.']),
    ...(copingSteps.length ? ['Choose one coping step that can be started within five minutes.'] : ['Add a short coping step that does not require special equipment.']),
    ...(environmentRisks.length ? ['Reduce or remove the highest-priority environment risk where possible.'] : []),
    ...(crisisSignal ? ['Use local emergency or crisis resources immediately if there is imminent danger.'] : []),
  ];

  res.json({
    feature: 'Safety Plan Adherence Check',
    planName,
    adherenceScore,
    riskScore,
    riskBand,
    completedCount,
    totalChecklistItems: checklist.length,
    gaps: checklist.filter((entry) => !normalizedCompleted.has(String(entry.item).toLowerCase())).slice(0, 8),
    nextActions,
    disclaimer: 'This tool supports safety planning workflows and does not replace professional or emergency care.',
  });
});

export default router;
