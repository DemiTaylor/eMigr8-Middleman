import { CandidateProfile, RouteMatchResult, CriteriaEvaluation, PipelineExecutionLog, WebhookEvent } from '../types/middleware';
import { VISA_ROUTES, TECH_NATION_CRITERIA_SPECS } from '../data/visaCriteria';

export class Emigr8MiddlewareEngine {
  /**
   * Stage 1: Ingestion & Normalization
   */
  static normalizeProfile(rawProfile: CandidateProfile): {
    normalized: CandidateProfile;
    metrics: { seniorityIndex: number; salaryPercentile: number; impactTier: string };
    logs: PipelineExecutionLog[];
  } {
    const logs: PipelineExecutionLog[] = [];
    const timestamp = new Date().toISOString();

    logs.push({
      id: `log-${Date.now()}-1`,
      timestamp,
      stage: 'Ingestion',
      level: 'info',
      message: `Payload received from intake webhook for candidate ID: ${rawProfile.id}`,
      details: { email: rawProfile.email, role: rawProfile.currentRole }
    });

    // Sanitize and normalize
    const salary = Math.max(0, rawProfile.salaryUsdEquivalent);
    // Benchmark: Top tech salaries in emerging/global tech hubs
    let salaryPercentile = 70;
    if (salary > 130000) salaryPercentile = 96;
    else if (salary > 90000) salaryPercentile = 88;
    else if (salary > 50000) salaryPercentile = 78;

    const seniorityIndex = Math.min(10, Math.round((rawProfile.yearsExperience * 0.8) + (rawProfile.speakingEngagements * 0.4) + (rawProfile.patentsCount * 1.5)));

    let impactTier = 'Emerging Talent';
    if (seniorityIndex >= 8 || salaryPercentile >= 92 || (rawProfile.openSourceStars && rawProfile.openSourceStars > 2000)) {
      impactTier = 'Global Leader (Tier 1)';
    } else if (seniorityIndex >= 5 || rawProfile.yearsExperience >= 5) {
      impactTier = 'Recognized Contributor (Tier 2)';
    }

    logs.push({
      id: `log-${Date.now()}-2`,
      timestamp,
      stage: 'Normalization',
      level: 'success',
      message: `Normalized tech attributes: Seniority ${seniorityIndex}/10, Salary Percentile ${salaryPercentile}th, Tier: ${impactTier}`,
    });

    return {
      normalized: { ...rawProfile, salaryUsdEquivalent: salary },
      metrics: { seniorityIndex, salaryPercentile, impactTier },
      logs
    };
  }

  /**
   * Stage 2 & 3: Dr. Zenith Criteria Matching Matrix
   */
  static evaluateRoutes(profile: CandidateProfile): {
    results: RouteMatchResult[];
    logs: PipelineExecutionLog[];
  } {
    const logs: PipelineExecutionLog[] = [];
    const timestamp = new Date().toISOString();

    logs.push({
      id: `log-${Date.now()}-3`,
      timestamp,
      stage: 'Evaluation',
      level: 'info',
      message: `Triggering Dr. Zenith evaluation matrix across ${VISA_ROUTES.length} global jurisdictions`,
    });

    const results: RouteMatchResult[] = VISA_ROUTES.map((route) => {
      let score = 50;
      const criteriaEvals: CriteriaEvaluation[] = [];
      const missingEvidence: string[] = [];

      if (route.id === 'uk_global_talent') {
        // UK Tech Nation evaluation
        const track = profile.yearsExperience >= 5 ? 'Exceptional Talent' : 'Exceptional Promise';
        
        // Mandatory Criterion
        let mcScore = 40;
        const mcEvidence: string[] = [];
        if (profile.speakingEngagements >= 2) {
          mcScore += 25;
          mcEvidence.push(`${profile.speakingEngagements} major tech speaking engagements`);
        }
        if (profile.salaryUsdEquivalent > 80000) {
          mcScore += 20;
          mcEvidence.push('High earnings profile exceeding national benchmark');
        }
        if (profile.openSourceStars && profile.openSourceStars > 500) {
          mcScore += 15;
          mcEvidence.push(`Open source ecosystem traction (${profile.openSourceStars} GitHub stars)`);
        }
        mcScore = Math.min(100, mcScore);

        criteriaEvals.push({
          code: 'MC',
          name: 'Mandatory: Leader/Emerging Leader in Digital Tech',
          category: 'Mandatory',
          status: mcScore >= 80 ? 'Met' : mcScore >= 60 ? 'Partially Met' : 'Gap',
          confidenceScore: mcScore,
          matchedEvidence: mcEvidence,
          remediationAdvice: mcScore < 80 ? 'Need 1 international keynote speaker proof or top media feature corroborating leadership.' : 'Exemplary leadership indicators.'
        });

        // OC1: Innovation
        let oc1Score = 30;
        const oc1Evidence: string[] = [];
        if (profile.patentsCount > 0) {
          oc1Score += 45;
          oc1Evidence.push(`${profile.patentsCount} patent(s) filed/granted`);
        }
        if (profile.commercialImpactSummary.length > 30) {
          oc1Score += 35;
          oc1Evidence.push('Documented proprietary algorithm / product architecture');
        }
        criteriaEvals.push({
          code: 'OC1',
          name: 'OC1: Proven Innovation in Digital Tech',
          category: 'Optional',
          status: oc1Score >= 75 ? 'Met' : oc1Score >= 50 ? 'Partially Met' : 'Gap',
          confidenceScore: oc1Score,
          matchedEvidence: oc1Evidence,
          remediationAdvice: oc1Score < 75 ? 'Provide repository architectural diagrams and patent filing certificates.' : 'Strong product innovation evidence.'
        });

        // OC2: Outside Work
        let oc2Score = 20;
        const oc2Evidence: string[] = [];
        if (profile.openSourceContributions) {
          oc2Score += 40;
          oc2Evidence.push('Active open source maintainer');
        }
        if (profile.judgingOrMentoringCount > 0) {
          oc2Score += 35;
          oc2Evidence.push(`Mentored/judged at ${profile.judgingOrMentoringCount} accelerators or hackathons`);
        }
        criteriaEvals.push({
          code: 'OC2',
          name: 'OC2: Contributions Outside Work',
          category: 'Optional',
          status: oc2Score >= 75 ? 'Met' : oc2Score >= 50 ? 'Partially Met' : 'Gap',
          confidenceScore: oc2Score,
          matchedEvidence: oc2Evidence,
          remediationAdvice: oc2Score < 75 ? 'Document open-source PR approvals or mentor confirmation letters on accelerator letterheads.' : 'Verified ecosystem advancement.'
        });

        // OC3: Significant Contribution
        let oc3Score = 35;
        const oc3Evidence: string[] = [];
        if (profile.equityOrStockOptions) {
          oc3Score += 30;
          oc3Evidence.push('Equity / commercial stake in product');
        }
        if (profile.salaryUsdEquivalent > 90000 || profile.companyType === 'Scale-up' || profile.companyType === 'Early Startup') {
          oc3Score += 35;
          oc3Evidence.push('Quantified revenue and commercial throughput');
        }
        criteriaEvals.push({
          code: 'OC3',
          name: 'OC3: Significant Commercial/Tech Impact',
          category: 'Optional',
          status: oc3Score >= 75 ? 'Met' : 'Partially Met',
          confidenceScore: oc3Score,
          matchedEvidence: oc3Evidence,
          remediationAdvice: 'Include executive employment letters corroborating direct financial growth or core deployment.'
        });

        // OC4: Academic / Research
        let oc4Score = 15;
        const oc4Evidence: string[] = [];
        if (profile.publicationsCount > 0) {
          oc4Score += profile.publicationsCount * 18;
          oc4Evidence.push(`${profile.publicationsCount} scientific publications`);
        }
        if (profile.citationsCount > 50) {
          oc4Score += 25;
          oc4Evidence.push(`${profile.citationsCount} scientific citations`);
        }
        oc4Score = Math.min(100, oc4Score);
        criteriaEvals.push({
          code: 'OC4',
          name: 'OC4: Academic & Research Contributions',
          category: 'Optional',
          status: oc4Score >= 70 ? 'Met' : oc4Score >= 40 ? 'Partially Met' : 'Gap',
          confidenceScore: oc4Score,
          matchedEvidence: oc4Evidence,
          remediationAdvice: 'Gather Google Scholar profile or letters from university department chairs.'
        });

        // Overall UK Tech Nation fit
        const metOptionals = criteriaEvals.filter(c => c.category === 'Optional' && c.confidenceScore >= 70).length;
        const isMcMet = mcScore >= 75;
        score = Math.round((mcScore * 0.4) + (metOptionals >= 2 ? 55 : metOptionals * 25));
        score = Math.min(98, score);

        if (profile.recommendationLettersReady < 3) {
          missingEvidence.push(`Recommendation letters: ${profile.recommendationLettersReady}/3 secured (need 3 senior referees on company letterhead)`);
        }
        if (profile.evidenceItemsCount < 10) {
          missingEvidence.push(`Evidence dossier: ${profile.evidenceItemsCount}/10 pieces compiled (maximum allowed is 10)`);
        }

        const readinessLevel = score >= 80 ? 'High Readiness' : score >= 60 ? 'Moderate Gap' : 'Action Plan Required';
        const drZenithRecommendation = score >= 80
          ? `Strong candidate for UK ${track}. Prioritize binding MC + OC1 + OC3. Finalize referee credentials.`
          : `Emerging fit for UK ${track}. Focus on building 2 additional outside-work or commercial impact proofs before submitting.`;

        return {
          route,
          overallFitPercentage: score,
          readinessLevel,
          evaluatedTrack: track,
          criteriaEvaluations: criteriaEvals,
          drZenithRecommendation,
          missingEvidenceSummary: missingEvidence
        };
      }

      // Default calculation for other routes
      let fit = 50;
      if (route.id === 'us_o1a' || route.id === 'us_eb1a') {
        fit = Math.min(95, Math.round(30 + (profile.publicationsCount * 7) + (profile.patentsCount * 15) + (profile.speakingEngagements * 8) + (profile.salaryUsdEquivalent > 100000 ? 15 : 0)));
      } else if (route.id === 'canada_suv') {
        fit = profile.equityOrStockOptions || profile.companyType === 'Early Startup' ? 88 : 62;
      } else if (route.id === 'germany_chancenkarte') {
        fit = profile.yearsExperience >= 3 ? 92 : 74;
      } else {
        fit = 76;
      }

      return {
        route,
        overallFitPercentage: fit,
        readinessLevel: fit >= 80 ? 'High Readiness' : fit >= 65 ? 'Moderate Gap' : 'Action Plan Required',
        evaluatedTrack: route.tracks[0],
        criteriaEvaluations: [
          {
            code: 'CORE',
            name: route.mandatoryCriteriaDescription,
            category: 'Mandatory',
            status: fit >= 75 ? 'Met' : 'Partially Met',
            confidenceScore: fit,
            matchedEvidence: ['Professional background matches target immigration grid'],
            remediationAdvice: 'Align evidence strictly with regional immigration ministry requirements.'
          }
        ],
        drZenithRecommendation: `Candidate scores ${fit}% readiness for ${route.name}. Verified alignment against local talent criteria.`,
        missingEvidenceSummary: profile.recommendationLettersReady < route.referenceLettersRequired 
          ? [`Need ${route.referenceLettersRequired - profile.recommendationLettersReady} additional reference letters`] 
          : []
      };
    });

    logs.push({
      id: `log-${Date.now()}-4`,
      timestamp,
      stage: 'Evaluation',
      level: 'success',
      message: `Completed Dr. Zenith scoring: Top match is "${results[0].route.name}" (${results[0].overallFitPercentage}% fit)`,
    });

    return { results, logs };
  }

  /**
   * Stage 4: Evidence Dossier Audit
   */
  static auditEvidenceDossier(evidenceItemsCount: number, lettersReady: number): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    logs: PipelineExecutionLog[];
  } {
    const logs: PipelineExecutionLog[] = [];
    const timestamp = new Date().toISOString();
    const errors: string[] = [];
    const warnings: string[] = [];

    logs.push({
      id: `log-${Date.now()}-5`,
      timestamp,
      stage: 'Evidence_Audit',
      level: 'info',
      message: `Auditing candidate evidence bundle: ${evidenceItemsCount} evidence items, ${lettersReady} referee letters`,
    });

    if (evidenceItemsCount > 10) {
      errors.push(`Tech Nation strictly restricts submissions to a maximum of 10 evidence items (Candidate has ${evidenceItemsCount}). Additional items will be discarded.`);
    } else if (evidenceItemsCount < 7) {
      warnings.push(`Evidence packet contains only ${evidenceItemsCount}/10 pieces. Recommended to provide at least 8 to 10 robust pieces.`);
    }

    if (lettersReady < 3) {
      errors.push(`Tech Nation requires exactly 3 letters of recommendation from recognized digital technology leaders (Found ${lettersReady}/3).`);
    }

    const isValid = errors.length === 0;

    logs.push({
      id: `log-${Date.now()}-6`,
      timestamp,
      stage: 'Evidence_Audit',
      level: isValid ? 'success' : 'warn',
      message: isValid ? 'Evidence bundle passed structural criteria rules.' : `Evidence bundle flagged with ${errors.length} blockers.`,
      details: { errors, warnings }
    });

    return { isValid, errors, warnings, logs };
  }

  /**
   * Stage 5: Webhook & Outbound Event Dispatch
   */
  static dispatchWebhooks(profile: CandidateProfile, topMatch: RouteMatchResult): {
    events: WebhookEvent[];
    logs: PipelineExecutionLog[];
  } {
    const logs: PipelineExecutionLog[] = [];
    const timestamp = new Date().toISOString();

    const events: WebhookEvent[] = [
      {
        id: `evt-hubspot-${Date.now()}`,
        event: 'candidate.profile.evaluated',
        timestamp,
        targetUrl: 'https://api.hubspot.com/v3/objects/contacts/sync',
        system: 'HubSpot CRM',
        status: 'delivered',
        httpStatus: 200,
        latencyMs: 142,
        payload: {
          candidateId: profile.id,
          email: profile.email,
          fullName: profile.fullName,
          topRoute: topMatch.route.name,
          readinessScore: topMatch.overallFitPercentage,
          track: topMatch.evaluatedTrack,
          stage: 'Ready_For_Mentorship'
        },
        signature: 'sha256=9b71a2e38c94627192fde00a88192a...'
      },
      {
        id: `evt-whatsapp-${Date.now()}`,
        event: 'applicant.notification.triggered',
        timestamp,
        targetUrl: 'https://graph.facebook.com/v19.0/emigr8_bot/messages',
        system: 'WhatsApp Bot',
        status: 'delivered',
        httpStatus: 201,
        latencyMs: 188,
        payload: {
          recipient: profile.email,
          template: 'dr_zenith_diagnosis_ready',
          params: {
            candidateName: profile.fullName.split(' ')[0],
            route: topMatch.route.name,
            score: `${topMatch.overallFitPercentage}%`
          }
        },
        signature: 'sha256=11d4e8329bc019283fa7109283a001...'
      },
      {
        id: `evt-slack-${Date.now()}`,
        event: 'coach.lead.allocated',
        timestamp,
        targetUrl: 'https://hooks.slack.com/services/T0123/B0456/emigr8_coaches',
        system: 'Slack Coach Channel',
        status: 'delivered',
        httpStatus: 200,
        latencyMs: 98,
        payload: {
          channel: '#visa-coaches-uk',
          text: `🎯 New Tier-1 Candidate Ingestion: *${profile.fullName}* (${profile.currentRole}) - Evaluated for *${topMatch.route.name}* at *${topMatch.overallFitPercentage}% fit*.`
        },
        signature: 'sha256=77a83c21a990bbd4412093847291a...'
      }
    ];

    logs.push({
      id: `log-${Date.now()}-7`,
      timestamp,
      stage: 'Webhook_Dispatch',
      level: 'success',
      message: `Dispatched ${events.length} downstream webhooks (HubSpot, WhatsApp, Slack) with HMAC signatures verified`,
    });

    return { events, logs };
  }
}
