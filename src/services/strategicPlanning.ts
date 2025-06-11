import { BusinessType } from '@/types/businessTypes';
import { Strategy, MarketingPlan, GrowthStrategy } from '@/types/recommendations';
import { BusinessHealth } from './criticalThinking';
import { Review } from '@/types/reviews';

interface ReviewAnalysisData {
  reviews: Review[];
  commonTerms?: Array<{ text: string; count: number }>;
  monthlyReviews: number;
  averageRating: number;
}

export const generateLongTermStrategies = (
  data: ReviewAnalysisData,
  businessHealth: BusinessHealth,
  _businessType: BusinessType
): Strategy[] => {
  const strategies: Strategy[] = [];
  
  // Brand positioning strategy
  if (businessHealth.strengths.length > 0) {
    strategies.push({
      id: 'brand-differentiation',
      category: 'brand',
      title: 'Strengthen Brand Differentiation',
      description: 'Leverage your unique strengths to create a distinctive market position',
      timeframe: '6-12 months',
      actions: [
        `Emphasize your key strengths: ${businessHealth.strengths.join(', ')}`,
        'Develop unique brand messaging around these differentiators',
        'Train staff to consistently communicate brand values',
        'Create marketing campaigns highlighting unique aspects'
      ],
      expectedOutcomes: [
        'Increased brand recognition',
        'Premium pricing opportunities',
        'Higher customer loyalty',
        'Improved market share'
      ],
      resources: [
        'Marketing budget allocation',
        'Staff training time',
        'Brand consultant (optional)',
        'Creative design resources'
      ],
      risks: [
        'Message not resonating with target audience',
        'Competitors copying strategy',
        'Implementation inconsistencies'
      ],
      mitigations: [
        'Test messaging with focus groups',
        'Develop unique, hard-to-copy elements',
        'Regular staff training and monitoring'
      ]
    });
  }
  
  // Customer base expansion
  if (businessHealth.metrics.monthlyReviews < 100) {
    strategies.push({
      id: 'customer-expansion',
      category: 'customer',
      title: 'Expand Customer Base',
      description: 'Attract new customer segments while retaining existing ones',
      timeframe: '3-6 months',
      actions: [
        'Analyze current customer demographics from reviews',
        'Identify underserved market segments',
        'Develop targeted marketing campaigns',
        'Create segment-specific offers or services',
        'Partner with complementary businesses'
      ],
      expectedOutcomes: [
        'Increased customer diversity',
        'Higher monthly review volume',
        'Revenue growth from new segments',
        'Reduced dependency on single customer type'
      ],
      resources: [
        'Market research budget',
        'Marketing campaign funds',
        'Staff for new initiatives',
        'Partnership development time'
      ],
      risks: [
        'Alienating existing customers',
        'Diluting brand identity',
        'Resource allocation challenges'
      ],
      mitigations: [
        'Maintain core value proposition',
        'Test new offerings gradually',
        'Monitor existing customer satisfaction'
      ]
    });
  }
  
  // Digital transformation strategy
  strategies.push({
    id: 'digital-transformation',
    category: 'digital',
    title: 'Digital Presence Enhancement',
    description: 'Strengthen online presence and digital customer engagement',
    timeframe: '4-8 months',
    actions: [
      'Audit current digital presence',
      'Implement review response system',
      'Develop content marketing strategy',
      'Enhance social media engagement',
      'Create email marketing campaigns',
      'Implement online booking/ordering system'
    ],
    expectedOutcomes: [
      'Increased online visibility',
      'Better customer engagement',
      'More efficient operations',
      'Higher conversion rates'
    ],
    resources: [
      'Digital marketing budget',
      'Content creation resources',
      'Technology investments',
      'Staff training'
    ],
    risks: [
      'Technology adoption challenges',
      'ROI uncertainty',
      'Staff resistance to change'
    ],
    mitigations: [
      'Phased implementation approach',
      'Clear ROI metrics tracking',
      'Comprehensive staff training'
    ]
  });
  
  // Innovation strategy based on customer feedback
  if (data.commonTerms && data.commonTerms.length > 0) {
    strategies.push({
      id: 'service-innovation',
      category: 'innovation',
      title: 'Customer-Driven Innovation',
      description: 'Develop new offerings based on customer feedback patterns',
      timeframe: '2-4 months',
      actions: [
        'Analyze top customer requests from reviews',
        'Prioritize feasible innovations',
        'Pilot test new offerings with select customers',
        'Gather feedback and iterate',
        'Full rollout of successful innovations'
      ],
      expectedOutcomes: [
        'Increased customer satisfaction',
        'New revenue streams',
        'Competitive advantage',
        'Enhanced reputation for innovation'
      ],
      resources: [
        'R&D budget',
        'Staff time for development',
        'Testing and feedback systems',
        'Marketing for new offerings'
      ],
      risks: [
        'Innovation failures',
        'Customer rejection',
        'Resource drain'
      ],
      mitigations: [
        'Small-scale pilots first',
        'Continuous customer feedback',
        'Quick failure recognition'
      ]
    });
  }
  
  // Operational excellence strategy
  if (businessHealth.weaknesses.length > 0) {
    strategies.push({
      id: 'operational-excellence',
      category: 'operational',
      title: 'Operational Excellence Program',
      description: 'Systematically address operational weaknesses',
      timeframe: '6-12 months',
      actions: [
        `Address key weaknesses: ${businessHealth.weaknesses.join(', ')}`,
        'Implement quality control measures',
        'Develop standard operating procedures',
        'Create feedback loops for continuous improvement',
        'Invest in staff training and development'
      ],
      expectedOutcomes: [
        'Reduced customer complaints',
        'Improved efficiency',
        'Better consistency',
        'Higher staff morale'
      ],
      resources: [
        'Training budget',
        'Process improvement consultants',
        'Quality monitoring systems',
        'Management time'
      ],
      risks: [
        'Implementation resistance',
        'Short-term disruptions',
        'Cost overruns'
      ],
      mitigations: [
        'Change management program',
        'Phased rollout',
        'Clear budget controls'
      ]
    });
  }
  
  return strategies;
};

export const createMarketingPlan = (
  businessHealth: BusinessHealth,
  businessType: BusinessType,
  monthlyReviews: number
): MarketingPlan => {
  const needsGrowth = monthlyReviews < 100;
  
  const plan: MarketingPlan = {
    objectives: [
      needsGrowth ? 'Increase monthly reviews to 100+' : 'Maintain review momentum',
      'Attract diverse customer segments',
      'Build brand awareness and reputation',
      'Increase customer lifetime value'
    ],
    targetSegments: [],
    campaigns: [],
    contentStrategy: {
      themes: [],
      formats: ['Social media posts', 'Email newsletters', 'Blog articles', 'Video content'],
      frequency: 'Daily social media, Weekly email, Bi-weekly blog'
    },
    kpis: [
      'Monthly review count',
      'Average rating improvement',
      'Customer acquisition cost',
      'Customer lifetime value',
      'Social media engagement rate',
      'Email open and click rates'
    ]
  };
  
  // Define target segments based on business type
  switch (businessType) {
    case BusinessType.CAFE:
      plan.targetSegments = [
        {
          segment: 'Remote Workers',
          characteristics: ['Need wifi', 'Long stays', 'Regular visits'],
          channels: ['Instagram', 'LinkedIn', 'Local forums'],
          messaging: 'Your perfect work-from-cafe spot with reliable wifi and great coffee'
        },
        {
          segment: 'Social Groups',
          characteristics: ['Weekend visits', 'Group seating', 'Social atmosphere'],
          channels: ['Facebook', 'Instagram', 'Event platforms'],
          messaging: 'The ideal meeting spot for friends and family'
        }
      ];
      break;
    case BusinessType.RESTAURANT:
      plan.targetSegments = [
        {
          segment: 'Food Enthusiasts',
          characteristics: ['Quality focused', 'Social media active', 'Try new things'],
          channels: ['Instagram', 'TikTok', 'Food blogs'],
          messaging: 'Culinary experiences worth sharing'
        },
        {
          segment: 'Families',
          characteristics: ['Value conscious', 'Need variety', 'Kid-friendly'],
          channels: ['Facebook', 'Google Ads', 'Local newspapers'],
          messaging: 'Where families create delicious memories'
        }
      ];
      break;
    default:
      plan.targetSegments = [
        {
          segment: 'Local Community',
          characteristics: ['Regular visitors', 'Word of mouth', 'Value quality'],
          channels: ['Facebook', 'Instagram', 'Local events'],
          messaging: 'Your neighborhood favorite'
        }
      ];
  }
  
  // Create campaigns based on objectives
  if (needsGrowth) {
    plan.campaigns.push({
      name: 'Review Generation Blitz',
      objective: 'Increase monthly reviews to 100+',
      duration: '3 months',
      budget: '$2,000',
      expectedResults: '200% increase in reviews'
    });
  }
  
  plan.campaigns.push({
    name: 'Brand Awareness Push',
    objective: 'Increase local market awareness',
    duration: '6 months',
    budget: '$5,000',
    expectedResults: '30% increase in new customers'
  });
  
  // Content strategy themes based on strengths
  plan.contentStrategy.themes = [
    ...businessHealth.strengths.map(strength => `Highlight: ${strength}`),
    'Behind the scenes content',
    'Customer testimonials',
    'Special offers and events'
  ];
  
  return plan;
};

export const generateGrowthStrategies = (
  businessHealth: BusinessHealth,
  marketingPlan: MarketingPlan,
  _businessType: BusinessType
): GrowthStrategy[] => {
  const strategies: GrowthStrategy[] = [];
  
  // Review growth strategy
  if (businessHealth.metrics.monthlyReviews < 100) {
    strategies.push({
      id: 'review-growth',
      category: 'growth',
      priority: 'critical',
      title: 'Accelerate Review Generation',
      description: 'Implement systematic approach to increase review volume',
      reasoning: 'Low review volume limits online visibility and credibility',
      expectedImpact: '200%+ increase in monthly reviews',
      timeframe: '3 months',
      metrics: ['Monthly review count', 'Review response rate', 'Platform diversity'],
      actions: [
        'Train staff to ask for reviews at optimal moments',
        'Implement QR code system for easy review access',
        'Create email follow-up sequence',
        'Offer incentives for honest reviews',
        'Monitor and respond to all reviews'
      ],
      targetAudience: 'All satisfied customers',
      marketingChannels: ['Email', 'SMS', 'In-store signage', 'Receipt messages'],
      estimatedCost: '$500-1,000',
      expectedROI: '300%+ through increased visibility'
    });
  }
  
  // Customer acquisition strategy
  strategies.push({
    id: 'customer-acquisition',
    category: 'growth',
    priority: 'high',
    title: 'New Customer Acquisition Campaign',
    description: 'Targeted campaigns to attract new customer segments',
    reasoning: 'Diversifying customer base reduces risk and increases revenue',
    expectedImpact: '30% increase in new customers',
    timeframe: '6 months',
    metrics: ['New customer count', 'Acquisition cost', 'Retention rate'],
    actions: [
      'Launch targeted social media campaigns',
      'Partner with local businesses',
      'Host community events',
      'Implement referral program',
      'Create first-time visitor offers'
    ],
    targetAudience: marketingPlan.targetSegments[0]?.segment || 'New local customers',
    marketingChannels: ['Social media', 'Local partnerships', 'Events', 'Email'],
    estimatedCost: '$2,000-5,000',
    expectedROI: '200%+ within 12 months'
  });
  
  // Retention and loyalty strategy
  strategies.push({
    id: 'customer-retention',
    category: 'growth',
    priority: 'medium',
    title: 'Customer Loyalty Program',
    description: 'Build repeat business through systematic loyalty initiatives',
    reasoning: 'Retaining customers is 5x cheaper than acquiring new ones',
    expectedImpact: '50% increase in repeat visits',
    timeframe: '4 months',
    metrics: ['Repeat visit rate', 'Customer lifetime value', 'Program engagement'],
    actions: [
      'Design points-based loyalty program',
      'Create VIP tiers with exclusive benefits',
      'Implement birthday and anniversary rewards',
      'Develop mobile app or digital card system',
      'Regular communication with members'
    ],
    targetAudience: 'Existing customers',
    marketingChannels: ['Email', 'SMS', 'In-store', 'Mobile app'],
    estimatedCost: '$1,500-3,000',
    expectedROI: '400%+ through increased lifetime value'
  });
  
  return strategies;
};
